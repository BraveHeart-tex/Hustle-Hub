# Claude Terminal Launcher

Launch a Claude Code session in a terminal, at the right local checkout, from a
button on a GitLab merge request page.

## Flow

```
CodeReviewCommandsShortcut (content script, on *.gitlab.com/*/-/merge_requests/*)
  -> sendMessage('launchClaude', { slug, prompt, permissionMode })   @webext-core/messaging
    -> background.ts onMessage('launchClaude')
      -> browser.runtime.sendNativeMessage('com.borakaraca.claude_launcher', { type: 'claude.launch', ... })
        -> native host: ~/.local/bin/claude-terminal-launcher   (zsh wrapper)
          -> node ~/projects/claude-terminal-launcher/dist/index.js
            -> resolve slug -> local dir, write a launch.command script
            -> open the terminal (Ghostty by default) running Claude in that dir
```

- **Extension** (`hustle-hub`): parses the GitLab slug from `window.location.href`
  and sends the _raw slug_. It does not know the filesystem layout.
- **Native host** (`~/projects/claude-terminal-launcher`): owns the slug -> directory
  mapping and all filesystem access. Single source of truth for config.

## Slug -> directory resolution

The extension sends the full GitLab project path, e.g.
`letgo-turkey/classifieds/frontends/pwa/classified`.

The host resolves it in `resolveProjectDirectory` (`src/index.ts`):

1. Take the **last path segment** (`classified`).
2. Look it up in `DIRECTORY_OVERRIDES` (keyed by full slug _or_ bare segment);
   fall back to the segment itself.
3. Reject anything not matching `[a-z0-9._-]` (blocks traversal / encoded slashes).
4. Resolve `~/projects/<name>`, `realpath` it, and require it to stay inside
   `~/projects` and be an existing directory.
5. On any miss: `{ ok: false, error: "No local checkout mapped for <slug>" }`.

Convention: local folder name == GitLab project (last segment). Only add a
`DIRECTORY_OVERRIDES` entry when they differ. New projects that follow the
convention need no code change.

## Terminal

Default is **Ghostty**: `spawn(GHOSTTY_BIN, ['-e', launchCommand], { detached: true }).unref()`.
Ghostty opens the window in its already-running instance, so the short-lived
host process can exit immediately.

Override with `CLAUDE_LAUNCHER_TERMINAL`:

- `ghostty` (default) -> `/Applications/Ghostty.app/Contents/MacOS/ghostty -e <script>`
- `terminal` -> `open -a Terminal <script>` (Terminal.app opens the `.command` file)

The generated `launch.command` is identical for both. On success it `exit`s
(window closes); on failure it `exec $SHELL` so the error stays visible.

## Reliability notes (things that have bitten us)

1. **Node path must be stable.** The wrapper (`~/.local/bin/claude-terminal-launcher`)
   points at `~/.local/share/fnm/aliases/default/bin/node`, the fnm _default alias_
   (stable). Do **not** point it at `~/.local/state/fnm_multishells/<id>/bin/node`
   — those are per-shell and fnm garbage-collects them, so the launcher dies
   silently once that shell ends.

2. **`sendNativeMessage` takes exactly 2 args under webextension-polyfill.**
   WXT's `browser` is the polyfill, which promisifies `sendNativeMessage` with
   `maxArgs: 2`. Call it as `await browser.runtime.sendNativeMessage(name, message)`.
   Passing a 3rd callback arg throws _"Expected at most 2 arguments"_ synchronously,
   the host never spawns (no launcher logs), and the messaging layer reports
   **"request timed out."**

3. **Native host origin must match the extension ID.** The host manifest
   (`~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.borakaraca.claude_launcher.json`)
   and the host's own `ALLOWED_ORIGINS` both pin
   `chrome-extension://<id>/`. The extension ID is **not** pinned via `manifest.key`,
   so an unpacked extension's ID is derived from its load path. If you load from a
   different folder, the ID changes and Chrome blocks the native connection
   (surfaces as "forbidden" / "host not found" on the button). Fix: update both
   allowlists to the current ID (`chrome://extensions`), or pin `manifest.key`
   for a deterministic ID.

## Files

| Concern             | File                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Button + slug parse | `src/components/mr-thread-panel/CodeReviewCommandsShortcut.tsx`                                        |
| Messaging contract  | `src/lib/messaging.ts` (`LaunchClaudeData`)                                                            |
| Background bridge   | `src/entrypoints/background.ts` (`launchClaude`)                                                       |
| Native host logic   | `~/projects/claude-terminal-launcher/src/index.ts`                                                     |
| Node wrapper        | `~/.local/bin/claude-terminal-launcher`                                                                |
| Host manifest       | `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.borakaraca.claude_launcher.json` |
| Host log            | `~/.local/state/claude-terminal-launcher/launcher.log`                                                 |

## Troubleshooting

- **"request timed out", no log entries** -> the host never spawned. Almost always
  the `sendNativeMessage` arg-count bug (note 2), or the wrapper's node path is
  stale (note 1). Check `launcher.log` timestamps against your click time.
- **"Could not establish connection. Receiving end does not exist."** -> the
  content script is orphaned. Reloading the extension tears down the background,
  but an already-open GitLab tab keeps running the _old_ content script with no
  background to reach. **Reload the GitLab tab.** During development run `pnpm dev`
  (WXT dev mode re-injects content scripts into open tabs on reload); this does not
  happen when hand-loading a `wxt build` output. This is not the async-`sendResponse`
  bug - `@webext-core/messaging` already keeps the channel open for async handlers.
  The button retries once to cover a service-worker cold-start race; a truly
  orphaned script fails both attempts and shows "reload this page".
- **Button shows "forbidden" / "host not found"** -> extension ID vs `allowed_origins`
  mismatch (note 3).
- **"No local checkout mapped for <slug>"** -> add a `DIRECTORY_OVERRIDES` entry or
  create the checkout under `~/projects`.
- After editing the host's `src/index.ts`, run `pnpm build` (host changes are live
  immediately; the host re-spawns per click). After editing the extension, rebuild
  and reload it in Chrome.
