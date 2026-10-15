# Changelog

All notable changes to `@y/codemirror` are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

`@y/codemirror` is the Yjs v14 (`@y/y`) version of `y-codemirror.next`. It forked from
`y-codemirror.next` 0.3.5 and is published under the npm `beta` dist-tag until Yjs v14 is stable.
The stable `y-codemirror.next` package (Yjs v13) lives on the `yjs-v13` branch; its releases are
listed on the [GitHub releases page](https://github.com/yjs/y-codemirror.next/releases).

## [Unreleased]

### Changed

- **Breaking:** The `attributionManager` option of `yCollab` was replaced by `renderer`, following
  the Yjs v14 renderer API (`Y.createDiffRenderer`, `ytext.toDelta({ renderer })`). Pass
  `yCollab(ytext, awareness, { renderer })` to render attributed content such as suggestions or
  diffs. By default (`null`) the content is rendered as-is. `YSyncConfig.am` was renamed to
  `YSyncConfig.renderer`.
- Remote selections are drawn in a CodeMirror layer instead of mark and line decorations, so a
  remote selection no longer shifts the layout of the document
  ([#44](https://github.com/yjs/y-codemirror.next/issues/44)). The `.cm-yLineSelection` theme class
  is no longer used.
- Require `@y/y` `^14.0.0-rc.28`, `@y/protocols` `^1.0.6-rc.1`, `lib0` `^1.0.0-rc.36`,
  `@codemirror/state` `^6.7.6` and `@codemirror/view` `^6.43.14`.

### Fixed

- When Yjs reverts part of a local change that targeted deleted-but-rendered content (e.g. typing
  into a suggested deletion), the editor content is reverted as well.

### Removed

- The sync plugin no longer creates an unused `Y.UndoManager`
  ([#43](https://github.com/yjs/y-codemirror.next/issues/43)).

## [0.0.0-3] - 2026-01-19

### Changed

- Follow the Yjs v14 API changes: `ytext.toDelta(...)` replaces `ytext.getContent(...)`, and
  `ytext` is typed as `Y.Type<{ text: true }>`.
- Require `@y/y` `^14.0.0-22` and `lib0` `^1.0.0-0`.

## [0.0.0-2] - 2025-12-15

### Changed

- Require `lib0` `^0.2.115`.

## [0.0.0-1] - 2025-12-10

### Changed

- Depend on the Yjs v14 beta package `@y/y` instead of `yjs`. Require `@y/y` `^14.0.0-16` and
  `@y/protocols` `^1.0.6-3`.

### Fixed

- Fix the build output.

## [0.0.0-0] - 2025-12-08

First prerelease of `@y/codemirror`, based on `y-codemirror.next` 0.3.5.

### Added

- Support for Yjs v14 (`yjs` `^14.0.0-16`, `@y/protocols`).
- Attribution rendering: `yCollab(ytext, awareness, { attributionManager })` renders attributed
  content (e.g. suggestions / diffs) through the `yAttributionDecorations` state field.
- Export `ySyncAnnotation`.
- Demo with a suggestion mode (`npm start`).

### Changed

- The package was renamed from `y-codemirror.next` to `@y/codemirror`.

[Unreleased]: https://github.com/yjs/y-codemirror.next/compare/v0.0.0-3...HEAD
[0.0.0-3]: https://github.com/yjs/y-codemirror.next/compare/v0.0.0-2...v0.0.0-3
[0.0.0-2]: https://github.com/yjs/y-codemirror.next/compare/v0.0.0-1...v0.0.0-2
[0.0.0-1]: https://github.com/yjs/y-codemirror.next/compare/965f4f5...v0.0.0-1
[0.0.0-0]: https://github.com/yjs/y-codemirror.next/compare/v0.3.5...965f4f5
