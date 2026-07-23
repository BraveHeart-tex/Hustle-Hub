# Hustle Hub

Hustle Hub is a personal browser-extension dashboard for daily engineering work. It replaces the default new tab with a focused view of work that usually lives across GitLab, Jira, notes, alerts, and internal deployment pages.

## What It Does

### Dashboard

- Shows attention items from the backend attention stream.
- Lists GitLab merge requests waiting for your review and your draft merge requests.
- Lists Jira tickets across For You, Literally Working On, and Frontend Releases filters.
- Provides one-command refresh for active dashboard data.
- Includes global search for Jira tickets and GitLab merge requests with `Cmd/Ctrl + K`.

### Keyboard Shortcuts

Shortcuts only run when focus is not inside an input, textarea, select, or editable field.

- `j` opens the Jira filter menu.
- With Jira open: `f` selects For You, `l` selects Literally Working On, `r` selects Frontend Releases.
- `g` opens the GitLab filter menu.
- With GitLab open: `r` selects Review requested, `d` selects Draft merge requests.
- The two-key forms also work directly: `j f`, `j l`, `j r`, `g d`, `g r`.

### Notes

- Stores local rich-text notes in extension storage.
- Supports note filters, priorities, tags, linked Jira/GitLab work items, and task-list editing.
- Surfaces saved work-item comments from the header.

### GitLab Page Tools

- Adds a merge-request thread panel on GitLab MR pages.
- Highlights and jumps to MR discussions.
- Shows Jira status helpers when a Jira key can be resolved from the MR.
- Shows release/feature MR warnings based on the target branch.
- Adds reviewer and reviewer-preset tooling to GitLab MR forms.
- Adds MR form autofill helpers for feature and release workflows.

### Deployment Widget

- Injects a deployment widget on configured deployment pages.
- Reads deployment metadata from the page and fetches GitLab tag details from the backend.
- Uses env vars for the content-script match pattern and GitLab project path, so deployment-specific hosts do not need to live in source code.

## Requirements

- Node.js compatible with the current WXT/Vite toolchain.
- Yarn 1.x. The repo is pinned to Yarn `1.22.22`.
- A backend compatible with the routes in `src/lib/endpoints.ts`.
- Jira and GitLab access through that backend.

## Environment

Create a local `.env` file with:

```env
VITE_BASE_API_URL="https://your-api.example.com"
VITE_JIRA_BASE_URL="https://your-jira.example.com"
VITE_GITLAB_USER_ID="123456"
VITE_RELEASE_REVIEWER_USER_IDS="123456,234567"
```

To run the new-tab dashboard with realistic local fixtures instead of the
backend, add:

```env
VITE_USE_MOCK_DATA="true"
```

This supplies mock attention items, Jira tickets, and GitLab merge requests.
The attention event stream is disabled while mock data is enabled.

To enable the deployment widget, also set:

```env
VITE_DEPLOYMENT_WIDGET_MATCH="*://*.example.com/*"
VITE_DEPLOYMENT_WIDGET_PROJECT_PATH="group/subgroup/project"
```

`VITE_BASE_API_URL` should normally be the backend origin because generated
paths already include `/api`. Existing values ending in `/api` are normalized
for backward compatibility.

`VITE_GITLAB_USER_ID` must be a numeric user ID, and
`VITE_RELEASE_REVIEWER_USER_IDS` must be a comma-separated list of numeric user
IDs. `VITE_DEPLOYMENT_WIDGET_MATCH` must be a valid browser-extension match
pattern. WXT validates these values at startup/build time in `wxt.config.ts`.
If the deployment widget vars are omitted, the widget is disabled.

Match patterns are not secrets. They are removed from source code here, but they still appear in the built extension manifest because browsers require content-script matches there.

## Development

Install dependencies:

```bash
yarn install
```

Run Chrome development mode:

```bash
yarn dev
```

Run Firefox development mode:

```bash
yarn dev:firefox
```

Type-check:

```bash
yarn compile
```

Regenerate the committed API types while the backend is running locally on
port `47823`:

```bash
yarn api:generate
```

The generated file is committed so regular development and production builds
do not depend on a running backend. Regenerate it whenever the backend OpenAPI
contract changes and review the resulting diff.

Run unit tests:

```bash
yarn test
```

Lint and auto-fix:

```bash
yarn lint
```

## Build

Build for Chrome:

```bash
yarn build
```

Build for Firefox:

```bash
yarn build:firefox
```

Package extension zips:

```bash
yarn zip
yarn zip:firefox
```

## Local Deploy

The repo includes a local deployment script:

```bash
./scripts/deploy.sh
```

Check the script before running it if your local browser/profile paths differ.

## Project Structure

- `src/entrypoints/newtab` - dashboard and notes app entrypoint.
- `src/entrypoints/*.content.tsx` - GitLab and deployment-page content scripts.
- `src/components/newtab` - dashboard, notes, search, shortcuts, and settings UI.
- `src/components/mr-thread-panel` - GitLab MR thread tooling.
- `src/components/reviewer-presets` - GitLab reviewer and preset management.
- `src/hooks` - API and page-state hooks.
- `src/services` - typed OpenAPI request modules and the attention SSE adapter.
- `src/generated/openapi.ts` - committed types generated from the backend contract.
- `src/lib/storage` - extension-local storage helpers.

## Tech Stack

- WXT
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- TanStack Query
- OpenAPI Fetch
- TipTap
- cmdk
- Lucide React
