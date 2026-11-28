# Agency inspiration: dark, motion-heavy creative sites

Research for the Tramline Tales rebuild. Collected 2026-10-04.

How this was gathered: the build container's network blocks most agency sites directly,
so the specs below come from public teardowns (a GitHub collection of extracted design
specs, Awwwards/Codrops case studies and write-ups). Colours, fonts and timings are as
reported there. Worth eyeballing the live sites yourself before locking anything in.

---

## 1. The shortlist

| Site | Mode | Why it matters for us |
|---|---|---|
| **basement.studio** | Permanently dark (`#000`, text `#E6E6E6`, one orange accent `#FF4D00`) | Closest to the "dark but plays with colour" brief. Hairline borders, zero radius, sticky-stacked project rows, pixel-sweep page transitions, giant wordmark footer. |
| **Dogstudio** | Near-black `#0E101A`, red accent `#FF4940` | Cinematic dark with **a different accent colour per case study** (7 swatches). Serif display (GT Sectra) + quiet sans body. Per-letter hero stagger. |
| **Resn** | Black stage, single peach accent `#FFDA93` | Kinetic typography (letters animated individually), sound design, minimal chrome in the four corners. |
| **K72** | Black + fluorescent lime `#D3FD50` | Huge uppercase type (9.5vw), line-by-line text reveals (135ms stagger), a hand-drawn circle that draws itself around a word, column-wipe loader. |
| **Lusion** | Dark/light switching, electric blue `#1A2FFB` + lime + purple | Heavy WebGL, odometer-style preloader, every heading split into chars/words that animate in. |
| **Stink Studios** | Duotone black/white, flips cleanly between themes | 200vh sticky hero with showreel, word-by-word H1 reveal, header hides on scroll down and returns on scroll up. Uses system fonts and still feels premium. |
| **Locomotive** | Light, but the motion grammar is the reference | "Type as motion": viewport-filling headlines that shear on scroll, case studies that open like magazine spreads, letter-shuffle hovers, Lenis smooth scroll. |
| **Obys** | Light, austere, print-like | Museum-label tone, one typeface, clip-path image reveals (`inset(50%) → 0`), magnetic cursor with a word inside it. |
| **Immersive Garden** | Warm grey + black footer | Serif display + neutral sans, letter-by-letter statement text, the footer doubles as a project directory, scroll-velocity cursor. |
| **Active Theory** | Dark, 3D | Navigation pill that reacts to scroll speed; full 3D environments (too heavy for an articles site, but the nav idea transfers). |

## 2. Patterns that keep showing up

**Colour**
- A true or near-black base (`#000`–`#121416`), off-white text (never pure white for body), and **one** loud accent used sparingly for hover, links and highlights.
- The playful move is a **per-piece accent**: each case study (for us: each article) gets its own colour that takes over cursor, links, progress bar and highlights while you read it. (Dogstudio, Lusion.)

**Type**
- A display face doing most of the visual work at very large sizes (8–14vw), paired with a calm sans or mono for body and labels.
- Serif display + sans body is the editorial default (Dogstudio, Immersive Garden, Locomotive). Small mono captions for dates, tags and counters.
- Tight negative tracking on display (-0.02 to -0.07em), generous line-height on body (1.5–1.75).

**Motion**
- One easing family across the whole site. Common choices: `cubic-bezier(.16,1,.3,1)` (expo-out, reveals) and `cubic-bezier(.215,.61,.355,1)` (UI).
- Timings: 150–200ms micro, 300–400ms state change, 600–900ms reveals and page transitions.
- Text is split into lines/words/letters and revealed from behind a mask (`translateY(102%) → 0`).
- Images reveal with clip-path wipes and a slow scale settle (1.15 → 1 over ~1.6s).
- Smooth scroll (Lenis) driving scroll-linked animation (GSAP ScrollTrigger).
- Page transitions so the site never "blinks": wipes, pixel sweeps, column drops.
- A preloader that's part of the brand (counter, logo mask, column wipe).
- Custom cursor that grows or picks up a label ("Read", "Drag") over interactive things. Turned off on touch.
- Header that hides on scroll down and comes back on scroll up; `mix-blend-mode: difference` so it reads over any background.

**Layout**
- 12-column grid, small gutters, zero border radius, no drop shadows. Depth comes from motion and layering, not effects.
- An oversized footer: giant wordmark, contact, index of all work.

**The gap nearly all of them leave open**
- Almost none respect `prefers-reduced-motion`, several lack alt text, and some hide focus rings. For an articles site this matters more than for a showreel: people come to *read*. We should do all the flash **and** stay calm and readable, with every animation off for anyone who asks their device for reduced motion.

## 3. What this means for Tramline Tales

The articles are the product; the site is the frame. So: agency-level energy on the
home page, the index and in transitions, and print-calm while actually reading.

Proposed direction (to confirm against your master prompt):

- **Base:** ink-black night, off-white paper-ish text.
- **Accent per article**, drawn from the Kolkata tram itself: tram yellow, tram green line, Puja red, ink blue. Each article "owns" its colour on its page and on its card.
- **Type:** an editorial serif for display (big, cinematic), a readable serif or sans for body, a typewriter/mono for dates, tags and stamps (keeps the typewritten soul of the current diary).
- **Signature moments:**
  - Preloader: a tram ticket punch or a route counter rolling to the article count.
  - Home: viewport-sized title that shears on scroll; article cards that reveal their postcard photo under a clip-path wipe; the cursor becomes a "Read →" label.
  - Reading view: scroll progress shown as a tram running along a line (continues the current site's tram progress bar); photos float in as postcards.
  - Footer: giant "Tramline Tales" wordmark plus the full article index.
  - Page transitions: a wipe in the article's own colour.
- **Keep from the current site:** all three articles word for word, every photograph and caption, the margin notes, tags, dates, signature and stamp, the motto, the share-link/preview setup, and the write-a-Markdown-file-and-commit publishing flow.

## 4. Recommended tech stack

Chosen so you never touch code to publish: you keep writing Markdown files exactly as now.

| Piece | Choice | Why |
|---|---|---|
| Site builder | **Astro** | Outputs a fast static site, reads Markdown articles natively, deploys free to GitHub Pages. Lusion's site uses it. |
| Animation | **GSAP** (+ ScrollTrigger, SplitText) | The industry standard behind most of the sites above. Now free, including the plugins. |
| Smooth scroll | **Lenis** | Used by Immersive Garden, Locomotive and most Codrops case studies. |
| Page transitions | Astro view transitions (or Swup) | Keeps the site feeling like one continuous piece. |
| WebGL (optional, one moment) | **OGL** or Three.js | For one hero effect, e.g. ink or a photo distortion on hover. Lazy-loaded and skipped on low-power devices. |
| Hosting | GitHub Pages via Actions | Same as today: commit an article and it publishes itself. |

Rules we hold ourselves to: reduced-motion fallback everywhere, alt text on every photo,
keyboard focus visible, text readable at phone width, page fast on Indian mobile networks
(heavy effects load only after the text).

---

## Sources

- Spec teardowns: github.com/Shuvam-Banerji-Seal/modern-design.md (`websites/` — basement, dogstudio, resn, k72, lusion, stinkstudios, locomotive, obys, immersive-g)
- Awwwards case study, Immersive Garden's new website: awwwards.com/case-study-immersive-gardens-new-website.html
- Active Theory: webgpu.com/showcase/active-theory-portfolio, thefwa.com/article/insights-active-theory-v4
- Codrops 2026 case studies (Arnaud Rocca, House of Yellow, Joffrey Spitzer, Trionn): tympanus.net/codrops/tag/case-study
- Agency round-ups: psychoactive.co.nz/content-hub/best-webgl-interactive-3d-agencies, awwwards.com/websites/webgl
