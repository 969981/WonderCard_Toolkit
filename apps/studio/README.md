# WonderCard Pro Editor — first development milestone

This new React + TypeScript + Vite + Tailwind + shadcn/ui-style workspace is **experimental**, under `feature/pro-editor-shadcn-tauri`. The old `web/` offline v0.3 is preserved and runnable.

## Development

Requirements: Node 22+, npm, and for desktop builds [Rust + Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) (on Windows: WebView2 and MSVC Build Tools).

From repository root:

```bash
npm install
npm run dev                # browser preview at http://127.0.0.1:1420
npm run typecheck
npm test                   # Vitest
npm run build              # static Web UI
npm run test:legacy        # Python stdlib unittest for old core
npm run tauri -- dev       # requires Rust+desktop dependencies
npm run tauri -- build     # Windows installer, not validated until CI passes
```

The `apps/studio/src-tauri` project is a Tauri 2 desktop shell with dialog-selected file access. There is no HTTP backend or runtime Python requirement.

## Implemented / experimental

- File picker or drag-drop, multiple imported documents, search by name, original byte snapshot;
- WC6/WC7 *selected numeric and date fields only* with an experimental patch engine, Undo/Redo;
- Side-by-side field inspector and byte HEX inspection with field<->offset selection;
- Byte diff, lazy-loaded **local** Monaco JSON **read-only preview**, with no CDN calls;
- Original file preserved, export using Save As, current prototype rejects existing target file names;
- Dark/light theme, shadcn-style project-owned Button component and Tailwind v4;
- Full and unknown formats remain read-only (unaltered export available).

**Not validated:** Windows installer build, all true event-card game behavior, Full checksum, production-grade atomic save, four-language UI parity, large-scale batch audit, full professional HEX editing. Unlike v0.3, new editor is initially zh-CN with some English technical labels; internationalization migration is a separate task.

## Safety / known technical limits

- The original bytes are never edited in place; current DocumentSession uses copy-on-write snapshots.
- Format probe currently uses extension+size; this is not sufficient to claim authenticated card provenance. Treat modified output as research-only until cross-checked against permitted real-world examples and PKHeX.
- No signature or CRC auto-repair. Original Full copies are allowed but altered Full export is blocked.
- No overwriting an existing destination in Tauri at this stage; atomic temp-file rename and failure recovery is future PE-012 work. The save dialog grants only session-scoped file access; permission scope is not global.
- The included demo card is synthetic, not an official Mystery Gift event.
- No automatic fetch, telemetry, cloud upload or bundled EventsGallery.

## Development tasks
See [Pro Editor implementation backlog](../../docs/pro-editor/BACKLOG.md) and [tracking issue](https://github.com/969981/WonderCard_Toolkit/issues/17).
