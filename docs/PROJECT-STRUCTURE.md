# Project structure

```text
.
├── admin/
│   ├── admin.js
│   ├── admin*.css
│   ├── index.html
│   └── scripts/
│       ├── features/project-list.js
│       └── services/
│           ├── admin-repository.js
│           └── image-processing.js
├── cv/
│   ├── cv.css
│   ├── cv.html
│   └── cv.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   └── PROJECT-STRUCTURE.md
├── media/
│   ├── projects/
│   └── [local images and video]
├── scripts/
│   ├── components/
│   ├── core/
│   ├── features/
│   └── services/
├── index.html
├── motion.css
├── portfolio-config.js
├── script.js
└── style.css
```

## Root files

- `index.html`: public page markup, SEO metadata, and static project fallback.
- `script.js`: public page initialization; feature behavior belongs in
  `scripts/features/`.
- `style.css`, `motion.css`: public layout/theme styling and shared motion
  rules.
- `portfolio-config.js`: browser-visible Supabase and admin redirect settings.
- `robots.txt`, `sitemap.xml`: crawler instructions and canonical page listing.

## JavaScript modules

- `scripts/core/helpers.js`: reusable DOM, URL, escaping, and storage helpers.
- `scripts/components/project-card.js`: safe construction of a public project
  card from remote data.
- `scripts/features/`: page behaviors such as navigation, theme, contact form,
  animations, and project gallery.
- `scripts/services/supabase-client.js`: optional browser SDK loading and
  client construction.
- `scripts/services/portfolio-repository.js`: published project and site
  setting queries shared by the portfolio and CV.
- `admin/admin.js`: admin authentication and dashboard UI coordination.
- `admin/scripts/features/project-list.js`: filters and safely renders the
  admin project list.
- `admin/scripts/services/admin-repository.js`: admin project/settings and
  Storage operations.
- `admin/scripts/services/image-processing.js`: validates, crops, and converts
  uploaded images to WebP.
- `cv/cv.js`: CV theme, print, reveal, and remote-content initialization.

## Stylesheets and assets

The admin page loads its base stylesheet followed by feature additions for
overrides, recovery forms, upload controls, and site settings. The small
`admin-polish.css` stylesheet supplies the unprefixed line-clamp enhancement
alongside the base prefixed rule. `motion.css` is shared by the portfolio, CV,
and admin. Local fallback media is kept under `media/`; do not remove an asset
until all markup and script references have been checked.
