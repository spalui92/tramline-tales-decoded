// Everything that moves on the site. One clock (GSAP's ticker) drives smooth
// scrolling, scroll-linked animation, the cursor and the marquee, so they never
// drift apart. With "reduce motion" switched on, none of the decoration runs:
// the page simply appears, already in place.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { initRiver } from './river';
import { initHighways } from './highway';

gsap.registerPlugin(ScrollTrigger, SplitText);
(window as any).__tt = true;

const root = document.documentElement;
const motion = root.classList.contains('motion');
const $ = <T extends Element = HTMLElement>(s: string, p: ParentNode = document) => p.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, p: ParentNode = document) => Array.from(p.querySelectorAll<T>(s));
const pad = (n: number, l = 2) => String(Math.round(n)).padStart(l, '0');

/* ---------- smooth scroll ---------- */
let lenis: Lenis | null = null;
if (motion) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollToY(target: number | HTMLElement) {
  const offset = -(parseInt(getComputedStyle(root).getPropertyValue('--header-h')) || 64);
  if (lenis) lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : offset, duration: 1.6 });
  else {
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + offset;
    scrollTo({ top: y, behavior: 'auto' });
  }
}

/* ---------- header: hides going down, returns going up ---------- */
{
  const header = $('.site-header');
  let last = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (header) {
      // tale pages keep the whole bar under the tram in both directions; other pages tuck it away going down
      header.classList.toggle('is-hidden', y > last && y > 160 && !document.body.classList.contains('has-wire'));
      header.classList.toggle('is-solid', y > 40);
    }
    last = y;
  }, { passive: true });
}

/* ---------- the time in Howrah ---------- */
{
  const el = $('[data-clock]');
  if (el) {
    const place = el.textContent?.trim() || 'Howrah';
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    const tick = () => { el.textContent = `${place} ${fmt.format(new Date())} IST`; };
    tick(); setInterval(tick, 15000);
  }
}

/* ---------- same-page anchors and the rickshaw back to the top ---------- */
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (a && a.pathname === location.pathname && a.hash) {
    const t = document.getElementById(a.hash.slice(1));
    if (t) { e.preventDefault(); scrollToY(t); history.replaceState(null, '', a.hash); }
  }
  if ((e.target as Element).closest('[data-to-top]')) scrollToY(0);
});

/* ---------- page wipe: a panel in the next tale's colour ---------- */
const wipe = $('.wipe')!;
const wipeTitle = $('[data-wipe-title]')!;

function arrive(): Promise<void> {
  if (!root.classList.contains('arriving')) return Promise.resolve();
  let title = '';
  try { title = JSON.parse(sessionStorage.getItem('tt-wipe') || '{}').t || ''; sessionStorage.removeItem('tt-wipe'); } catch {}
  wipeTitle.textContent = title;
  return new Promise((resolve) => {
    gsap.timeline({ delay: 0.25, onComplete: () => { root.classList.remove('arriving'); gsap.set(wipe, { clearProps: 'all' }); } })
      .to(wipe, { yPercent: -100, duration: 1, ease: 'expo.inOut' })
      .add(() => resolve(), 0.35);
  });
}

if (motion) {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-wipe]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target === '_blank') return;
    e.preventDefault();
    const c = a.dataset.wipe!, t = a.dataset.wipeTo || '';
    try { sessionStorage.setItem('tt-wipe', JSON.stringify({ c, t })); } catch {}
    wipe.style.setProperty('--wipe', c);
    wipeTitle.textContent = t;
    gsap.fromTo(wipe, { yPercent: 100, visibility: 'visible' }, {
      yPercent: 0, duration: 0.8, ease: 'expo.inOut', onComplete: () => { location.href = a.href; },
    });
    gsap.fromTo($('.stop', wipe), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.35, ease: 'expo.out' });
  });
  // coming back with the browser's back button: lift the panel again
  addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(wipe, { clearProps: 'all' }); root.classList.remove('arriving'); } });
}

/* ---------- first visit: a tram ticket, punched ---------- */
function boardTicket(): Promise<void> {
  const loader = $('.loader');
  if (!loader || !root.classList.contains('first-visit')) { loader?.remove(); return Promise.resolve(); }
  try { sessionStorage.setItem('tt-boarded', '1'); } catch {}
  const ticket = $('.ticket', loader)!, count = $('[data-count]', loader)!, punch = $('.punch', loader)!;
  const total = Number(count.dataset.total || 0), n = { v: 0 };
  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: () => { loader.remove(); root.classList.remove('first-visit'); } });
    tl.from(ticket, { yPercent: 50, rotate: -8, opacity: 0, duration: 0.9, ease: 'expo.out' })
      .to(n, { v: total, duration: 0.9, ease: 'power2.out', onUpdate: () => { count.textContent = pad(n.v, 3); } }, '-=0.3')
      .to(punch.children, { scale: 1, duration: 0.25, ease: 'back.out(3)', stagger: 0.09 }, '+=0.1')
      .to(ticket, { yPercent: -40, rotate: 5, opacity: 0, duration: 0.6, ease: 'power3.in' }, '+=0.3')
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '-=0.25')
      .add(() => resolve(), '-=0.7');
    loader.addEventListener('click', () => tl.timeScale(4));
  });
}

/* ---------- reveals ---------- */
function reveals() {
  if (!motion) {
    gsap.set('[data-reveal]', { opacity: 1 });
    gsap.set('[data-split], [data-hero-line]', { visibility: 'visible' });
    gsap.set('[data-draw] path', { strokeDashoffset: 0 });
    return;
  }
  // text that rises line by line from behind a mask
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.lines, { yPercent: 125, duration: 1.3, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      },
    });
  });
  // everything else: a quiet rise and fade
  $$('[data-reveal]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
}

/* ---------- home ---------- */
function hero() {
  const hero = $('.hero');
  if (!hero) return;
  const canvas = $<HTMLCanvasElement>('[data-river]', hero);
  if (canvas) initRiver(canvas, hero, motion);
  initHighways(hero, motion);
  if (!motion) return;

  const tl = gsap.timeline();
  // Crisp, lightweight editorial title-card reveal, without blurred smoke.
  const lines = $$('[data-hero-line]', hero);
  lines.forEach((line) => gsap.set(line, { visibility: 'visible', clipPath: 'inset(0 100% 0 0)' }));
  tl.to(lines, {
    clipPath: 'inset(0 0 0 0)', duration: 0.85, stagger: 0.14, ease: 'power2.out',
    onComplete: () => gsap.set(lines, { clearProps: 'clipPath' }),
  }, 0.1);
  const bn = $('.kicker .bn', hero);
  if (bn) tl.fromTo(bn, { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0 0 0)', duration: 0.6, ease: 'power2.out',
      onComplete: () => gsap.set(bn, { clearProps: 'clipPath' }) }, 0.75);
  tl.fromTo($$('.hero-intro, .hero-explore', hero), { opacity: 0, y: 9 },
    { opacity: 1, y: 0, duration: 0.45, stagger: 0.12, ease: 'power2.out' }, 1.5);
  const draw = $$('[data-draw] path', hero);
  tl.to(draw, { strokeDashoffset: 0, duration: 2.6, ease: 'power2.inOut', stagger: 0.12 }, 0.1);
  tl.from($$('.bridge .lamp', hero), { opacity: 0, duration: 0.4, stagger: { each: 0.03, from: 'center' } }, 1.4);
  tl.fromTo($('[data-reveal]', hero), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.65);

  // on the way out, the title lifts away and the bridge settles into the river haze
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.masthead', { yPercent: -18, opacity: 0.35, ease: 'none' }, 0)
    .to('.hero .bridge:not(.mirror)', { yPercent: 10, scale: 1.06, ease: 'none' }, 0);
}

function taleList() {
  const peek = $('[data-peek]');
  const list = $('.tale-list');
  if (!peek || !list || !motion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const xTo = gsap.quickTo(peek, 'x', { duration: 0.9, ease: 'expo.out' });
  const yTo = gsap.quickTo(peek, 'y', { duration: 0.9, ease: 'expo.out' });
  const imgs = $$('[data-peek-img]', peek);
  let active: HTMLElement | undefined;
  list.addEventListener('mousemove', (e) => { xTo(e.clientX + 48); yTo(e.clientY - (active?.offsetHeight ?? 300) / 2); });
  $$('.tale-row', list).forEach((row) => {
    row.addEventListener('mouseenter', () => {
      active = imgs.find((im) => im.dataset.peekImg === row.dataset.row);
      imgs.forEach((im) => im.classList.toggle('on', im === active));
    });
  });
  list.addEventListener('mouseleave', () => imgs.forEach((im) => im.classList.remove('on')));
}

/* ---------- the destination board: runs on its own, faster and in step with the scroll ---------- */
function board() {
  const boardEl = $('[data-board]');
  if (!boardEl || !motion) return;
  const track = $('.track', boardEl)!;
  const seq = $('.seq', boardEl)!;
  let x = 0, dir = 1, visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(boardEl);
  gsap.ticker.add((_, dt) => {
    if (!visible) return;
    const v = lenis ? lenis.velocity : 0;
    if (Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1;
    x -= dir * (0.05 + Math.min(Math.abs(v) * 0.02, 0.9)) * dt;
    const w = seq.offsetWidth;
    if (x <= -w) x += w;
    if (x > 0) x -= w;
    track.style.transform = `translate3d(${x}px,0,0)`;
  });
}

/* ---------- about: "Kolkata has a heartbeat of its own." ---------- */
// As the reader scrolls, the line is typed letter by letter with the cursor moving
// along; then a tram rides the overhead wire through a heartbeat blip, and a heart
// is drawn at the end of the line and starts to beat.
function heartbeat() {
  const fig = $('[data-beat]');
  if (!fig) return;
  const heart = $('[data-heart]', fig)!;
  if (!motion) { heart.classList.add('beating'); return; }
  const keys = $$('.k', fig);
  const text = $('p', fig)!, caret = $('[data-caret]', fig)!;
  const wire = $<SVGPathElement>('[data-wire]', fig)!, rider = $<SVGGElement>('[data-rider]', fig)!;
  const length = wire.getTotalLength();
  const clamp = gsap.utils.clamp(0, 1);
  gsap.set([wire, heart], { strokeDasharray: 1, strokeDashoffset: 1 });

  let shown = -1;
  const type = (n: number) => {
    if (n === shown) return;
    shown = n;
    keys.forEach((k, i) => k.classList.toggle('on', i < n));
    const at = keys[Math.max(0, n - 1)].getBoundingClientRect(), box = text.getBoundingClientRect();
    // sits just after the last letter typed, on its baseline
    caret.style.transform = `translate(${(n ? at.right : at.left) - box.left + 2}px, ${at.bottom - box.top - at.height * 0.2}px)`;
  };
  const ride = (q: number) => {
    const pt = wire.getPointAtLength(length * q);
    rider.setAttribute('transform', `translate(${(pt.x - 24.2).toFixed(1)} ${(pt.y - 0.8).toFixed(1)})`);
  };

  const update = (p: number) => {
    const typed = clamp(p / 0.6), drawn = clamp((p - 0.62) / 0.26), inked = clamp((p - 0.9) / 0.08);
    type(Math.round(typed * keys.length));
    caret.style.visibility = p < 0.62 ? 'visible' : 'hidden';
    wire.style.strokeDashoffset = String(1 - drawn);
    rider.style.opacity = drawn > 0 ? '1' : '0';
    ride(drawn);
    heart.style.strokeDashoffset = String(1 - inked);
    heart.style.fillOpacity = inked >= 1 ? '1' : '0';
    heart.classList.toggle('beating', inked >= 1);
  };
  update(0);
  // On phones a quick flick of the thumb would otherwise jump straight to the end. There the
  // drawing follows the scroll at a steady typewriter pace instead: never faster than the
  // whole line, wire and heart in about 3.6 seconds, catching up to wherever you have scrolled.
  const steady = matchMedia('(max-width: 760px)').matches;
  let target = 0, shownAt = 0;
  if (steady) {
    gsap.ticker.add((_, dt) => {
      if (shownAt === target) return;
      const step = Math.min(Math.abs(target - shownAt), dt / 1000 / 3.6);
      shownAt += Math.sign(target - shownAt) * step;
      update(shownAt);
    });
  }
  const follow = (p: number) => { target = p; if (!steady) update(p); };
  ScrollTrigger.create({ trigger: fig, start: 'top 82%', end: 'bottom 42%', onUpdate: (self) => follow(self.progress), onRefresh: (self) => follow(self.progress) });
}

/* ---------- footer: the zipper closes as "Still on the line" arrives ---------- */
function zipper() {
  const board = $('[data-zip]');
  const zip = board && $('.zipper', board);
  if (!board || !zip || !motion) return;
  const state = { v: 0 };
  ScrollTrigger.create({
    trigger: board, start: 'top 85%', end: 'bottom 75%', scrub: 0.6,
    onUpdate: (self) => { state.v = self.progress; zip.style.setProperty('--zip', state.v.toFixed(3)); },
  });
  zip.style.setProperty('--zip', '0');
}

/* ---------- a tale ---------- */
function tale() {
  const article = $('.tale');
  if (!article) return;
  // tram on the overhead wire = how far you have read
  const prose = $('[data-prose]');
  if (prose && $('.wire')) {
    ScrollTrigger.create({
      trigger: prose, start: 'top 60%', end: 'bottom bottom',
      onUpdate: (self) => setWire(self.progress),
      onRefresh: (self) => setWire(self.progress),
    });
  }

  const big = $('[data-bignum]');
  if (big && motion) {
    gsap.from(big, { yPercent: 30, opacity: 0, duration: 1.8, ease: 'expo.out', delay: 0.3 });
    gsap.to(big, { yPercent: -25, ease: 'none', scrollTrigger: { trigger: '.tale-hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  if (motion) {
    $$('[data-postcard]').forEach((fig) => {
      const box = $('[data-clip]', fig)!, img = $('img', box)!, card = $('.card', fig)!;
      gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
        .fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' }, 0)
        .fromTo(card, { y: 80, rotate: 0 }, { y: 0, rotate: getComputedStyle(fig).getPropertyValue('--r') || 0, duration: 1.4, ease: 'expo.out' }, 0)
        .fromTo(img, { scale: 1.3 }, { scale: 1.08, duration: 1.8, ease: 'expo.out' }, 0);
      gsap.fromTo(img, { yPercent: -3 }, { yPercent: 3, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    const stamp = $('[data-stamp]');
    if (stamp) {
      gsap.set(stamp, { opacity: 0 });
      ScrollTrigger.create({
        trigger: stamp, start: 'top 85%', once: true,
        onEnter: () => {
          gsap.timeline()
            .fromTo(stamp, { scale: 2.6, opacity: 0, rotate: -34 }, { scale: 1, opacity: 0.85, rotate: -14, duration: 0.42, ease: 'back.out(2.2)' })
            .fromTo('.signoff', { x: -4 }, { x: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' }, 0.32);
        },
      });
    }
  }

  const copy = $<HTMLButtonElement>('[data-copy]');
  copy?.addEventListener('click', async () => {
    const was = copy.textContent;
    try { await navigator.clipboard.writeText(copy.dataset.copy!); copy.textContent = 'Copied. Kindly paste.'; }
    catch { copy.textContent = copy.dataset.copy!; }
    setTimeout(() => { copy.textContent = was; }, 2400);
  });
  const share = $<HTMLButtonElement>('[data-share]');
  if (share && navigator.share) {
    share.hidden = false;
    share.addEventListener('click', () => navigator.share({ title: share.dataset.title, url: share.dataset.url }).catch(() => {}));
  }
}

/* ---------- the cursor ---------- */
function cursor() {
  const c = $('.cursor');
  if (!c || !motion || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const label = $('.label', c)!;
  const xTo = gsap.quickTo(c, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
  gsap.set(c, { x: innerWidth / 2, y: innerHeight / 2 });
  addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
  let current: Element | null = null;
  document.addEventListener('mouseover', (e) => {
    const t = (e.target as Element).closest<HTMLElement>('[data-cursor]');
    if (t === current) return;
    current = t;
    c.classList.remove('is-link', 'is-label');
    if (!t) return;
    const v = t.dataset.cursor!;
    const tint = getComputedStyle(t).getPropertyValue('--c').trim();
    c.style.setProperty('--accent', tint || '');
    if (v === 'link') c.classList.add('is-link');
    else { label.textContent = v; c.classList.add('is-label'); }
  });
  document.addEventListener('mouseleave', () => gsap.to(c, { opacity: 0, duration: 0.2 }));
  document.addEventListener('mouseenter', () => gsap.to(c, { opacity: 1, duration: 0.2 }));
}

/* ---------- landing page: the tram rides the wire as the whole page is read ---------- */
function setWire(p: number) {
  const wire = $('.wire'), fill = $('.wire .fill'), tram = $('.wire .tram');
  if (!wire || !fill || !tram) return;
  const q = Math.min(1, Math.max(0, Number.isFinite(p) ? p : 0));
  wire.style.setProperty('--p', q.toFixed(4));
  fill.style.transform = `scaleX(${q})`;
  tram.style.transform = `translateX(calc(${q} * (100vw - 46px)))`;
}
function pageWire() {
  if (!$('.wire') || $('.tale')) return; // tale pages track their own prose
  // plain scroll maths rather than a trigger, so the tram is placed on arrival, on back/forward and whenever the page grows
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    setWire(max > 0 ? scrollY / max : 0);
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  addEventListener('load', update);
  addEventListener('pageshow', update);
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(document.body);
  update();
}
// every page: put the tram in place straight away, even before the first scroll
setWire(0);

/* ---------- start ---------- */
cursor();
pageWire();
tale();
taleList();
zipper();
heartbeat();
board();
const ready = boardTicket().then(arrive);
ready.then(() => {
  hero();
  reveals();
  ScrollTrigger.refresh();
});
