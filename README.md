# IVA Infrastructure — Website (Development Build)

Static, dependency-free rebuild of the IVA Infrastructure site with the new
brand mark, blueprint-inspired styling, and scroll/hover animation throughout.

## Structure

```
iva-site/
├── index.html          Home
├── about.html           About / process / stats
├── projects.html        Project grid + Imayam Villas spotlight
├── testimonials.html    Full client testimonial grid
├── albums.html          Photo gallery
├── contact.html         Contact form, info, embedded map
├── 404.html              Error page
├── assets/
│   ├── css/style.css     Single shared stylesheet (design tokens at top)
│   ├── js/main.js        Shared interactions (reveal, counters, carousel, nav)
│   └── images/logo.png   Cropped brand mark from the supplied logo
└── README.md
```

## Running locally

No build step. Open `index.html` directly in a browser, or serve the folder
with any static server, e.g.:

```
npx serve .
```

## Before going live

- **Images**: placeholder photography is pulled from the current
  ivainfra.in CDN. Swap in your own shoot/renders in `assets/images/`.
- **Contact form**: `contact.html` currently only shows a front-end
  confirmation (see `main.js`). Wire it to a form service (Formspree,
  Getform) or your own backend endpoint before deploying.
- **Map**: `contact.html` embeds a generic Google Maps query. Replace with
  your exact pinned location / Google My Business embed.
- **Analytics / GTM**: the original site used Google Tag Manager
  (GTM-5XND3TJP) — re-add your tracking snippet before launch.
- **Domain-specific meta**: update `<meta name="description">` per page
  and add Open Graph tags if you want rich social previews.

## Design tokens

Colors, type, and spacing are defined as CSS custom properties at the top of
`assets/css/style.css` — the brass accent (`--brass: #BC9705`) is sampled
directly from the supplied logo so the site matches the mark exactly.
