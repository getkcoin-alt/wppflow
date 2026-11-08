#!/usr/bin/env python3
"""Compare rendered SEO signals against the pre-change build; no browser required."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / 'website/.next/server/app'
BASELINE = ROOT / 'docs/growth/SEO-INVARIANTS.json'

class Signals(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = []
        self.headings = []
        self.canonical = []
        self.robots = []
        self.languages = []
        self.schemas = []
        self.schema_ids = []
        self.capture = None
        self.buffer = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical.append(a.get('href'))
        if tag == 'link' and a.get('hreflang'): self.languages.append([a['hreflang'], a.get('href')])
        if tag == 'meta' and a.get('name') in ['robots', 'googlebot']: self.robots.append([a['name'], a.get('content')])
        if tag in ['h1', 'title'] or (tag == 'script' and a.get('type') == 'application/ld+json'):
            self.capture, self.buffer = tag, []
    def handle_data(self, data):
        if self.capture: self.buffer.append(data)
    def handle_endtag(self, tag):
        if self.capture != tag: return
        value = ''.join(self.buffer)
        if tag == 'title': self.title.append(value)
        if tag == 'h1': self.headings.append(' '.join(value.split()))
        if tag == 'script':
            def visit(obj):
                if isinstance(obj, list):
                    for item in obj: visit(item)
                elif isinstance(obj, dict):
                    t = obj.get('@type')
                    if t: self.schemas.extend(t if isinstance(t, list) else [t])
                    if obj.get('@id'): self.schema_ids.append(obj['@id'])
                    for child in obj.values():
                        if isinstance(child, (dict, list)): visit(child)
            visit(json.loads(value))
        self.capture = None
    def result(self):
        return dict(title=self.title, h1=self.headings, canonical=self.canonical,
                    robots=sorted(self.robots), hreflang=sorted(self.languages),
                    schema_types=sorted(set(self.schemas)), schema_ids=sorted(set(self.schema_ids)))

def signals():
    if not BUILD.exists(): raise SystemExit('Build the website first.')
    pages = {}
    for file in sorted(BUILD.rglob('*.html')):
        route = '/' + str(file.relative_to(BUILD)).removesuffix('.html')
        if route == '/index': route = '/'
        parser = Signals()
        parser.feed(file.read_text())
        pages[route] = parser.result()
    if not pages: raise SystemExit('No rendered pages found.')
    return pages

def main():
    args = argparse.ArgumentParser()
    args.add_argument('--capture', action='store_true', help='Explicitly replace the baseline after a reviewed change')
    options = args.parse_args()
    pages = signals()
    if options.capture:
        BASELINE.write_text(json.dumps(pages, indent=2, ensure_ascii=False) + '\n')
        print(f'Captured {len(pages)} rendered pages.')
        return
    baseline = json.loads(BASELINE.read_text())
    errors = []
    for path, before in baseline.items():
        if path not in pages:
            errors.append(f'{path}: removed')
            continue
        for key, value in before.items():
            after = pages[path][key]
            # Enrichment may add schema types/ids but must retain the existing entities.
            valid = set(value) <= set(after) if key.startswith('schema_') else value == after
            if not valid: errors.append(f'{path}: changed {key}')
    for path, page in pages.items():
        if path in baseline: continue
        if len(page['title']) != 1 or len(page['h1']) != 1 or len(page['canonical']) != 1:
            errors.append(f'{path}: new page needs one title, H1 and canonical')
        if any('noindex' in str(r) for r in page['robots']): errors.append(f'{path}: new public page is noindex')
        if page['title'] in [v['title'] for p, v in pages.items() if p != path]: errors.append(f'{path}: duplicate title')
    if errors: raise SystemExit('\n'.join(errors))
    print(f'PASS: {len(baseline)} existing pages preserved; {len(pages)-len(baseline)} new pages checked.')

if __name__ == '__main__': main()
