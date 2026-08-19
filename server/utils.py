import http.client
import os
import random
import re
import time
from urllib.parse import urlsplit

headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
}

# Statuses worth waiting out: throttling and transient server errors.
RETRY_STATUSES = {403, 408, 425, 429, 500, 502, 503, 504}
REDIRECT_STATUSES = {301, 302, 303, 307, 308}

MAX_ATTEMPTS = int(os.environ.get('SCRAPER_MAX_ATTEMPTS', '4'))
BACKOFF_SECONDS = float(os.environ.get('SCRAPER_BACKOFF_SECONDS', '2'))
REQUEST_TIMEOUT = float(os.environ.get('SCRAPER_TIMEOUT_SECONDS', '30'))
MAX_REDIRECTS = 3


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
  status = None
  for attempt in range(MAX_ATTEMPTS):
    current_host, current_path = host, path

    for _ in range(MAX_REDIRECTS + 1):
      status, response_headers, body = request(method='GET', host=current_host, path=current_path, params=params, headers=headers)
      if status not in REDIRECT_STATUSES or not response_headers.get('Location'):
        break
      current_host, current_path = _follow(current_host, current_path, response_headers['Location'])

    if 200 <= status < 300:
      return body

    if status not in RETRY_STATUSES:
      break

    # Exponential backoff with jitter, so a batch of comuni does not retry in lockstep.
    time.sleep(BACKOFF_SECONDS * (2 ** attempt) + random.uniform(0, 1))

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
