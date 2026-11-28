import { cfg, piecesNewestFirst, absolute } from '../lib/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  const items = piecesNewestFirst.map((t) => `
    <item>
      <title>${esc(t.title)}</title>
      <link>${absolute(t.path)}</link>
      <guid>${absolute(t.path)}</guid>
      <pubDate>${new Date(t.date + 'T09:00:00+05:30').toUTCString()}</pubDate>
      <description>${esc(t.summary)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(cfg.name)}</title>
    <link>${absolute()}</link>
    <description>${esc(cfg.description)}</description>
    <language>en-in</language>${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
