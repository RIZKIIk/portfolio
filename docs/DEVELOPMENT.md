# Development

## Run locally

The project has no package manifest or build step. Serve the repository over
HTTP so ES modules and relative assets work:

```sh
python3 -m http.server 8000
```

Open `/`, `/cv/cv.html`, and `/admin/` on the local server. Supabase-dependent
features require valid browser configuration, database policies, and Storage
setup; do not use a production administrator account for destructive testing.

## Validate changes

Run JavaScript syntax checks and inspect the complete diff:

```sh
find . -type f -name '*.js' -not -path './.git/*' -print0 |
  xargs -0 -n1 node --check
git diff --check
```

When moving or adding modules, verify every relative import and HTML resource
path. For page changes, check responsive layout at 1440, 900, 768, 390, and
320 CSS pixels; inspect public interactions, admin login/dashboard states, and
CV screen and print layouts. Remote CRUD, authentication, uploads, and recovery
flows are not verified without an authorized test backend.

For SEO metadata, structured data, crawler directives, sitemap, and Search
Console procedures, follow [`SEO-STRATEGY.md`](./SEO-STRATEGY.md).

## Add a feature

1. Put public page behavior in one module under `scripts/features/`.
2. Keep `script.js` focused on initializing and coordinating those features.
3. Put reusable UI in `scripts/components/`, shared browser helpers in
   `scripts/core/`, and Supabase reads in `scripts/services/`.
4. For admin behavior, keep Supabase reads/writes in
   `admin/scripts/services/admin-repository.js`; put image processing in the
   image processing service rather than the page coordinator.
5. Preserve static HTML/media fallbacks and existing element IDs used by
   JavaScript.
6. Update this documentation and the relevant `.ai-context/` handoff notes if
   ownership, integration, or validation expectations change.

## Configuration and security

`portfolio-config.js` contains browser-visible settings only. The anon key is
not a secret; RLS and Storage policies enforce authorization. Never add a
service-role key, secret, or personal account credential to frontend code.
Consult [`../admin/README.md`](../admin/README.md) before changing Supabase
setup guidance.
