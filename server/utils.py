import http.client
import os
import random
import re
import threading
import time
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser

# Identify ourselves. Caasa.it publishes a robots.txt that reasons about named
# crawlers, so pretending to be Chrome is both rude and useless. Override with
# SCRAPER_USER_AGENT if a WAF rejects the honest one.
USER_AGENT = os.environ.get(
  'SCRAPER_USER_AGENT',
  'HoomesBot/1.0 (+https://github.com/pinkynrg/hoomes)',
)

headers = {
  'User-Agent': USER_AGENT,
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
}

# Statuses worth waiting out: throttling and transient server errors.
RETRY_STATUSES = {403, 408, 425, 429, 500, 502, 503, 504}
REDIRECT_STATUSES = {301, 302, 303, 307, 308}

MAX_ATTEMPTS = int(os.environ.get('SCRAPER_MAX_ATTEMPTS', '4'))
BACKOFF_SECONDS = float(os.environ.get('SCRAPER_BACKOFF_SECONDS', '2'))
# 429 means we are over the host's quota: seconds, not milliseconds, is the
# unit that gets us served again.
THROTTLE_BACKOFF_SECONDS = float(os.environ.get('SCRAPER_THROTTLE_BACKOFF_SECONDS', '10'))
MAX_RETRY_SLEEP = float(os.environ.get('SCRAPER_MAX_RETRY_SLEEP', '60'))
REQUEST_TIMEOUT = float(os.environ.get('SCRAPER_TIMEOUT_SECONDS', '30'))
MAX_REDIRECTS = 3

# Caasa.it documents its own ceiling in robots.txt: "RateLimitFilter (60
# richieste/minuto per IP)". Stay under it with headroom rather than probing
# for the edge; a host that publishes a Crawl-delay slows us down further.
MAX_REQUESTS_PER_MINUTE = float(os.environ.get('SCRAPER_MAX_REQUESTS_PER_MINUTE', '50'))
REQUEST_JITTER = float(os.environ.get('SCRAPER_REQUEST_JITTER', '0.3'))
RESPECT_ROBOTS = os.environ.get('SCRAPER_RESPECT_ROBOTS', '1') != '0'

MIN_REQUEST_INTERVAL = 60.0 / MAX_REQUESTS_PER_MINUTE if MAX_REQUESTS_PER_MINUTE > 0 else 0

_registry_lock = threading.Lock()
_host_locks = {}
_last_request_at = {}
_robots = {}


class DisallowedByRobots(Exception):
  """The host's robots.txt does not allow this path for our user agent."""

  def __init__(self, host, path):
    self.host = host
    self.path = path
    super().__init__('robots.txt on {} disallows {}'.format(host, path))


def _sanitize_robots(lines):
  """Rewrite wildcard rules into something RobotFileParser understands.

  The stdlib parser predates the wildcard extension and matches rule paths as
  plain prefixes, so `Disallow: /report*` silently matches nothing. Truncating
  a pattern at its first `*` gives the same prefix semantics for the common
  trailing-wildcard case and over-blocks (the safe direction) for the rest.
  A pattern that truncates to nothing cannot be expressed this way: it is left
  alone and reported, rather than being turned into a site-wide block.
  """
  sanitized = []

  for line in lines:
    directive, _, value = line.partition(':')
    if directive.strip().lower() not in ('allow', 'disallow') or '*' not in value and '$' not in value:
      sanitized.append(line)
      continue

    pattern = value.strip()
    prefix = pattern.split('*')[0].rstrip('$')
    if len(prefix) > 1:
      sanitized.append('{}: {}'.format(directive.strip(), prefix))
    else:
      print('robots.txt: cannot express rule "{}", ignoring it'.format(line.strip()))

  return sanitized


def _robots_for(host):
  """Fetch and cache the host's robots.txt. An unreachable or missing file is
  cached as 'everything allowed', which is what the standard prescribes."""
  with _registry_lock:
    cached = _robots.get(host)
  if cached is not None:
    return cached

  parser = RobotFileParser()
  try:
    status, _, body = request('GET', host, '/robots.txt')
    parser.parse(_sanitize_robots(body.splitlines()) if 200 <= status < 300 else [])
  except Exception:
    parser.parse([])

  with _registry_lock:
    _robots[host] = parser
  return parser


def _host_interval(host):
  """Our own spacing, or the host's Crawl-delay when it asks for more."""
  interval = MIN_REQUEST_INTERVAL
  if RESPECT_ROBOTS:
    try:
      declared = _robots_for(host).crawl_delay(USER_AGENT)
    except Exception:
      declared = None
    if declared:
      interval = max(interval, float(declared))
  return interval


def _throttle(host):
  """Block until this host may be hit again.

  The per-host lock is held across the sleep on purpose: it serialises the
  worker's threads so the spacing applies to the host, not to each thread.
  """
  interval = _host_interval(host)
  if interval <= 0:
    return

  with _registry_lock:
    lock = _host_locks.setdefault(host, threading.Lock())

  with lock:
    gap = interval + random.uniform(0, REQUEST_JITTER)
    last = _last_request_at.get(host)
    if last is not None:
      wait = gap - (time.monotonic() - last)
      if wait > 0:
        time.sleep(wait)
    _last_request_at[host] = time.monotonic()


def _retry_delay(status, response_headers, attempt):
  """How long to wait before retrying, honouring Retry-After when sent."""
  retry_after = response_headers.get('Retry-After')
  if retry_after:
    try:
      return min(float(retry_after), MAX_RETRY_SLEEP)
    except (TypeError, ValueError):
      pass  # HTTP-date form: fall back to our own backoff

  base = THROTTLE_BACKOFF_SECONDS if status in (429, 503) else BACKOFF_SECONDS
  return min(base * (2 ** attempt) + random.uniform(0, 1), MAX_RETRY_SLEEP)


class HttpError(Exception):
  """A page could not be retrieved. Never treat this as 'no results': doing so
  makes a throttled request look like an empty comune."""

  def __init__(self, status, host, path):
    self.status = status
    self.host = host
    self.path = path
    super().__init__('{} returned HTTP {} for {}'.format(host, status, path))


class ScrapeError(Exception):
  """A page was retrieved but does not look like the page we expected, so we
  cannot tell 'no listings' apart from 'blocked' or 'markup changed'."""


class PartialScrapeError(Exception):
  """Some pages were refused. Carries what was collected anyway, so the caller
  can save the progress before reporting the comune as failed."""

  def __init__(self, comune, collected, failures):
    self.comune = comune
    self.collected = collected
    self.failures = failures
    super().__init__('{}: {} of {} pages refused (first: {})'.format(
      comune, len(failures), len(collected) + len(failures), failures[0] if failures else 'n/a',
    ))


def request(method, host, path, params = None, headers = headers):
  conn = http.client.HTTPSConnection(host, timeout=REQUEST_TIMEOUT)
  try:
    conn.request(method, path, params, headers)
    res = conn.getresponse()
    return res.status, dict(res.getheaders()), res.read().decode('utf-8', errors='replace')
  finally:
    conn.close()


def _follow(host, path, location):
  """Resolve a Location header against the current host/path."""
  parts = urlsplit(location)
  if parts.netloc:
    return parts.netloc, (parts.path or '/') + ('?' + parts.query if parts.query else '')
  if location.startswith('/'):
    return host, location
  return host, path.rsplit('/', 1)[0] + '/' + location


def get(host, path, params = None, headers = headers):
  """GET a page, following redirects and retrying throttling with backoff.

  Raises HttpError when the host keeps refusing, so callers fail loudly
  instead of silently scraping an error page for listings.
  """
  if RESPECT_ROBOTS and not _robots_for(host).can_fetch(USER_AGENT, 'https://{}{}'.format(host, path)):
    raise DisallowedByRobots(host, path)

  status = None
  response_headers = {}

  for attempt in range(MAX_ATTEMPTS):
    current_host, current_path = host, path

    for _ in range(MAX_REDIRECTS + 1):
      _throttle(current_host)
      status, response_headers, body = request(method='GET', host=current_host, path=current_path, params=params, headers=headers)
      if status not in REDIRECT_STATUSES or not response_headers.get('Location'):
        break
      current_host, current_path = _follow(current_host, current_path, response_headers['Location'])

    if 200 <= status < 300:
      return body

    if status not in RETRY_STATUSES or attempt == MAX_ATTEMPTS - 1:
      break

    time.sleep(_retry_delay(status, response_headers, attempt))

  raise HttpError(status, host, path)


def calculate_match_percentage(comment, words):
    word_count = len(words)
    match_count = sum(1 for word in words if word in comment)
    match_percentage = (match_count / word_count) if word_count > 0 else 0
    return match_percentage


def remove_non_letters_and_split(input_string):
    # Use regular expressions to remove non-letter characters
    letters_only = re.sub(r'[^a-zA-Z\s]', '', input_string)
    # Split the cleaned string into a list of words
    words = letters_only.split()
    return words
