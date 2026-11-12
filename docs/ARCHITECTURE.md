# Architecture

## System overview

RizzDev Portfolio is a static website built with HTML, CSS, and browser-native
JavaScript ES modules. There is no package manager, bundler, server-side
application, or build step. The public portfolio, CV, and admin dashboard are
separate pages served from the same origin.

## Directory responsibilities

- `scripts/core/`: browser helpers shared by public-page features.
- `scripts/components/`: reusable public UI construction, such as project cards.
- `scripts/features/`: public-page interactions, each initialized by the
  portfolio entry point.
- `scripts/services/`: Supabase client creation and public read-only queries.
- `admin/scripts/services/`: admin-only query and Storage operations, plus
  image decoding, cropping, and WebP optimization.
- `admin/`: dashboard markup, styles, and its module entry point.
- `cv/`: CV markup, styles, and page-specific behavior.
- `media/`: local image, video, and project illustration assets.
- `docs/`: architecture, file ownership, and development guidance.

## Page initialization

### Public portfolio

`index.html` loads `portfolio-config.js`, stylesheets, and `script.js`. The
entry point initializes local UI features from `scripts/features/`, then
creates a Supabase client only when the public URL and anon key are configured.
Project cards and visual settings load independently; static HTML and local
assets remain available if the remote service is missing or fails.

### CV

`cv/cv.html` loads the shared configuration and `cv/cv.js` as an ES module.
The CV initializes its theme, print action, image fallbacks, and reveal effects
locally. On page load it uses the shared Supabase client and public repository
to update the profile image and published project list; static CV content is
the fallback.

### Admin

`admin/index.html` loads configuration and `admin/admin.js` as an ES module.
The module obtains a Supabase client using the shared client service and creates
an admin repository after configuration is available. `admin/scripts/services/
admin-repository.js` owns database and Storage queries. Image processing lives
in `image-processing.js`; the admin entry point retains dashboard rendering,
form coordination, and authentication flow.

## Data flow

The public portfolio and CV read published records through
`scripts/services/portfolio-repository.js`. The admin dashboard uses
`admin/scripts/services/admin-repository.js` for project CRUD, site settings,
and Storage. Admin forms validate values and prepare image assets before
calling the repository. UI components do not issue Supabase queries directly.

Local project markup and media are intentional fallbacks, not competing
database sources. The admin's one-time import action can copy the legacy
project set into Supabase; it skips titles that already exist.

## Supabase integration

`portfolio-config.js` provides the browser URL, public anon key, admin email,
and auth redirect URL. Supabase JS is loaded on demand by
`scripts/services/supabase-client.js` only when URL and anon key are present.
The anon key is public by design; row-level security and Storage policies are
the authorization boundary. Never place a service-role key in the frontend.

Database table definitions, RLS guidance, and Storage setup are maintained in
[`admin/README.md`](../admin/README.md). This repository does not change remote
schema or policies.
