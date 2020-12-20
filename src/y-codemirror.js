
import * as Y from 'yjs' // eslint-disable-line
import { StateField, Facet, ChangeSet, Transaction } from '@codemirror/next/state' // eslint-disable-line
import { ViewPlugin, PluginValue, ViewUpdate, EditorView } from '@codemirror/next/view' // eslint-disable-line
import { InputState } from '@codemirror/next/view/src/input'

class LocalUpdate {
  /**
   * @param {Transaction} tr
   * @param {ChangeSet} changes
   */
  constructor (tr, changes) {
    this.origin = tr
    this.changes = changes
  }
}

class YCollabState {
  /**
   * @param {Array<LocalUpdate>} updates
   */
  constructor (updates) {
    this.pending = updates
  }
}

/**
 * @extends {PluginValue}
 */
class YCollabViewPluginValue {
  /**
   * @param {EditorView} view
   */
  constructor (view) {
    this.view = view
  }

  /**
   * @param {ViewUpdate} update
   */
  update (update) {
    const yconfig = this.view.state.facet(yCollabConfig)
    const ytext = yconfig.ytext
    update.changes.iterChanges((fromA, toA, fromB, toB, insert) => {
      const insertText = insert.sliceString(0, insert.length, '\n')
      if (fromA !== toA) {
        ytext.delete(fromA, toA - fromA)
      }
      if (insertText.length > 0) {
        ytext.insert(fromA, insertText)
      }
    })
  }

  destroy () {
    debugger
  }
}

const YCollabViewPlugin = ViewPlugin.fromClass(YCollabViewPluginValue)

const yCollabField = StateField.define({
  create (state) {
    return new YCollabState([])
  },
  update (state, tr) {
    return new YCollabState(state.pending.concat([new LocalUpdate(tr, tr.changes)]))
  }
})

export class YCollabConfig {
  constructor (ytext, awareness) {
    this.ytext = ytext
    this.awareness = awareness
    this.undoManager = new Y.UndoManager(ytext)
  }
}

/**
 * @type {Facet<YCollabConfig, YCollabConfig>}
 */
export const yCollabConfig = Facet.define({
  combine (inputs) {
    return inputs[inputs.length - 1]
  }
})

/**
 * @param {Y.Text} ytext
 * @param {any} awareness
 */
export const ycollab = (ytext, awareness) => [
  yCollabConfig.of(new YCollabConfig(ytext, awareness)),
  yCollabField,
  YCollabViewPlugin
]
