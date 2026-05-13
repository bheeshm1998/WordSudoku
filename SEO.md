# SEO Checklist for Word Sudoku

This document covers what has already been done programmatically and what still requires manual action from you.

---

## Done (already in code)

| What | File |
|------|------|
| Descriptive `<title>` tag | `code/src/index.html` |
| `<meta name="description">` | `code/src/index.html` |
| `<meta name="keywords">` | `code/src/index.html` |
| `<meta name="robots" content="index, follow">` | `code/src/index.html` |
| `<link rel="canonical">` | `code/src/index.html` |
| Open Graph tags (og:title, og:description, og:image, og:url, og:type) | `code/src/index.html` |
| Twitter Card tags | `code/src/index.html` |
| JSON-LD structured data (`WebApplication` schema) | `code/src/index.html` |
| PWA/mobile meta tags (theme-color, apple-mobile-web-app-*) | `code/src/index.html` |
| `robots.txt` | `code/src/robots.txt` |
| `sitemap.xml` | `code/src/sitemap.xml` |
| `robots.txt` and `sitemap.xml` included in Angular build output | `code/angular.json` |

---

## Required: Replace placeholder URLs

Every occurrence of `wordsudoku.xyz` in the files below must be replaced with your real domain (e.g. `wordsudoku.com`):

- `code/src/index.html` — canonical, OG, Twitter, and JSON-LD URLs
- `code/src/robots.txt` — Sitemap URL
- `code/src/sitemap.xml` — `<loc>` URL

**Search for all occurrences:**
```bash
grep -r "wordsudoku.xyz" code/src/
```

---

## Required: Create an OG (social share) image

The `og:image` and `twitter:image` meta tags point to `assets/og-image.png`.  
You need to create this image manually:

- **Dimensions:** 1200 × 630 px (standard for Twitter/Facebook/LinkedIn)
- **Content:** Game title, a screenshot of the board, and a short tagline
- **Tool suggestions:** Figma, Canva, or any image editor
- **Save to:** `code/src/assets/og-image.png`

Until this file exists, social-media link previews will show no image.

---

## Required: Create an Apple Touch Icon

The `<link rel="apple-touch-icon">` points to `assets/apple-touch-icon.png`.

- **Dimensions:** 180 × 180 px (PNG, no transparency)
- **Content:** A simplified version of your favicon / app icon
- **Save to:** `code/src/assets/apple-touch-icon.png`

Without this, iOS devices show a generic icon when someone adds the page to their home screen.

---

## Required: Deploy to a real domain

Search engines only index publicly reachable URLs. A `localhost` build gets zero organic traffic.  
Popular free/low-cost hosting options for Angular SPAs:

| Service | Notes |
|---------|-------|
| **Vercel** | `npm i -g vercel && vercel` from `code/dist/code/` |
| **Netlify** | Drag-and-drop `code/dist/code/` or connect GitHub |
| **GitHub Pages** | Use `angular-cli-ghpages`: `ng deploy` |
| **Firebase Hosting** | `firebase init hosting && firebase deploy` |

After deployment, replace all `wordsudoku.xyz` placeholders with the real URL.

---

## Required: Set up Google Search Console

1. Go to <https://search.google.com/search-console>
2. Add your domain as a property
3. Verify ownership (HTML file method is easiest — download the file and put it in `code/src/assets/`, then add it to the `assets` array in `angular.json`)
4. Submit your sitemap: `https://YOUR_DOMAIN/sitemap.xml`
5. Request indexing of the root URL

---

## Required: Core Web Vitals (performance)

Google uses Core Web Vitals (LCP, FID/INP, CLS) as a ranking signal.  
Run an audit after deployment:

```bash
npx lighthouse https://YOUR_DOMAIN/ --view
```

Or use Google PageSpeed Insights: <https://pagespeed.web.dev/>

Common Angular SPA optimizations:
- Enable production build (already the default): `npm run build`
- Add `loading="lazy"` to any `<img>` tags
- Ensure fonts use `display=swap` (already done in `index.html`)

---

## Optional but recommended: Angular Universal (Server-Side Rendering)

This is the single biggest SEO improvement for an Angular SPA. Without SSR, Google's crawler sees an empty `<app-root></app-root>` shell and must wait for JavaScript to execute before it can index any content.

**Add Angular Universal:**
```bash
cd code
ng add @nguniversal/express-engine
npm run build:ssr
npm run serve:ssr
```

After adding Universal, your hosting provider needs to run a Node server (not just static file serving). Vercel and Firebase Hosting both support this out of the box. If you prefer static hosting, use **pre-rendering** instead:

```bash
ng add @nguniversal/express-engine
npm run prerender   # generates static index.html at build time
```

Pre-rendering is simpler and works with any static host. Since Word Sudoku has only one route (`/`), pre-rendering is the recommended path.

---

## Optional: Web App Manifest (PWA)

A `manifest.json` makes the app installable from a browser and signals to search engines that this is a quality web app.

Create `code/src/manifest.json`:
```json
{
  "name": "Word Sudoku",
  "short_name": "WordSudoku",
  "description": "Fill the grid with letters — no repeated letters, no words.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add it to `code/src/index.html`:
```html
<link rel="manifest" href="manifest.json">
```

Add it to the `assets` array in `code/angular.json`:
```json
"src/manifest.json"
```

And create the icon files at 192×192 and 512×512 px.

---

## Optional: Google Analytics / tracking

Add Google Analytics 4 to track organic search traffic:

1. Create a GA4 property at <https://analytics.google.com>
2. Copy your Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to `code/src/index.html` just before `</head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```
