
import * as Y from 'yjs' // eslint-disable-line
import { EditorView } from '@codemirror/view'
import { Extension } from '@codemirror/state' // eslint-disable-line

import { ySync, ySyncFacet, YSyncConfig } from './y-sync.js'
import { yRemoteSelections, yRemoteSelectionsTheme } from './y-remote-selections.js'
import { yUndoManager, yUndoManagerFacet, YUndoManagerConfig, undo, redo, yUndoManagerKeymap } from './y-undomanager.js'

export { yRemoteSelections, yRemoteSelectionsTheme, ySync, ySyncFacet, YSyncConfig, yUndoManagerKeymap }

/**
 * @param {Y.Text} ytext
 * @param {any} awareness
 * @return {Extension}
 */
export const yCollab = (ytext, awareness, { undoManager = new Y.UndoManager(ytext) } = {}) => {
  const syncConf = ySyncFacet.of(new YSyncConfig(ytext, awareness))
  // By default, only track changes that are produced by the sync plugin (local edits)
  undoManager.trackedOrigins.add(YSyncConfig)
  const undoManagerConf = yUndoManagerFacet.of(new YUndoManagerConfig(undoManager))
  const plugins = [
    syncConf,
    undoManagerConf,
    // yUndoManager must be included before the sync plugin
    yUndoManager,
    ySync,
    EditorView.domEventHandlers({
      beforeinput (e, view) {
        if (e.inputType === 'historyUndo') return undo(view)
        if (e.inputType === 'historyRedo') return redo(view)
        return false
      }
    })
  ]
  if (awareness) {
    plugins.push(
      yRemoteSelectionsTheme,
      yRemoteSelections
    )
  }
  return plugins
}
