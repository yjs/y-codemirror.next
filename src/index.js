import * as Y from '@y/y' // eslint-disable-line
import * as cmView from '@codemirror/view'
import * as cmState from '@codemirror/state' // eslint-disable-line

import { YRange } from './y-range.js'
import { ySync, ySyncFacet, YSyncConfig, ySyncAnnotation, yAttributionDecorations } from './y-sync.js'
import { yRemoteSelections, yRemoteSelectionsTheme } from './y-remote-selections.js'
import { yUndoManager, yUndoManagerFacet, YUndoManagerConfig, undo, redo, yUndoManagerKeymap } from './y-undomanager.js'

export { YRange, yRemoteSelections, yRemoteSelectionsTheme, ySync, ySyncFacet, YSyncConfig, ySyncAnnotation, yUndoManagerKeymap }

/**
 * @param {Y.Node<{text: true}>} ytext
 * @param {any} awareness
 * @param {Object} [opts]
 * @param {Y.UndoManager | false} [opts.undoManager] Set undoManager to false to disable the undo-redo plugin
 * @param {Y.AbstractRenderer?} [opts.renderer] Render attributed content (e.g. suggestions / diffs) with a Yjs renderer. By default (`null`), the content is rendered as-is.
 * @return {cmState.Extension}
 */
export const yCollab = (ytext, awareness, { undoManager = new Y.UndoManager(ytext), renderer = null } = {}) => {
  const ySyncConfig = new YSyncConfig(ytext, awareness, renderer)
  const plugins = [
    ySyncFacet.of(ySyncConfig),
    ySync,
    yAttributionDecorations
  ]
  if (awareness) {
    plugins.push(
      yRemoteSelectionsTheme,
      yRemoteSelections
    )
  }
  if (undoManager !== false) {
    // By default, only track changes that are produced by the sync plugin (local edits)
    plugins.push(
      yUndoManagerFacet.of(new YUndoManagerConfig(undoManager)),
      yUndoManager,
      cmView.EditorView.domEventHandlers({
        beforeinput (e, view) {
          if (e.inputType === 'historyUndo') return undo(view)
          if (e.inputType === 'historyRedo') return redo(view)
          return false
        }
      })
    )
  }
  return plugins
}
