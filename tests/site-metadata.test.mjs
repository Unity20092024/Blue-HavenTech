import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteMetadata, crawlerFiles, pageMetadata, routes } from '../scripts/site-metadata.mjs';

const html = '<html><head><title>Haven BlueTech</title><meta name="description" content="Test description"/></head></html>';
test('unconfigured builds are noindex, omit fabricated canonicals, and emit valid empty sitemap', () => {
  const metadata=siteMetadata({});
  assert.equal(metadata.indexable,false);
  assert.match(pageMetadata(html,'/',metadata),/content="noindex,nofollow"/);
  assert.doesNotMatch(pageMetadata(html,'/',metadata),/rel="canonical"/);
  assert.match(crawlerFiles(metadata).robots,/Disallow: \//);
  assert.doesNotMatch(crawlerFiles(metadata).sitemap,/<loc>/);
});
test('Vercel Preview uses deployment URLs in sitemap but remains noindex', () => {
  const metadata=siteMetadata({VERCEL_ENV:'preview',VERCEL_URL:'haven-preview.vercel.app'});
  assert.equal(metadata.indexable,false);
  assert.equal((crawlerFiles(metadata).sitemap.match(/<loc>/g)??[]).length,routes.length);
  assert.match(crawlerFiles(metadata).sitemap,/https:\/\/haven-preview.vercel.app\/contact/);
  assert.doesNotMatch(pageMetadata(html,'/contact',metadata),/rel="canonical"/);
});
test('production requires an explicitly approved origin', () => {
  assert.throws(()=>siteMetadata({VERCEL_ENV:'production'}),/requires SITE_URL/);
  for (const SITE_URL of ['http://example.com','https://user:pass@example.com','https://example.com/path','https://example.com?x=1','https://example.com#x']) {
    assert.throws(()=>siteMetadata({SITE_URL}));
  }
});
test('production metadata uses a stable canonical, clean URLs, and crawlable sitemap', () => {
  const metadata=siteMetadata({VERCEL_ENV:'production',SITE_URL:'https://example.com/'});
  assert.match(pageMetadata(html,'/about',metadata),/rel="canonical" href="https:\/\/example.com\/about"/);
  assert.match(pageMetadata(html,'/about',metadata),/content="index,follow"/);
  assert.match(crawlerFiles(metadata).robots,/Allow: \//);
  assert.doesNotMatch(crawlerFiles(metadata).sitemap,/\.html/);
});
test('preview remains noindex even when production canonical is configured; 404 has no canonical', () => {
  const metadata=siteMetadata({VERCEL_ENV:'preview',SITE_URL:'https://example.com'});
  assert.match(pageMetadata(html,'/',metadata),/content="noindex,nofollow"/);
  assert.doesNotMatch(pageMetadata(html,'/404',metadata,true),/rel="canonical"/);
});

test('business-confirmed havenbluetech.com can be canonical without indexing a Preview', () => {
  const production = siteMetadata({VERCEL_ENV:'production',SITE_URL:'https://havenbluetech.com'});
  assert.match(pageMetadata(html,'/contact',production),/rel="canonical" href="https:\/\/havenbluetech.com\/contact"/);
  const preview = siteMetadata({VERCEL_ENV:'preview',SITE_URL:'https://havenbluetech.com'});
  assert.match(pageMetadata(html,'/contact',preview),/content="noindex,nofollow"/);
});
