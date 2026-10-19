# Sillage — notes for AI coding agents

One HTML file: markup, inline CSS and inline scripts; GSAP with ScrollTrigger, Lenis smooth scroll, all from jsDelivr. No build step, no framework.

## Files
Work from the files: a page read through a link comes back as a summary, and a page rebuilt from it would differ.
```bash
curl -LO https://raw.githubusercontent.com/8bsite/creative-agency-website-template/main/index.html
curl -LO https://raw.githubusercontent.com/8bsite/creative-agency-website-template/main/AGENTS.md
curl -LO https://raw.githubusercontent.com/8bsite/creative-agency-website-template/main/LICENSE
curl -LO https://raw.githubusercontent.com/8bsite/creative-agency-website-template/main/CREDITS.md
```
In Windows PowerShell type `curl.exe`. Publish `index.html` with LICENSE and CREDITS.md; this file, README.md and `previews/` are not part of the site.

## Do not break
- Keep it one file unless the user asks otherwise; no framework or bundler for copy, colour or photo changes.
- Keep the ids and the `data-8b-section` / `data-8b-motion` attributes. Each section has its styles in `<style data-8b-part="section:<id>">` and its animation, if any, in `<script data-8b-part="scene:<id>">`.
- The scripts find these classes and attributes; when you change a section's markup, keep them or update the script:
  - `scene:hero`: `.m-mark__glyph` `.hero__push`
  - `scene:manifesto`: `.manifesto__line`
  - `scene:works`: `.works__card` `.works__plate`
  - `scene:feature`: `.feature__frame` `.feature__img` `.feature__title`
  - `scene:expertise`: `.expertise__row` `.expertise__portrait-in` `.expertise__body`
  - `scene:method`: `.method__track` `.method__frame`
  - `scene:crew`: `.crew__grid` `.crew__card`
  - `scene:footer`: `.m-mark__glyph`
  - `section-script:navigation`: `.nav__toggle` `.nav__menu` `.nav__close`
  - `section-script:works`: `.works__cell` `.works__card` `.works__status` `data-filter` `data-tags` `data-template`
- Colours, fonts, radii and shadows are CSS variables in the `:root` block (`data-8b-part="tokens"`); change them there and keep body text at 4.5:1 contrast or more.
- Animations run only when the visitor allows motion (`prefers-reduced-motion: no-preference`); the page must stay readable without them.
- A display line with `style="--len:N"` is sized to fill its width: N is its number of characters, spaces included (`Not what` → 8, `a brand says.` → 13).
- These neighbouring sections animate across their border: hero → manifesto, works → feature. Keep each pair next to each other, or that transition switches off.
- Keep the header comment and `<meta name="generator">`; the "Design: 8B" footer link is optional.

## Replace before publishing
- Everything marked `data-8b-placeholder` (og-image, favicon, email, phone, social); remove the attribute once the real value is in. With no real value: no preview image — delete the `og:image` tag and set `twitter:card` to `summary`; no phone, email or address — remove that link or row.
- Request the full reel (works): link to mailto:hello@ (subject Full reel) now; point them to your showreel URL (Vimeo, YouTube), or keep the email.
- Request the case (feature): link to mailto:hello@ (subject The Amber Hour) now; point them to the case study page or film of that project.
- Book the studio (studio): link to mailto:studio@ (subject Studio booking) now; point them to your booking form or calendar; remove the studio section if you have no space to rent.
- Invented demo facts (ask the user for the real ones; do not make up prices, dates or addresses):
  - Client and project names in works (Ondine Parfums — Night Bloom, Halcyon Eyewear — White Noise, Maison Orrel — Hard Line looks, Atelier Vauque — Volume Studies, Northe Joaillerie — Ten Rings, Lumen & Ash — Gilt, Casa Albar — Copper Line, Kestrel — Hands On), the hero caption "Halcyon — Red Season, campaign film", the featured project "The Amber Hour" for Ondine Parfums (feature) and the ten names in clients (also Brunner Genève, Vellum): all invented; publish only clients you may name.
  - "Eight stories from the last two seasons" (works note) and "some for one launch, most for years" (clients note).
  - Feature credits: "Two shoot days at Studio Sillage", "212 assets for 14 markets", "Edit, colour, 3D and retouch in-house" (feature).
  - Services and in-house claims: the five disciplines and their tags, including "AI-assisted workflows", "Rooftop daylight" and "Crew catering" (expertise), "one floor", "our own workshop", "one crew" (manifesto, expertise, method).
  - The studio and its specs: "Studio Sillage, Montreuil", "Six hundred square metres", "ten minutes from Paris", a 12 × 8 m cyclorama with 6 m clear height, a 140 m² north-facing rooftop, a workshop, chef-led catering "for crews of up to sixty" (studio, expertise).
  - Team: "Forty-two strategists, producers, editors and retouchers" (crew note), six named people with roles — Élise Marchetti, Tomasz Wren, Adaeze Okafor, Henri Paz, Noor Haddad, Julien Ferreira — shown with stock portraits (crew), and "We are hiring producers, retouchers and strategists" (crew).
  - Contacts: Clara Vidal, managing partner and Julien Ferreira, studio manager; "read every Friday"; the emails hello@, studio@, jobs@, press@sillage.example and the phones +33 1 00 00 00 00 / 01 (contact, navigation overlay, works and feature buttons, studio button, crew).
  - Addresses: "1 rue de l’Exemple, 75003 Paris" (office) and "2 rue de l’Exemple, 93100 Montreuil" (studio) are placeholders (contact).
  - Location: Paris and Montreuil in the meta description, the studio heading and "© 2026 Sillage. Paris — Montreuil." (footer).
- `<title>`, the meta description and the og tags; photos (Unsplash, see CREDITS.md) when the user has their own.

## Notes
- The wordmark is HTML text, one span per letter with a data-glyph copy for the trail: change the letters in both the hero and the footer and set --len to the number of letters.
- The works filter matches each card's data-tags against the buttons' data-filter values: keep them in sync when you change the categories.
- Without JavaScript the phone menu button cannot open the overlay and the works filter does nothing; all projects and links stay visible.
- The stencil slit in the wordmark is drawn in the page colour: while the split wordmark passes over the hero photo the slits show as thin white lines.
- On phones the width-filling email line in contact is set small (about 20 px) so a long address fits.

## Common edits
- Rebrand: search the old name (`Sillage`) in any letter case and replace every match; change the favicon letter and colours in `<link rel="icon">`.
- Photos: replace `src` and delete `srcset` and `sizes` (they list Unsplash sizes), keep `width`/`height` to the new photo's ratio, update `alt` and CREDITS.md.
- Remove a section: delete its markup, its `section:<id>` and `scene-style:<id>` styles, its `scene:<id>` and `section-script:<id>` scripts, and links to `#<id>`.
- Native scroll instead of smooth scroll: delete the Lenis block in `page-init` and the Lenis `<script>` tag.

## Check and publish
- Open the page at 375 and 1440 px, with reduced motion on, with the console open.
- Search `data-8b-placeholder` and the old name: nothing should be left but class names.
