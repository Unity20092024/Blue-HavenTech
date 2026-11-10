export const routes = ['/', '/about', '/services', '/how-it-works', '/contact', '/privacy', '/terms'];

function origin(value, name) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${name} must be an HTTPS origin with no credentials, path, query, or fragment.`);
  }
  return url.origin;
}

export function siteMetadata(env = process.env) {
  const canonicalOrigin = env.SITE_URL ? origin(env.SITE_URL, 'SITE_URL') : null;
  const production = env.VERCEL_ENV === 'production';
  if (production && !canonicalOrigin) {
    throw new Error('Production indexing requires SITE_URL set to the approved public HTTPS origin. Preview builds need no variables.');
  }
  const deploymentOrigin = env.VERCEL_URL ? origin(`https://${env.VERCEL_URL}`, 'VERCEL_URL') : null;
  return { canonicalOrigin, sitemapOrigin: canonicalOrigin ?? deploymentOrigin, indexable: production && Boolean(canonicalOrigin) };
}

export function crawlerFiles(metadata) {
  const { indexable, sitemapOrigin } = metadata;
  const urls = sitemapOrigin ? routes.map(route => `  <url><loc>${escapeXml(sitemapOrigin + route)}</loc></url>`).join('\n') : '';
  return {
    robots: `User-agent: *\n${indexable ? 'Allow: /' : 'Disallow: /'}\n${sitemapOrigin ? `Sitemap: ${sitemapOrigin}/sitemap.xml\n` : ''}`,
    sitemap: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  };
}

export function escapeXml(text) {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll("'", '&apos;');
}

export function pageMetadata(html, route, metadata, notFound = false) {
  const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? 'Haven BlueTech';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const canonical = !notFound && metadata.canonicalOrigin ? metadata.canonicalOrigin + route : null;
  const imageOrigin = metadata.canonicalOrigin ?? metadata.sitemapOrigin;
  const tags = [
    `<meta name="robots" content="${metadata.indexable && !notFound ? 'index,follow' : 'noindex,nofollow'}"/>`,
    '<meta property="og:type" content="website"/>',
    '<meta property="og:site_name" content="Haven BlueTech"/>',
    `<meta property="og:title" content="${escapeXml(title)}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    '<meta name="twitter:card" content="summary_large_image"/>',
    ...(canonical ? [`<link rel="canonical" href="${escapeXml(canonical)}"/>`, `<meta property="og:url" content="${escapeXml(canonical)}"/>`] : []),
    ...(imageOrigin ? [`<meta property="og:image" content="${escapeXml(imageOrigin)}/images/workspace-2400.webp"/>`, '<meta property="og:image:alt" content="Contemporary workspace with glass architecture"/>'] : []),
  ];
  return html.replace(/<meta name="robots"[^>]*\/?>/g, '').replace('</head>', tags.join('') + '</head>');
}
