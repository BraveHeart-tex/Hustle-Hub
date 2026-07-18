# Agent Guide

Hustle Hub is a WXT + React browser extension. See README.md for what it does.

## Browser access for agents

Some skills (e.g. `impeccable`) need to drive the extension in a real Chrome
over the DevTools protocol. This project supports two dev modes, toggled by the
`WXT_MCP` env var:

- `yarn dev` - the human dev mode. WXT launches Chrome itself with the local
  dev profile. Agents should not use this.
- `WXT_MCP=1 yarn dev` - MCP mode. WXT builds and watches the extension but does
  not launch a browser, leaving port 9222 free for an agent-driven Chrome.

### To get browser access

1. Start the dev server in MCP mode (background):

   ```
   WXT_MCP=1 yarn dev
   ```

2. Launch (or reuse) the debug Chrome:

   ```
   scripts/browser-mcp.sh
   ```

   This opens Chrome with the `.wxt/chrome-mcp-profile` profile, loads the built
   extension from `.output/chrome-mv3-dev`, and exposes remote debugging on
   `http://localhost:9222`. It is idempotent - if the debug Chrome is already
   up it does nothing.

The extension's new-tab page is available in that Chrome once the extension is
loaded. Connect the DevTools/MCP client to `http://localhost:9222`.

### Assumptions

- Treat the UI as a desktop web surface. Do not assume mobile viewports.
