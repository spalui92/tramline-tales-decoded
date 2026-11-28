import { pieces, newestFirst, absolute, cfg, SECTIONS, KINDS } from '../lib/site';

export function GET() {
  const start = newestFirst[0]?.date ?? cfg.start;
  const urls = [
    [absolute(), start], [absolute('archive/'), start],
    ...KINDS.map((k) => [absolute(`${SECTIONS[k].dir}/`), start]),
    ...pieces.map((t) => [absolute(t.path), t.date]),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `  <url><loc>${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
