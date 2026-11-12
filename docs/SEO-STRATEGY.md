# SEO Strategy

## Brand identity

- Primary person: **Rizki Afandi**
- Alternate spelling: **Rizqi Afandi**
- Personal brand and website: **RizzDev**
- Main positioning: **Programmer & Technology Enthusiast**
- Website purpose: a personal programmer portfolio showing projects, practiced
  skills, and areas of technology exploration

Web and frontend development are practiced areas, not the full personal
identity. The technology interests on the homepage are explicitly described as
areas of learning, not professional expertise.

## Search intent

| Priority | Terms |
| --- | --- |
| Primary | Rizki Afandi, Rizqi Afandi, RizzDev |
| Secondary | Rizki Afandi portfolio, Rizki Afandi programmer, Rizki Afandi technology, RizzDev portfolio, Rizqi Afandi programmer |
| Long term | Rizki, programmer portfolio, technology enthusiast |

Use names and topics naturally in page titles, visible copy, and links. Do not
repeat keyword lists in page content or create near-duplicate pages for name
variants. “Rizki” is a broad query and its appearance or ranking cannot be
guaranteed by on-site changes.

## Page metadata

### Homepage (`/`)

- Title: `Rizki Afandi | Programmer & Technology Enthusiast | RizzDev`
- Description: Rizki Afandi adalah programmer dan technology enthusiast di
  balik RizzDev. Ia mengeksplorasi pemrograman, software, sistem komputer, dan
  teknologi melalui proyek personal.

### CV (`/cv/cv.html`)

- Title: `Rizki Afandi | Curriculum Vitae | RizzDev`
- Description: CV Rizki Afandi, programmer dan technology enthusiast di
  RizzDev. Lihat pendidikan, keahlian yang dipraktikkan, dan proyek personalnya.

Each public page has a page-specific canonical URL and matching Open Graph and
Twitter title, description, and social image. The homepage uses a 1200 × 630
JPEG preview at [`../media/og-image.jpg`](../media/og-image.jpg); its metadata
includes dimensions and descriptive alt text. The homepage hero and CV profile
images have intrinsic dimensions and high fetch priority to reduce layout
movement and help the above-the-fold image load promptly.

The legacy `meta keywords` field is intentionally omitted: it is not a Google
ranking signal.

## Structured data

The homepage and CV each describe a consistent entity graph:

- `WebSite` identifies **RizzDev**, with `Rizki Afandi Portfolio` as an
  alternate site name.
- `Person` uses the shared ID
  `https://rizz-portfolio.vercel.app/#person`, name **Rizki Afandi**,
  alternate names **Rizqi Afandi** and **RizzDev**, and the requested main
  positioning.
- The homepage defines the `WebSite` node and its name. The CV page refers to
  that shared `WebSite` ID instead of repeating its site-name definition.
- `ProfilePage.mainEntity` points to the same `Person` on both pages.
- `sameAs` contains only the GitHub, LinkedIn, and Instagram profiles already
  linked from the public site.

Broad learning interests are not emitted as `knowsAbout` claims. The visible
homepage labels them as exploration so they are not confused with professional
skills.

## Crawlability and indexability

- Production origin: `https://rizz-portfolio.vercel.app/`.
- The homepage and CV each declare a matching absolute canonical URL.
- [`../robots.txt`](../robots.txt) allows public crawling and points to the
  sitemap.
- [`../sitemap.xml`](../sitemap.xml) lists only the homepage and CV, not the
  admin dashboard. Keep each `lastmod` tied to actual page-content changes.
- The admin page has a `noindex, nofollow` robots meta tag. This is a crawler
  directive, not access control; authentication and backend policies remain
  responsible for security.
- Keep the public pages free of accidental `noindex` directives and localhost
  canonicals. Do not disallow `/admin/` in `robots.txt` while relying on its
  meta `noindex`, since crawlers need to fetch the page to see that directive.

## Content and project facts

The homepage keeps a screen-reader label for **Rizki Afandi** in its single H1;
the visible text cycles through the name, **Web Developer**, **Programmer**, and
**Technology Enthusiast**. The typing animation honors reduced-motion
preferences. Supporting copy introduces programming, software, and technology
naturally without adding a separate technology-interest section.

Keep project descriptions grounded in the content available on the site.
Problem statements, implementation details, technical challenges, outcomes,
and usage figures should only be added after they are confirmed; do not infer
or invent them to expand SEO copy.

## Social profile references

- [GitHub](https://github.com/RIZKIIk)
- [LinkedIn](https://www.linkedin.com/in/rizqi-afandi-603355381)
- [Instagram](https://instagram.com/rizz_xyz10)

Do not add unverified social accounts or change these identity references
without confirming ownership.

## Google Search Console

After deploying the changes:

1. Verify the production website property in Google Search Console.
2. Submit `https://rizz-portfolio.vercel.app/sitemap.xml`.
3. Use URL Inspection for the homepage and CV.
4. Run **Test Live URL** for each page.
5. If the live page is crawlable and canonicalized correctly, select **Request
   Indexing**.
6. Monitor the Indexing and Sitemaps reports for crawl or canonical issues.
7. Review Performance queries, impressions, clicks, CTR, and average position
   over time; assess name variants separately.

The source contains a Search Console verification meta tag, but its presence
does not prove property ownership or that a sitemap submission or indexing
request has been made. Google controls crawling, indexing, display, and
rankings.

## SEO maintenance checklist

- Keep the full name first in page titles and use page-specific descriptions.
- Keep canonical, Open Graph, Twitter, and JSON-LD URLs on the production
  origin.
- Keep the `Person` ID and its name, aliases, role, image, and social links
  consistent across public pages.
- Keep one clear H1 per page and descriptive alt text for meaningful images;
  leave decorative backgrounds empty.
- Keep admin and other private pages out of the sitemap and mark them
  `noindex`; do not treat robots directives as security controls.
- Update sitemap `lastmod` only when the corresponding public page content
  changes.
- Re-validate JSON-LD as JSON, sitemap as XML, internal links, and responsive
  layouts after page changes.
- Measure Core Web Vitals with field or lab tooling after deployment. Source
  inspection alone does not establish LCP, INP, or CLS scores.
- Revisit Search Console after deployment; do not claim indexing or ranking
  outcomes without observing the reports.

## References

- [Google ProfilePage structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Google site names](https://developers.google.com/search/docs/appearance/site-names)
- [Google robots meta tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
