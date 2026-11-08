#!/usr/bin/env python3
"""HTTP checks for the public marketing site. Does not sign in, send forms or use a browser."""
import concurrent.futures
import json
from pathlib import Path
import runpy
import sys
import urllib.request
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3017').rstrip('/')
Signals = runpy.run_path(str(Path(__file__).with_name('seo-regression.py')))['Signals']
PATHS = ['/', '/riwo', '/free-whatsapp-crm', '/blog/best-whatsapp-crm-uae-india',
         '/blog/test-whatsapp-crm-before-buying', '/blog/whatsapp-car-dealership-lead-follow-up',
         '/industries/automobile-dealers', '/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt']

def read(path):
    req = urllib.request.Request(BASE+path, headers={'User-Agent':'Scriwo-SEO-Verification/1.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        assert response.status == 200, path
        assert 'noindex' not in response.headers.get('X-Robots-Tag', '').lower(), path
        return path, response.read().decode()

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    pages = dict(pool.map(read, PATHS))
for path, text in pages.items():
    if path.endswith('.txt') or path.endswith('.xml'): continue
    p = Signals()
    p.feed(text)
    data = p.result()
    assert len(data['h1']) == 1, (path, data['h1'])
    assert data['canonical'] == ['https://www.scriwo.com'+('' if path == '/' else path)], (path, data['canonical'])
    assert not any('noindex' in str(r) for r in data['robots']), path
    assert {'Organization', 'WebSite', 'BreadcrumbList'} <= set(data['schema_types']) or path == '/', path
    if path.startswith('/blog/'): assert 'Article' in data['schema_types'], path
assert 'OAI-SearchBot' in pages['/robots.txt'] and 'PerplexityBot' in pages['/robots.txt']
assert 'Sitemap: https://www.scriwo.com/sitemap.xml' in pages['/robots.txt']
xml = ET.fromstring(pages['/sitemap.xml'])
urls = [e.text for e in xml.findall('{*}url/{*}loc')]
assert len(urls) == len(set(urls))
for path in PATHS:
    if path.startswith('/blog/'): assert 'https://www.scriwo.com'+path in urls
for path in ['/llms.txt', '/llms-full.txt']:
    assert '14 days' in pages[path] and ('No card' in pages[path] or 'without a card' in pages[path])
    assert 'not the WhatsApp Business API' in pages[path]
    assert 'free, AED and Enterprise accounts are set up by the onboarding team' not in pages[path]
assert '/blog/test-whatsapp-crm-before-buying' in pages['/blog/best-whatsapp-crm-uae-india']
assert '/blog/whatsapp-car-dealership-lead-follow-up' in pages['/industries/automobile-dealers']
assert 'signup=1&amp;plan=free' in pages['/free-whatsapp-crm']
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None
try:
    urllib.request.build_opener(NoRedirect).open(BASE+'/sitemap.xml.', timeout=30)
    raise AssertionError('Malformed sitemap did not redirect')
except urllib.error.HTTPError as error:
    assert error.code == 308, error.code
    assert urljoin(BASE+'/', error.headers['Location']) == BASE+'/sitemap.xml'
print(json.dumps({'base':BASE,'checkedPaths':len(PATHS),'sitemapUrls':len(urls),'result':'PASS'}))
