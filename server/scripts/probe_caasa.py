"""Ask caasa.it what it is willing to tell us in one request instead of thirty.

Hoomes currently fetches one detail page per listing, which is what pushes a
province scrape into the site's rate limit. This script reports whether the
search page (or the sitemap) already carries the fields we need, so the detail
fetch can be dropped or made conditional.

    cd server && poetry run python scripts/probe_caasa.py reggio-emilia carpineti

It goes through utils.get, so it obeys robots.txt and the same pacing as the
worker. Read-only: it writes nothing to the database.
"""

import re
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from bs4 import BeautifulSoup  # noqa: E402

import utils  # noqa: E402
from utils import get  # noqa: E402

HOST = 'www.caasa.it'
FIELDS = ('titolo', 'prezzo', 'superficie', 'descrizione', 'immagine', 'link')


def heading(text):
    print('\n== {} {}'.format(text, '=' * max(0, 66 - len(text))))


def probe_robots():
    heading('robots.txt')
    body = get(HOST, '/robots.txt')
    sitemaps = re.findall(r'(?im)^\s*sitemap:\s*(\S+)', body)
    delay = re.findall(r'(?im)^\s*crawl-delay:\s*(\S+)', body)
    print('user agent   : {}'.format(utils.USER_AGENT))
    print('our pacing   : {:.2f}s between requests ({:.0f}/min)'.format(
        utils.MIN_REQUEST_INTERVAL, utils.MAX_REQUESTS_PER_MINUTE))
    print('crawl-delay  : {}'.format(', '.join(delay) or 'none declared'))
    print('sitemaps     : {}'.format(', '.join(sitemaps) or 'none'))
    return sitemaps


def probe_sitemap(url):
    heading('sitemap {}'.format(url))
    path = url.split(HOST, 1)[-1] if HOST in url else url
    body = get(HOST, path)
    children = re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', body)
    lastmods = re.findall(r'<lastmod>\s*([^<\s]+)\s*</lastmod>', body)
    print('entries      : {}'.format(len(children)))
    print('with lastmod : {}{}'.format(
        len(lastmods),
        '  <- lets us skip listings that have not changed' if lastmods else '  <- no change detection',
    ))
    for child in children[:5]:
        print('  {}'.format(child))
    if len(children) > 5:
        print('  ... and {} more'.format(len(children) - 5))
    return children


def probe_search(province, comune):
    heading('search page for {}/{}'.format(province, comune))
    path = '/{}/{}/appartamento/in-vendita.html?page=1'.format(province, comune)
    body = get(HOST, path)
    soup = BeautifulSoup(body, 'html.parser')

    items = soup.find_all('div', attrs={'class': 'result-item'})
    print('result-items : {}'.format(len(items)))
    print('JSON-LD      : {} block(s)'.format(
        len(soup.find_all('script', attrs={'type': 'application/ld+json'}))))

    if not items:
        print('no results to inspect (comune may have no listings for this type)')
        return None

    first = items[0]
    text = first.get_text(' ', strip=True)
    print('\nfirst result-item, {} chars of text:'.format(len(text)))
    print('  {}'.format(text[:300]))
    print('\nfield              on search page?')
    found = {
        'titolo': bool(first.find(['h2', 'h3'])) or len(text) > 40,
        'prezzo': bool(re.search(r'\d[\d.\s]*\s*(?:€|euro)', text, re.I)),
        'superficie': bool(re.search(r'\d+\s*(?:m2|mq|m²)', text, re.I)),
        'descrizione': len(text) > 200,
        'immagine': bool(first.find('img')),
        'link': bool(first.find('div', attrs={'class': 'favorite-add'})),
    }
    for field in FIELDS:
        print('  {:<17}{}'.format(field, 'yes' if found[field] else 'NO'))

    container = first.find('div', attrs={'class': 'favorite-add'})
    return container['data-canonical'] if container and container.has_attr('data-canonical') else None


def probe_detail(page_link):
    heading('detail page {}'.format(page_link))
    soup = BeautifulSoup(get(HOST, page_link), 'html.parser')
    comment = soup.find('div', attrs={'class': 'opinion-main-text'})
    print('description  : {} chars'.format(len(comment.get_text(' ', strip=True)) if comment else 0))
    print('JSON-LD      : {} block(s)'.format(
        len(soup.find_all('script', attrs={'type': 'application/ld+json'}))))


def main():
    province = sys.argv[1] if len(sys.argv) > 1 else 'reggio-emilia'
    comune = sys.argv[2] if len(sys.argv) > 2 else 'carpineti'

    sitemaps = probe_robots()
    for url in sitemaps[:1]:
        children = probe_sitemap(url)
        for child in children[:1]:
            probe_sitemap(child)

    page_link = probe_search(province, comune)
    if page_link:
        probe_detail(page_link)

    heading('what this means')
    print('If "descrizione" is yes on the search page, the per-listing fetch can go:')
    print('that is ~30 requests per comune down to ~1.')
    print('If the sitemap carries lastmod, unchanged listings can be skipped entirely.')


if __name__ == '__main__':
    main()
