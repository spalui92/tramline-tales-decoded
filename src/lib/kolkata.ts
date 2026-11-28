// Photographs of the Kolkata that surrounds the journey: the five bylanes on the
// home page and the two narrow frames beside "Still on the line" in the footer.
// To change one, replace the file in images/kolkata/ with a picture of the same
// name (.jpg, .jpeg, .png or .webp). Until a file exists, its slot shows a dark
// panel instead, so nothing ever breaks.
import type { ImageMetadata } from 'astro';

const files = import.meta.glob('/images/kolkata/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { import: 'default', eager: true }) as Record<string, ImageMetadata>;

function find(name: string): ImageMetadata | undefined {
  const hit = Object.keys(files).find((k) => k.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase() === name);
  return hit ? files[hit] : undefined;
}

/** `pos` is the CSS object-position: which part of the photo stays in frame. */
export type Frame = { name: string; place: string; note: string; alt: string; pos: string; image?: ImageMetadata };

const frame = (name: string, place: string, note: string, alt: string, pos = '50% 50%'): Frame => ({ name, place, note, alt, pos, image: find(name) });

export const windows: Frame[] = [
  frame('kadak-cha', 'Kadak cha', 'Bangaliana without cha is pheeka. Poured from height, sipped from a bhaar.',
    'Tea poured from an old kettle into a clay bhaar', '50% 40%'),
  frame('yellow-taxi', 'Yellow taxi', 'Ola and Uber came later. A proud millennial still flags down the Ambassador, AC or no AC.',
    'A yellow Ambassador taxi on a Kolkata street', '50% 62%'),
  frame('bonedi-pujo', 'Bonedi barir pujo', 'Five days a year, an old thakurdalan becomes the whole para’s home. That is what hope looks like.',
    'Durga Puja in the courtyard of an old Kolkata family home, an alpana on the floor', '50% 55%'),
  frame('satyajit-ray', 'Satyajit Ray', 'A 50mm lens, and the conviction to land a dream through it.',
    'Satyajit Ray looking through a film camera', '60% 30%'),
  frame('college-street', 'College Street', 'The 90s smelled of groundwood paper. Still worth the detour.',
    'Book stalls stacked high on College Street', '50% 45%'),
];

// the two narrow arched frames beside "Still on the line" in the footer
export const sides: Frame[] = [
  frame('letterboxes', 'Letterboxes', 'Names on the door', 'Old family letterboxes on a weathered North Kolkata wall beside a green door', '32% 50%'),
  frame('rickshaw', 'Hand-pulled rickshaw', 'After the rain', 'A hand-pulled rickshaw on a wet North Kolkata lane', '55% 62%'),
];
