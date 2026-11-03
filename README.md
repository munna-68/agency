# Veranda — Mediterranean real estate

A static, no-build rebuild of an awwwards-style real estate site: a counting image preloader that morphs into the hero, PJAX page transitions, a "selection" menu that shrinks the current page into a preview slot, Lenis smooth scrolling and GSAP ScrollTrigger reveals.

## Run

Any static server works. `fetch()` is used for page transitions, so `file://` won't do.

```bash
python3 -m http.server 4317
```

Then open http://localhost:4317.

## Structure

```
index.html            home (single screen)
by-the-sea.html       category pages (same template)
evergreen.html
urban-living.html
rare-gems.html
about.html
contact.html
assets/css/style.css  all styles, tokens at the top
assets/js/app.js      preloader, router, transitions, menus, scroll animations
assets/vendor/        GSAP 3.13 (+ ScrollTrigger, SplitText, CustomEase), Lenis 1.1
assets/img/           stock photography (Unsplash)
```

Each HTML file only holds its own `<main class="page">`. The shared shell (preloader, selection menu, burger menu, header and fixed buttons) is injected by `app.js`.

## How the motion works

- **Preloader**: five frames open from the centre (`clip-path`) while a rolling odometer counts 0 → 100. The counter then slides out, the navy background wipes upward and the last frame flies into the page's hero visual.
- **Page transitions**: internal links are intercepted, the next page is fetched and mounted, then:
  - *default*: the new page rises from below while the old page lifts and darkens;
  - *from Our Selection*: the new page slides into the preview slot, then expands to full screen;
  - *from the burger menu*: the menu retracts while the new page rises.
- **Category hero**: a sticky section where the square visual grows to full bleed as you scroll.
- Data attributes drive reveals: `data-reveal="lines|fade|clip"`, `data-parallax="8"`, `data-intro="chars|lines|fade"`, `data-ui="dark|light"` (flips the fixed buttons).

## Fonts

| Role | Used here | Reference font |
| --- | --- | --- |
| UI and display | Google Sans 500 | Google Sans |
| Editorial serif | Fraunces 300, opsz 144 | Roslindale Display (commercial) |
| Wide caps labels | Archivo Expanded (wdth 125) | Monument Extended (commercial) |

If you license Roslindale or Monument Extended, add them with `@font-face` and swap `--serif` and `--wide` in `:root`.

## Images

All photos come from [Unsplash](https://unsplash.com) under the Unsplash License. Each file name maps to `https://unsplash.com/photos/<id>`:

| File | Unsplash photo |
| --- | --- |
| hero-home | 1786975357022-e04e5c4c9535 |
| sea-cover | 1765999906700-2d4dfd392966 |
| green-cover | 1776717163992-1919b844d715 |
| urban-cover | 1763550876764-d4d3651dc95f |
| gems-cover | 1766548729715-9471973631f1 |
| about-hero | 1778500124601-8ee572aa1e76 |
| about-colonnade | 1763026560154-15b46b74cc84 |
| about-portrait | 1763604608266-6ee862e562da |
| about-sail | 1519801584609-8ee5f072eddd |
| about-lounge | 1781456507603-39653d5f434a |

Gallery, row and full-bleed images follow the same pattern (`sea-1…5`, `green-row-1…3`, and so on).

Brand name, copy, quotes and figures are placeholders.
