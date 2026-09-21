# Implementation Notes

ZyloXP is a client-side React application deployed as static files. There is no API service, remote database, or hosted authentication layer.

## Application structure

| Code | Responsibility |
| --- | --- |
| `src/App.tsx` | Application shell, navigation, learning state, and workspace coordination. |
| `src/appRouting.ts` | Parse and build hash routes, including deep links into labs, concepts, and the PCB editor. |
| `src/data.ts`, `src/electricalAtlasData.ts` | Typed curriculum, lab, question, and concept definitions. |
| `src/PcbDesigner.tsx` | SVG board rendering, placement, routing, inspection, undo/redo, and local projects. |
| `src/pcbStorage.ts` | Board schema, capacity limits, topology validation, and safe local-storage reads/writes. |
| `src/ProgressBackup.tsx` | Versioned backup export and validated restore across supported storage groups. |
| `src/RecentLearning.tsx` | Recent activity and resume links. |
| `src/authSession.ts`, `src/localAppLock.ts` | Local workspace session lifetime and optional device privacy lock. These are not server-side authentication. |
| `public/sw.js` | Application-shell and visited-asset caching. |
| `tools/sync_question_bank.py` | Convert the content package into the app-facing subset. |

## PCB editing and persistence

Footprints have stable IDs, board coordinates, rotations, and pad definitions. A trace refers to two component/pad endpoints, so it follows those endpoints when a footprint moves. The editor keeps a bounded undo history and uses one snapshot format for named projects and the active draft.

Draft writes are debounced during editing and flushed when leaving the workspace or hiding the page. Restoration validates component IDs, bounds, rotations, layers, widths, and endpoint references. Invalid boards are rejected as a whole. Named projects and the active draft use separate storage keys and both participate in progress backups.

The board is an educational layout editor. Its checks detect placement overlaps, edge proximity, duplicate routes, and missing guided connections. It does not implement a complete netlist engine, arbitrary route waypoints, copper clearance analysis, impedance modeling, or Gerber export.

## Routing and delivery

The URL hash stores the selected workspace and resource. This supports direct links and refreshes under the GitHub Pages repository subpath. Large features use lazy imports. Failed module loads offer a reload path so a stale browser session can recover after deployment.

GitHub Actions installs the lockfile, audits production dependencies, runs storage tests, checks TypeScript, builds the app, and exercises the production build in Chromium. Deployment uses a separate job with Pages permissions. Action revisions are pinned, with Dependabot configured to propose updates.

## Test coverage

- Node tests cover PCB round trips, empty boards, corrupt topology, unavailable storage, independent project/draft persistence, and capacity limits.
- Playwright covers the local-profile entry flow, keyboard-operated preview tabs, main workspace routes, horizontal overflow, draft recovery, backup export, grid movement, undo, and zoom.
- Browser tests run at 1440 x 1000 and 390 x 844. They disable service workers to isolate each test. Offline caching, Safari, Firefox, and full accessibility conformance are not covered by this suite.

Run `pnpm verify` after installing the Playwright Chromium browser. Failed browser tests retain screenshots and traces in `test-results/`; set `PLAYWRIGHT_OUTPUT_DIR` to change that location.

## Tradeoffs and next work

Local storage keeps the demo deployable without credentials but does not provide cross-device sync, account isolation, or encrypted storage. An optional PIN discourages casual access on a shared device; it cannot defend against someone with browser or filesystem access.

`App.tsx` and the shared stylesheet still contain a large amount of orchestration and accumulated styling. Moving one workspace at a time into focused modules is preferable to a wholesale rewrite. Other useful next steps are broader model-level tests for the lab equations, automated accessibility checks, and a real netlist/connectivity model for PCB work.

The dataset report documents deterministic formula checks, not expert review of every question or empirical validation of the learning sequence. The app should not be used for safety-critical circuit design or as a substitute for measurement and engineering review.
