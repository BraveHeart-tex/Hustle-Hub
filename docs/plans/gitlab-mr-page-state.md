# GitLab MR Page-State Module Implementation Plan

## Progress

| Checkpoint | Status  | Commit | Verification |
| ---------- | ------- | ------ | ------------ |
| 1          | Done    | ✅     | ✅           |
| 2          | Done    | ✅     | ✅           |
| 3          | Done    | ✅     | ✅           |
| 4          | Done    | ✅     | ✅           |
| 5          | Done    | ✅     | ✅           |
| 6          | Pending | —      | —            |
| 7          | Pending | —      | —            |
| 8          | Pending | —      | —            |
| 9          | Pending | —      | —            |
| 10         | Pending | —      | —            |

## Status

Approved interface contract; implementation not started.

This plan deepens GitLab MR page observation into one framework-neutral external-store module. The WXT content-script entrypoint owns the module lifetime. Rendering modules consume coherent GitLab MR page state through a thin React adapter while Jira, current-user, Strict Review, and Claude-launch decisions remain outside the seam.

## Accepted constraints

- `createGitLabMrPage(host)` synchronously establishes its initial state before returning:
  - `inactive` when the current URL is not an MR route.
  - `loading(identity)` when the current URL is an MR route.
  - `getSnapshot()` is valid immediately.
- Preserve the existing matcher on `src/entrypoints/mr-thread-panel.content.tsx`:

  ```ts
  matches: ['*://*.gitlab.com/*/-/merge_requests/*'];
  ```

  The migration does not inject the MR tooling on every GitLab page. An instance may observe navigation away from, or between, MR routes only after the MR-specific content script has started.

- The entrypoint creates exactly one `GitLabMrPage` and registers `page.dispose()` with `ctx.onInvalidated()`.
- `getSnapshot()` returns one cached, deeply immutable object until an observable state change is committed.
- `subscribe()` follows the `useSyncExternalStore` contract.
- `DiscussionRef` values are opaque, issued only in snapshots, and carry private module-owner, MR-epoch, and discussion identity.
- A new MR route creates a new epoch and immediately removes previous-MR facts from the observable state.
- DOM selectors, observation roots, mutation timing, SPA reconciliation, missing-versus-empty interpretation, discussion lookup, scrolling, and highlighting remain inside the module.
- Jira workflow policy, current-user policy, Strict Review decisions, and Claude-launch decisions remain in their existing domain callers.
- The React adapter is client-only and calls `useSyncExternalStore(subscribe, getSnapshot)` without a server snapshot.
- Production and fixture adapters implement the same `GitLabMrHost` interface. The fixture adapter supplies a real DOM and raw host signals; it must not return precomputed page facts or bypass reconciliation.

## Planned module layout

```text
src/lib/gitlab-mr-page/
├── gitlabMrPage.ts
├── gitlabMrPage.types.ts
├── gitlabMrDomHost.ts
├── gitlabMrPageReact.tsx
├── gitlabMrPage.test.ts
├── gitlabMrPageReact.test.tsx
└── testing/
    ├── createGitLabMrFixtureHost.ts
    ├── domFixtureEnvironment.test.ts
    └── fixtures/
        ├── mr-overview.html
        ├── mr-overview-empty-discussions.html
        ├── mr-overview-missing-regions.html
        ├── mr-overview-with-discussions.html
        └── second-mr-overview.html
```

The exact internal file split may be reduced if implementation proves smaller, but the public interface, production adapter, React adapter, and fixture adapter remain distinct responsibilities within the same deep module.

## Checkpoint rules

Each checkpoint is independently verifiable and should be committed separately. Do not begin the next checkpoint until its targeted tests, type-check, and formatting checks pass.

Rollback means reverting only the current checkpoint. Earlier checkpoints must remain valid and testable after that rollback.

---

## Checkpoint 1 — Establish the DOM-capable fixture environment

### Goal

Add a deterministic DOM-capable test environment without changing the repository-wide Vitest environment from Node.

Declare `linkedom` directly as a development dependency. Build a fixture host that:

- Parses sanitized HTML into a real `Document`.
- Implements the same `GitLabMrHost` interface planned for production.
- Exposes raw navigation notifications.
- Creates controlled mutation observers through the host interface.
- Allows tests to replace the current URL and `Document`.
- Records `scrollIntoView` requests without performing browser scrolling.
- Does not parse GitLab facts, select elements, debounce events, reconcile state, or look up discussions.

The fixtures must contain only sanitized structural HTML required by GitLab selectors. Do not commit full captured GitLab pages or private content.

### Behavior preserved

- All existing tests continue to run under Vitest’s Node environment.
- No production behavior or bundle changes.
- No application caller uses the new module yet.

### Files changed

- Modify `package.json` to add `linkedom` as a direct development dependency.
- Modify `yarn.lock`.
- Add `src/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost.ts`.
- Add `src/lib/gitlab-mr-page/testing/domFixtureEnvironment.test.ts`.
- Add the sanitized HTML files under `src/lib/gitlab-mr-page/testing/fixtures/`.
- Do not modify `vitest.config.ts` unless a concrete `linkedom` interoperability issue requires a narrowly scoped setup file.

### Tests added or updated

- Add a fixture-environment smoke test proving:
  - The fixture creates a queryable DOM.
  - Classes, data attributes, text content, and nested discussions behave like DOM data rather than precomputed facts.
  - Navigation changes update the host URL only after the test emits a navigation signal.
  - Controlled mutation observers fire only when the test emits a mutation.
  - Scroll requests are recorded with the actual selected element.
- Run all existing Node tests unchanged.

### Verification commands

```bash
yarn test src/lib/gitlab-mr-page/testing/domFixtureEnvironment.test.ts
yarn test
yarn compile
yarn prettier --check package.json src/lib/gitlab-mr-page/testing
```

### Rollback point

Remove the direct `linkedom` dependency, lockfile changes, fixture host, fixtures, and smoke test. The repository returns to its original Node-only test setup with no application changes.

---

## Checkpoint 2 — Introduce the public contract and synchronous initial state

### Goal

Add the new module before migrating any caller.

Define the accepted immutable types and the `GitLabMrPage` interface. Implement construction, cached snapshots, subscriptions, synchronous route recognition, and the first coherent DOM read through `GitLabMrHost`.

`createGitLabMrPage(host)` must synchronously:

1. Read `host.getHref()`.
2. Parse the normalized GitLab MR route.
3. Cache `inactive` or `loading(identity)`.
4. Return an instance whose `getSnapshot()` is immediately valid.
5. Schedule or start reconciliation without replacing `loading(identity)` with facts from another route.

Keep route parsing, selectors, fact normalization, missing-versus-empty semantics, deep freezing, and structural equality inside the module.

### Behavior preserved

- Existing rendering modules continue using their current hooks and DOM reads.
- The new module is not imported by production code.
- Existing MR tooling behavior is unchanged.

### Files changed

- Add `src/lib/gitlab-mr-page/gitlabMrPage.types.ts`.
- Add `src/lib/gitlab-mr-page/gitlabMrPage.ts`.
- Add `src/lib/gitlab-mr-page/gitlabMrPage.test.ts`.
- Update the fixture HTML only when a selector case required by the accepted contract is missing.

### Tests added or updated

Add interface-level tests using `createGitLabMrFixtureHost`:

- Construction outside an MR route synchronously returns the stable `inactive` object.
- Construction on an MR route synchronously returns `loading(identity)`.
- `getSnapshot()` is valid before any timer or promise is flushed.
- Repeated `getSnapshot()` calls return the same object identity.
- Initial reconciliation publishes `ready/current`.
- Snapshot identity, metadata, discussions, replies, and host appearance are deeply frozen.
- Scalars distinguish `null` from an empty string.
- Collections distinguish a missing host (`null`) from confirmed empty (`[]`).
- Partial missing markup still produces a current usable snapshot.
- Semantically identical reconciliation does not replace the cached state or notify subscribers.
- `subscribe()` does not call a listener during registration.
- After a committed state change, the cached object is replaced before listeners run.
- Unsubscribe is idempotent.

### Verification commands

```bash
yarn test src/lib/gitlab-mr-page/gitlabMrPage.test.ts
yarn test
yarn compile
yarn prettier --check src/lib/gitlab-mr-page
yarn eslint src/lib/gitlab-mr-page
```

### Rollback point

Delete the new contract, implementation, and tests. The fixture environment from Checkpoint 1 remains independently useful and passing; no production caller needs rollback.

---

## Checkpoint 3 — Complete epochs, mutation reconciliation, reveal, and disposal

### Goal

Complete the deep implementation before production wiring.

Add:

- New epochs for entering an MR route, changing project or MR number, and moving between MR overview and subpage routes.
- Immediate `loading(newIdentity)` publication on a new MR route.
- Same-epoch stale/current transitions for relevant DOM mutations.
- Coalesced reconciliation and rejection of delayed work from old epochs.
- `unavailable` only when an epoch has no coherent snapshot and observation fails.
- Same-epoch stale snapshot retention when a later observation fails.
- Opaque `DiscussionRef` values containing private module-owner, epoch, and discussion identity.
- Internal discussion lookup, scrolling, highlighting, and cleanup.
- Full idempotent disposal semantics.

Add the production `GitLabMrHost` adapter. It supplies raw browser primitives only:

- Current URL and `Document`.
- Raw navigation notifications from the existing main-world history bridge.
- Mutation observer creation.
- Host scrolling.

The production adapter must not own selectors, debounce timing, route interpretation, fact extraction, reconciliation, or discussion lookup.

### Behavior preserved

- The module remains unreferenced by production callers.
- Existing MR tooling continues using legacy observers.
- The existing main-world history patch remains the raw navigation signal source.
- No content-script matcher changes.

### Files changed

- Modify `src/lib/gitlab-mr-page/gitlabMrPage.ts`.
- Modify `src/lib/gitlab-mr-page/gitlabMrPage.types.ts` only if implementation exposes a missing accepted union member.
- Add `src/lib/gitlab-mr-page/gitlabMrDomHost.ts`.
- Expand `src/lib/gitlab-mr-page/gitlabMrPage.test.ts`.
- Update `src/lib/gitlab-mr-page/testing/createGitLabMrFixtureHost.ts` only to implement the same raw host capabilities added to production.
- Update sanitized fixtures for mutation, navigation, or discussion cases.

### Tests added or updated

Exercise all behavior through `GitLabMrPage`, with both adapters satisfying the same host contract:

- MR A `ready/current` → navigation → MR B `loading` with no MR A facts → MR B `ready/current`.
- Delayed MR A reconciliation cannot commit during MR B.
- Navigation away publishes `inactive` and invalidates MR references.
- Overview-to-subpage navigation starts a new epoch.
- Query-only URL changes remain in the epoch but reconcile `identity.href`.
- Relevant same-MR mutation publishes stale once, coalesces repeated signals, and then publishes current.
- A failed first observation publishes `unavailable`.
- A failed later observation retains the same-epoch snapshot as stale.
- A snapshot-created `DiscussionRef` reveals and highlights its discussion.
- A removed discussion returns `discussion-missing`.
- A previous-epoch reference returns `stale-reference`.
- A reference from another module instance returns `foreign-reference`.
- Disposal cancels pending reconciliation, removes highlight state, publishes `disposed` once, clears subscribers, and makes later operations inert.
- Fixture navigation, mutation, selector reads, and discussion lookup pass through the same module implementation used with the production adapter.

### Verification commands

```bash
yarn test src/lib/gitlab-mr-page/gitlabMrPage.test.ts
yarn test
yarn compile
yarn prettier --check src/lib/gitlab-mr-page
yarn eslint src/lib/gitlab-mr-page
```

### Rollback point

Revert the epoch/reconciliation/reveal/disposal additions and remove the production host adapter. Checkpoint 2’s unreferenced synchronous store remains valid and tested.

---

## Checkpoint 4 — Wire entrypoint ownership and the thin React adapter

### Goal

Create one `GitLabMrPage` in the existing MR-specific content-script entrypoint without migrating a rendering caller yet.

The entrypoint must:

- Keep its current `matches` and `excludeMatches` values unchanged.
- Construct the production host and one `GitLabMrPage`.
- Register `page.dispose()` with `ctx.onInvalidated()`.
- Provide the instance to the existing MR rendering tree through a client-only React context.
- Keep Shadow DOM mounting and CSS registration in the entrypoint.
- Remove the entrypoint’s unrelated fallback `url-change` MutationObserver only after the new module owns equivalent navigation reconciliation.

The React adapter must:

- Read the instance from context.
- Call `useSyncExternalStore(page.subscribe, page.getSnapshot)`.
- Omit a server snapshot.
- Never create or dispose a module instance.

Legacy callers remain active during this checkpoint, so duplicate fact observation is temporary and deliberate.

### Behavior preserved

- The MR tooling is still injected only for the existing MR-specific matcher.
- All visible MR controls retain existing behavior because no rendering caller has migrated.
- WXT invalidation now also disposes the dormant new module.

### Files changed

- Add `src/lib/gitlab-mr-page/gitlabMrPageReact.tsx`.
- Add `src/lib/gitlab-mr-page/gitlabMrPageReact.test.tsx`.
- Modify `src/entrypoints/mr-thread-panel.content.tsx`.
- Modify `src/components/mr-thread-panel/MrThreadApp.tsx` only as needed to receive the context provider without consuming state.

### Tests added or updated

- Add a focused React-adapter test using the DOM fixture environment and React DOM:
  - The hook renders the immediately available `loading(identity)` state.
  - A module publication rerenders the consumer.
  - An unchanged cached object does not cause an extra state transition.
  - The adapter provides no server snapshot behavior.
- Retain all module lifecycle tests.
- Add a source assertion or review check that the MR-specific matcher is byte-for-byte unchanged.

### Verification commands

```bash
yarn test src/lib/gitlab-mr-page/gitlabMrPageReact.test.tsx
yarn test src/lib/gitlab-mr-page
yarn compile
yarn build
rg -n "matches: \\['\\*://\\*.gitlab.com/\\*/-/merge_requests/\\*'\\]" src/entrypoints/mr-thread-panel.content.tsx
yarn prettier --check src/entrypoints/mr-thread-panel.content.tsx src/components/mr-thread-panel/MrThreadApp.tsx src/lib/gitlab-mr-page
```

### Rollback point

Remove the React adapter/context and restore the previous entrypoint mounting code. The completed page module and tests remain unreferenced and production behavior returns to the legacy path.

---

## Checkpoint 5 — Migrate the first caller: Strict Review and Claude shortcut

### Goal

Migrate `CodeReviewCommandsShortcut` first as the proving caller.

Replace its one-time reads of source branch, target branch, current URL, and project slug with the coherent external-store snapshot. Keep outside the page module:

- Template selection.
- Template rendering.
- Clipboard behavior.
- Claude payload construction.
- Launch messaging, retries, and feedback.
- Jira ID passed from its current caller until Jira/title migration is complete.

The rendering module remains hidden while required branch facts or the selected template are unavailable, preserving its current visible behavior.

### Behavior preserved

- Copy Review Prompt uses the selected Strict Review template.
- Launch Claude uses plan mode and retains retry/error behavior.
- Template selection remains local.
- The shortcut remains hidden without both source and target branches.
- Jira ID propagation remains unchanged at this checkpoint.
- The shortcut now receives coherent updates after same-MR mutations and MR navigation instead of retaining mount-time branch facts.

### Files changed

- Modify `src/components/mr-thread-panel/CodeReviewCommandsShortcut.tsx`.
- Add `src/components/mr-thread-panel/CodeReviewCommandsShortcut.test.tsx`.
- Update module fixtures only if the existing source/target branch HTML is insufficient.

### Tests added or updated

Using the real `GitLabMrPage` with the fixture adapter:

- The shortcut is absent during `loading`.
- It is absent when either branch is confirmed missing.
- It appears when both branch facts are available.
- Copy rendering receives snapshot source, target, and URL.
- A same-MR branch mutation updates the prompt only after stale/current reconciliation.
- An MR navigation never renders a prompt combining the previous MR’s branches with the new URL.
- Claude payload construction and retry behavior remain outside the page module.

### Verification commands

```bash
yarn test src/components/mr-thread-panel/CodeReviewCommandsShortcut.test.tsx
yarn test src/lib/gitlab-mr-page
yarn compile
yarn build
yarn prettier --check src/components/mr-thread-panel/CodeReviewCommandsShortcut.tsx src/components/mr-thread-panel/CodeReviewCommandsShortcut.test.tsx
yarn eslint src/components/mr-thread-panel/CodeReviewCommandsShortcut.tsx src/components/mr-thread-panel/CodeReviewCommandsShortcut.test.tsx
```

### Rollback point

Restore the shortcut’s local branch/URL readers and remove its new test. Entrypoint ownership, the React adapter, and the unconsumed page module remain intact.

---

## Checkpoint 6 — Migrate Jira inputs without moving Jira policy

### Goal

Move GitLab-authored Jira inputs to the new snapshot while keeping all Jira decisions outside the page module.

Use snapshot facts for:

- MR title.
- Target branch.
- Assignee IDs.
- Description text.
- Current MR URL.

Keep outside the page module:

- Title-derived Jira key selection.
- Release/FEREL key interpretation.
- `computeReadOnly`.
- Recommended Jira transitions.
- Transition execution, conditional commenting, refresh ordering, and errors.

Change `extractFerelId` from a DOM reader to a pure description-text interpreter. Derive the shared title Jira ID in the rendering orchestration rather than in the content-script entrypoint, then continue passing that caller-owned decision to Jira and Claude rendering modules.

Do not delete the old hooks in this checkpoint, even when they become unused. Cleanup happens only after every caller has migrated.

### Behavior preserved

- Feature MRs use the title-derived Jira key.
- Release MRs continue resolving FEREL from description text.
- Non-assignees remain read-only.
- Transition recommendations and side-effect ordering are unchanged.
- Jira comment creation still uses the current MR URL.
- Strict Review and Claude behavior remain outside the page module.

### Files changed

- Modify `src/components/mr-thread-panel/JiraStatusButton.tsx`.
- Modify `src/components/mr-thread-panel/MrThreadApp.tsx`.
- Modify `src/components/mr-thread-panel/CodeReviewCommandsShortcut.tsx` only if the caller-owned Jira ID moves at this checkpoint.
- Modify `src/lib/utils/misc/extractFerelId.ts`.
- Add `src/lib/utils/misc/extractFerelId.test.ts`.
- Add or update `src/components/mr-thread-panel/JiraStatusButton.test.tsx`.
- Modify `src/entrypoints/mr-thread-panel.content.tsx` to remove initial title/Jira extraction only after `MrThreadApp` derives it from snapshot state.

### Tests added or updated

Using the real page module and fixture adapter:

- Feature title produces the same Jira key outside the page module.
- Release description produces the same FEREL key through the pure interpreter.
- Missing description does not become an empty or previous-MR FEREL key.
- Assignee collection `[]` and unavailable `null` retain distinct caller behavior.
- `computeReadOnly` behavior remains covered.
- A new MR epoch cannot reuse the previous MR’s title, description, assignees, target branch, or URL.
- Jira transitions, recommendations, commenting, and failure handling remain caller behavior and are not exposed by the page module.

### Verification commands

```bash
yarn test src/lib/utils/misc/extractFerelId.test.ts src/lib/utils/misc/computeReadOnly.test.ts
yarn test src/components/mr-thread-panel/JiraStatusButton.test.tsx
yarn test src/lib/gitlab-mr-page
yarn compile
yarn build
yarn prettier --check src/components/mr-thread-panel/JiraStatusButton.tsx src/components/mr-thread-panel/MrThreadApp.tsx src/lib/utils/misc/extractFerelId.ts
yarn eslint src/components/mr-thread-panel/JiraStatusButton.tsx src/components/mr-thread-panel/MrThreadApp.tsx src/lib/utils/misc/extractFerelId.ts
```

### Rollback point

Restore JiraStatusButton’s legacy hooks and DOM-based FEREL extraction, restore entrypoint title extraction, and retain the first migrated caller from Checkpoint 5.

---

## Checkpoint 7 — Migrate thread facts and discussion reveal

### Goal

Replace `ThreadList` DOM parsing and `useUrlChange` usage with snapshot discussions and `revealDiscussion(ref)`.

Keep outside the page module:

- Own-MR detection from snapshot author ID plus configured current-user ID.
- Current-user discussion filtering.
- Popover open/closed state.
- Active-row state.
- Expanded-reply state.
- Scrolling inside Hustle Hub’s popover.

Move inside the page module:

- Discussion/reply selectors and interpretation.
- Overview/subpage route facts.
- Host-page discussion lookup.
- Host-page scrolling and temporary highlight lifecycle.

### Behavior preserved

- The thread control remains hidden outside the MR overview.
- MR authors see all discussions.
- Other users see discussions containing their replies.
- Resolved/open counts and reply rendering remain unchanged.
- Selecting a thread scrolls and highlights the GitLab discussion.
- Popover-local selection and scrolling remain rendering behavior.

### Files changed

- Modify `src/components/mr-thread-panel/ThreadList.tsx`.
- Modify `src/components/mr-thread-panel/MrThreadItem.tsx` only if it must receive `DiscussionRef`.
- Modify or remove `src/components/mr-thread-panel/mr-thread-panel.types.ts` only after snapshot types replace every import.
- Add `src/components/mr-thread-panel/ThreadList.test.tsx`.
- Expand discussion fixtures under `src/lib/gitlab-mr-page/testing/fixtures/`.

### Tests added or updated

Using the real page module and fixture adapter:

- Overview/subpage state controls visibility without caller URL parsing.
- Author/current-user filtering remains outside the page module and matches current behavior.
- Missing discussion host and confirmed empty discussions remain distinct.
- Reply fields and resolved counts match fixture DOM.
- Selecting a discussion passes its snapshot-created `DiscussionRef`.
- Reveal uses the module’s selector and recorded host scroll action.
- Removed, foreign, stale-epoch, page-unavailable, and disposed references return their accepted unavailable reasons.
- Internal popover state is unaffected by same-state module publications.

### Verification commands

```bash
yarn test src/components/mr-thread-panel/ThreadList.test.tsx
yarn test src/lib/gitlab-mr-page
yarn compile
yarn build
yarn prettier --check src/components/mr-thread-panel/ThreadList.tsx src/components/mr-thread-panel/MrThreadItem.tsx
yarn eslint src/components/mr-thread-panel/ThreadList.tsx src/components/mr-thread-panel/MrThreadItem.tsx
```

### Rollback point

Restore ThreadList’s legacy parsing, URL hook, and direct discussion lookup. Code Review and Jira callers remain migrated and verified.

---

## Checkpoint 8 — Migrate host appearance and complete caller adoption

### Goal

Replace `useHostDarkMode` with `snapshot.hostAppearance`.

The page module already observes host appearance through the same mutation/reconciliation flow. `MrThreadApp` only mirrors the semantic fact onto the Shadow DOM container.

After this checkpoint, verify that every rendering caller uses `GitLabMrPage` and no caller directly reads GitLab DOM facts.

### Behavior preserved

- The Shadow DOM starts with GitLab’s current appearance.
- Live GitLab appearance changes update the injected UI.
- Appearance remains a GitLab-authored fact; styling the Hustle Hub container remains rendering behavior.
- Jira, current-user, Strict Review, and Claude decisions remain outside the page module.

### Files changed

- Modify `src/components/mr-thread-panel/MrThreadApp.tsx`.
- Add or update `src/components/mr-thread-panel/MrThreadApp.test.tsx`.
- Expand the fixture host-appearance HTML only if required.
- Do not delete `src/hooks/useHostDarkMode.ts` yet.

### Tests added or updated

Using the real page module and fixture adapter:

- Initial light and dark facts are interpreted correctly.
- A controlled class mutation produces stale/current reconciliation.
- The Shadow DOM container mirrors the reconciled appearance.
- Missing appearance degrades without affecting metadata or discussions.
- A repository search confirms no rendering caller imports legacy GitLab page hooks after this checkpoint.

### Verification commands

```bash
yarn test src/components/mr-thread-panel/MrThreadApp.test.tsx
yarn test src/lib/gitlab-mr-page
yarn compile
yarn build
rg -n "useUrlChange|useTargetBranch|useIsReadOnly|useHostDarkMode" src/components src/entrypoints
yarn prettier --check src/components/mr-thread-panel/MrThreadApp.tsx
yarn eslint src/components/mr-thread-panel/MrThreadApp.tsx
```

The `rg` command should return no legacy-hook imports from rendering callers. Hook definitions may still exist until Checkpoint 9.

### Rollback point

Restore `useHostDarkMode` in `MrThreadApp`. Code Review, Jira, and ThreadList remain migrated.

---

## Checkpoint 9 — Delete legacy hooks and duplicate DOM knowledge

### Goal

Delete old hooks and parsing only after all callers use the new interface.

Remove:

- `useUrlChange`.
- `useTargetBranch`.
- `useIsReadOnly`.
- `useHostDarkMode`.
- Duplicate branch, author, assignee, description, discussion, reply, appearance, URL-route, and reveal selectors outside `src/lib/gitlab-mr-page`.
- Obsolete thread types replaced by snapshot types.

Retain the main-world history patch and its raw navigation event bridge if the production host adapter still needs them. They emit a primitive host signal; epoch creation and reconciliation remain inside `GitLabMrPage`.

Run the deletion test: deleting the new module at this point would force selectors, navigation epochs, mutation timing, reconciliation, missing semantics, and reveal behavior back into several callers.

### Behavior preserved

- All migrated behavior from Checkpoints 5–8.
- MR-specific content-script injection.
- Raw main-world navigation signaling.
- Jira and current-user policy remain outside the page module.
- No legacy observer runs in parallel.

### Files changed

- Delete `src/hooks/useUrlChange.tsx`.
- Delete `src/hooks/useTargetBranch.tsx`.
- Delete `src/hooks/useIsReadOnly.tsx`.
- Delete `src/hooks/useHostDarkMode.ts`.
- Delete `src/components/mr-thread-panel/mr-thread-panel.types.ts` if it has no remaining imports.
- Modify `src/entrypoints/mr-thread-panel.content.tsx` to remove any remaining legacy observer code.
- Modify `src/lib/events/url-change.ts` or `src/entrypoints/history-patch.content.ts` only if naming must clarify that they emit raw navigation signals rather than reconciling page state.
- Remove obsolete imports and dead helpers found by `knip`.

### Tests added or updated

- Remove isolated tests only when their behavior is covered through the deep module interface.
- Keep `computeReadOnly.test.ts`; current-user policy remains outside the module.
- Keep the pure `extractFerelId.test.ts`; Jira interpretation remains outside the module.
- Run all page-module and migrated-caller tests.
- Add a static repository assertion that GitLab selectors used by MR tooling exist only under `src/lib/gitlab-mr-page`.

### Verification commands

```bash
yarn test
yarn compile
yarn build
yarn knip
rg -n "querySelector|querySelectorAll|MutationObserver" src/components/mr-thread-panel src/hooks
rg -n "useUrlChange|useTargetBranch|useIsReadOnly|useHostDarkMode" src
rg -n "matches: \\['\\*://\\*.gitlab.com/\\*/-/merge_requests/\\*'\\]" src/entrypoints/mr-thread-panel.content.tsx
```

Expected search results:

- No MR-page GitLab selectors or mutation observers remain in rendering modules or deleted hooks.
- No imports or definitions of the four legacy hooks remain.
- The MR-specific matcher remains unchanged.

### Rollback point

Restore the deleted hooks and duplicate helpers from the checkpoint commit. Since every caller already uses the new interface, restored files remain unused until individual caller checkpoints are also rolled back.

---

## Checkpoint 10 — Full verification and browser migration gate

### Goal

Verify the completed migration as one coherent change before any later Jira-workflow deepening.

This checkpoint does not add architecture. Fix only regressions discovered by verification, and keep fixes inside the module or the caller that owns the affected decision.

### Behavior preserved

- MR tooling still starts only on documents matched by the existing MR-specific content-script matcher.
- Initial snapshot state is synchronous and immediately readable.
- New MR routes cannot expose previous-MR facts.
- Same-MR mutations reconcile coherently.
- Thread reveal is epoch-safe.
- GitLab selector and lifecycle knowledge has locality in one deep module.
- Jira, current-user, Strict Review, and Claude decisions remain outside the seam.

### Files changed

- None expected.
- If verification finds a regression, change only the owning module and its test, and record the deviation in this checkpoint before continuing.

### Tests added or updated

- No new tests expected.
- Any discovered regression requires a failing test before its correction.
- Manually verify in a real GitLab MR:
  - Initial render.
  - Source/target branch availability.
  - Jira helper visibility and read-only behavior.
  - Strict Review prompt copying.
  - Claude launch payload inputs.
  - Thread filtering and discussion reveal.
  - GitLab appearance switching.
  - SPA navigation between MR overview and subpages.
  - SPA navigation directly between two MRs when GitLab performs it without a document reload.

### Verification commands

```bash
yarn test
yarn compile
yarn build
yarn build:firefox
yarn knip
WXT_MCP=1 yarn dev
```

`WXT_MCP=1 yarn dev` is the manual browser-verification gate. This repository currently has no checked-in `scripts/browser-mcp.sh`; launch or reuse a Chrome debugging session according to the local environment rather than adding unrelated launcher work to this migration.

### Rollback point

If the full gate fails in a way that cannot be repaired locally, return to the last passing checkpoint. Because each caller migration is isolated, rollback can stop at the first failing caller without discarding the completed module and fixture environment.

## Completion criteria

The migration is complete only when:

- The MR content-script matcher is unchanged.
- The entrypoint owns exactly one `GitLabMrPage` lifetime.
- `getSnapshot()` is valid synchronously after creation.
- The external-store and immutability contracts are tested.
- Production and fixture adapters satisfy the same host interface.
- Fixture tests run real selectors, raw mutation signals, navigation reconciliation, and discussion lookup through the module.
- Code Review/Claude, Jira, threads, and host appearance all consume the new interface.
- No rendering caller directly queries GitLab MR DOM facts.
- Legacy hooks are deleted only after all callers migrate.
- Full tests, type-checks, builds, and `knip` pass.
- Application behavior is verified in a real GitLab MR.
