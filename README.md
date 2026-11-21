# Tramline Tales

Old tracks, new thoughts. Essays on marketing, brands and media by Sharmistha Palui, written from Howrah.

Live at https://spalui92.github.io/tramline-tales-2

## Add a new article

Nothing changes from the old diary: you write a text file, commit it, and the site publishes itself.

1. Create a new file in the `articles/` folder. Name it after the publishing date, for example `2026-10-18.md`. (Two articles on one day: `2026-10-18-b.md`.)
2. Start the file with this header, then write the article underneath:

```
---
title: The title of the article
date: 2026-10-18
tag: marketing · craft
note: see p.1
summary: One or two lines for Google and link previews (optional).
colour: taxi
---

First paragraph. Leave an empty line between paragraphs.

## A subheading

More text.
```

Only `title` is required.

- `date`: leave it out and the site uses the day the file was first committed (India time).
- `tag`: the small label above the title.
- `note`: the handwritten scribble in the margin.
- `summary`: shown on the home page, in Google and in shared links. If left out, the first lines of the article are used.
- `kind` (optional): which line of the diary the piece belongs to. `tale` (the default, so existing articles need nothing), `depot` for a campaign teardown (shown as a **Depot File**), or `positioning` for an original brand-positioning study (shown in the **Brand Positioning Lab**). Each line has its own numbering, page (`/tales/`, `/depot/`, `/positioning/`), navbar link and stop on the home page's route map.
- `cover` (optional): which of the article's photos stands for it on the home page, in lists and in shared links, e.g. `cover: images/photo.jpg`. Leave it out and the first photo is used.
- `colour` (optional): the colour this tale wears on its page, its cursor, its page wipe and its card. Choose one of `sindoor`, `tram`, `taxi`, `chai`, `ganga` or `alta`. Leave it out and tales take turns through that list.

Special lines inside an article:

- **A photo**: put the picture in the `images/` folder and add a line of its own: `![a short handwritten caption](images/photo.jpg)`. It appears as a postcard with your caption written underneath.
- **A dialogue line**: start the paragraph with `॥`, then the line in quotes, then its meaning. Example: `॥ "Rasode mein kaun tha?" Who was in the kitchen?` It is set large, with the meaning underneath.
- **A quote signpost**: start the paragraph with `|>`, then the line in quotes, then who said it. Example: `|> "Method, order, and the little gray cells." Hercule Poirot, The Murder of Roger Ackroyd (1926)`. Quotes that follow one another hang on one tram pole as parchment placards, left and right.
- **A list**: start each paragraph with `A/.`, `B/.`, `C/.` and so on. Paragraphs that follow one another become one list.

3. Commit the file. GitHub rebuilds and republishes the site in about two minutes.

## The Kolkata photographs

The home page's "Kolkata Bylanes" (five photographs) and the two narrow frames in the footer ("Still on the line") use pictures kept in `images/kolkata/`. Each slot looks for a file with a fixed name (`.jpg`, `.jpeg`, `.png` or `.webp`):

| File name | Where it appears |
|---|---|
| `kadak-cha` | Bylane 01 |
| `yellow-taxi` | Bylane 02 |
| `bonedi-pujo` | Bylane 03 |
| `satyajit-ray` | Bylane 04 |
| `college-street` | Bylane 05 |
| `letterboxes` | Footer, left arched frame |
| `rickshaw` | Footer, right arched frame |

To swap a picture, upload a new file with the same name. Until a file is there, its slot shows a dark panel, so nothing breaks. The captions, and which part of each photo stays in frame, are set in `src/lib/kolkata.ts`.

## Change the site's name or details

Edit `config.json`: `name`, `author`, `initials`, `place`, `stampPlace`, `start`, `days` (publishing days), `motto`, `description` and `siteUrl` (the site's address).

## How it is built

- [Astro](https://astro.build) turns the articles into a fast static site and makes small, sharp versions of every photo.
- [GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering) handle the motion and smooth scrolling.
- The river under Howrah Bridge on the home page is a small WebGL shader written for this site (`src/scripts/river.ts`).
- Anyone whose phone or computer asks for reduced motion gets the same site, perfectly still.

To build it yourself (optional): install [Node.js](https://nodejs.org) 22, then run `npm install` and `npm run dev`, and open the address it prints. `npm run build` writes the finished site into `dist/`.

## One-time GitHub setup

In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
