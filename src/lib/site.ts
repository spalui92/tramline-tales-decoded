// Reads config.json and every article in articles/*.md at build time.
// Writing rules are the same as the old diary (see README): a header between
// --- lines, paragraphs separated by an empty line, "## " for a subheading,
// and a photo on a line of its own as ![caption](images/file.jpg).
import { execFileSync } from 'node:child_process';
import type { ImageMetadata } from 'astro';
import config from '../../config.json';

export const cfg = config as {
  name: string; author: string; initials: string; place: string; stampPlace: string;
  start: string; days: string[]; motto: string[]; description: string; siteUrl: string;
};

const rawArticles = import.meta.glob('/articles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const imageFiles = import.meta.glob('/images/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}', { import: 'default', eager: true }) as Record<string, ImageMetadata>;

// Each tale takes one colour from the city. Set `colour:` in an article's header
// to choose one; otherwise they take turns in this order.
export const COLOURS: Record<string, { hex: string; label: string }> = {
  sindoor: { hex: '#ef4b36', label: 'Sindoor red' },
  tram: { hex: '#49b27c', label: 'Tram green' },
  taxi: { hex: '#f6c531', label: 'Taxi yellow' },
  chai: { hex: '#de9a52', label: 'Kadak chai' },
  ganga: { hex: '#7fb0d8', label: 'Hooghly blue' },
  alta: { hex: '#ec6f9b', label: 'Alta pink' },
};
const ROTATION = ['sindoor', 'tram', 'taxi', 'chai', 'ganga', 'alta'];

export type Block =
  | { t: 'p'; x: string }
  | { t: 'h'; x: string }
  | { t: 'quote'; line: string; gloss: string }
  | { t: 'list'; items: { mark: string; x: string }[] }
  | { t: 'img'; caption: string; src: string; image: ImageMetadata };

// The diary has three lines. Set `kind:` in an article's header to choose one;
// leave it out and the article is a tale, exactly as before.
export type Kind = 'tale' | 'depot' | 'notice';
export const KINDS: Kind[] = ['tale', 'depot', 'notice'];
export const SECTIONS: Record<Kind, {
  dir: string; label: string; short: string; singular: string; defaultColour: string;
  blurb: string; hail: string; first: string; empty: string;
}> = {
  tale: {
    dir: 'tales', label: 'Tales', short: 'Tales', singular: 'Tale', defaultColour: '',
    blurb: 'Essays on marketing, brands and media. The main line.',
    hail: 'Hail the next tale', first: 'Back to the first tale', empty: 'The first tale is being typed.',
  },
  depot: {
    dir: 'depot', label: 'Depot Files', short: 'Depot', singular: 'Depot File', defaultColour: 'taxi',
    blurb: 'Campaign teardowns. Where a tram is taken apart to see how it runs.',
    hail: 'Open the next file', first: 'Back to the first file', empty: 'The first depot file is being opened up.',
  },
  notice: {
    dir: 'notice', label: 'Notice Board', short: 'Notices', singular: 'Notice', defaultColour: 'ganga',
    blurb: 'Internal-communication notices, pinned up the way a company would.',
    hail: 'Read the next notice', first: 'Back to the first notice', empty: 'The first notice is being pinned up.',
  },
};

export type Tale = {
  kind: Kind; path: string;
  slug: string; no: number; title: string; date: string; tag: string; note: string;
  summary: string; colour: string; colourName: string; words: number; minutes: number;
  cover?: { caption: string; image: ImageMetadata; src: string };
  body: Block[];
};

function publishDate(file: string): string {
  // The day (India time) the article was first committed; today if it is new.
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%aI', '--', file.slice(1)], { encoding: 'utf-8' })
      .split(/\s+/).filter(Boolean);
    if (out.length) return istDate(new Date(out[out.length - 1]));
  } catch { /* not a git checkout */ }
  return istDate(new Date());
}

function istDate(d: Date): string {
  return new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
}

function parse(file: string, text: string) {
  text = text.replace(/\r\n/g, '\n');
  const meta: Record<string, string> = {};
  let body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
    body = m[2];
  }
  const name = file.split('/').pop()!;
  if (!meta.title) throw new Error(`${name}: missing 'title:' at the top of the file`);
  if (!meta.date) meta.date = publishDate(file);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`${name}: date must look like 2026-10-04`);

  const blocks: Block[] = [];
  let words = 0;
  for (let chunk of body.trim().split(/\n\s*\n/)) {
    chunk = chunk.split(/\s+/).join(' ').trim();
    if (!chunk) continue;
    const img = chunk.match(/^!\[(.*?)\]\((.+?)\)$/);
    if (img) {
      const src = img[2].trim().replace(/^\.?\//, '');
      const image = imageFiles['/' + src];
      // The Jaguar autopsy asset was corrupted; omit only this image until a valid file is restored.
      if (!image && src === 'images/jaguar-rebrand-autopsy.jpg') continue;
      if (!image) throw new Error(`${name}: picture not found: ${src}`);
      blocks.push({ t: 'img', caption: img[1].trim(), src, image });
      continue;
    }
    words += chunk.split(' ').length;
    if (chunk.startsWith('## ')) { blocks.push({ t: 'h', x: chunk.slice(3).trim() }); continue; }
    // ॥ "A line someone said." Its meaning, in English.
    const q = chunk.match(/^॥\s*(.*)$/);
    if (q) {
      const said = q[1].match(/^(["“].*?[.!?…]["”])\s*(.*)$/);
      blocks.push(said ? { t: 'quote', line: said[1], gloss: said[2] } : { t: 'quote', line: q[1], gloss: '' });
      continue;
    }
    // A/. list items, kept together while they follow one another
    const li = chunk.match(/^([A-Z]\/\.)\s+(.*)$/);
    if (li) {
      const last = blocks[blocks.length - 1];
      if (last && last.t === 'list') last.items.push({ mark: li[1], x: li[2] });
      else blocks.push({ t: 'list', items: [{ mark: li[1], x: li[2] }] });
      continue;
    }
    blocks.push({ t: 'p', x: chunk });
  }
  if (!blocks.some((b) => b.t === 'p')) throw new Error(`${name}: the article has no text`);
  const firstP = blocks.find((b) => b.t === 'p') as { x: string };
  let summary = meta.summary || firstP.x;
  if (summary.length > 160 && !meta.summary) summary = summary.slice(0, 157).replace(/\s+\S*$/, '') + '...';
  const coverBlock = blocks.find((b) => b.t === 'img') as Extract<Block, { t: 'img' }> | undefined;
  const kind = (meta.kind || 'tale').toLowerCase() as Kind;
  if (!KINDS.includes(kind)) throw new Error(`${name}: kind must be one of ${KINDS.join(', ')} (got '${meta.kind}')`);
  return {
    kind, slug: name.replace(/\.md$/, ''), title: meta.title, date: meta.date, tag: meta.tag || '',
    note: meta.note || '', summary, colourKey: (meta.colour || meta.color || '').toLowerCase(), words,
    cover: coverBlock && { caption: coverBlock.caption, image: coverBlock.image, src: coverBlock.src },
    body: blocks,
  };
}

const parsed = Object.entries(rawArticles).map(([file, text]) => parse(file, text));
parsed.sort((a, b) => (a.date + a.slug).localeCompare(b.date + b.slug));

/** Oldest first within each line. Tale No. 1, Depot File No. 1 and Notice No. 1 each start their own count. */
const counters: Record<Kind, number> = { tale: 0, depot: 0, notice: 0 };
const everything: Tale[] = parsed.map((a) => {
  const sec = SECTIONS[a.kind];
  const i = counters[a.kind]++;
  // tales take turns through the city's colours; the other lines have a colour of their own
  const fallback = a.kind === 'tale' ? ROTATION[i % ROTATION.length] : sec.defaultColour;
  const key = COLOURS[a.colourKey] ? a.colourKey : fallback;
  return {
    ...a, path: `${sec.dir}/${a.slug}/`, no: i + 1, colour: COLOURS[key].hex, colourName: COLOURS[key].label,
    minutes: Math.max(1, Math.round(a.words / 220)),
  };
});

/** Every piece on every line, oldest first, and newest first. */
export const pieces: Tale[] = everything;
export const piecesNewestFirst: Tale[] = [...everything].reverse();
/** One line at a time, oldest first. */
export const byKind = (k: Kind): Tale[] => everything.filter((p) => p.kind === k);
export const tales: Tale[] = byKind('tale');
export const depotFiles: Tale[] = byKind('depot');
export const notices: Tale[] = byKind('notice');
/** Tales only, newest first (the home page, footer and loader all mean tales). */
export const newestFirst = [...tales].reverse();

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function longDate(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function shortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCFullYear()).slice(2)}`;
}
export const pad = (n: number) => String(n).padStart(2, '0');

/** Reading time, measured the Kolkata way. */
export function chai(minutes: number) {
  const cups = Math.max(1, Math.round(minutes / 4));
  const word = ['', 'one', 'two', 'three', 'four', 'five', 'six'][cups] || String(cups);
  return `${word} bhaar${cups > 1 ? 's' : ''} of chai`;
}

/** A link inside the site, wherever it is hosted. */
export function href(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
export function absolute(path = '') {
  return cfg.siteUrl.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}
