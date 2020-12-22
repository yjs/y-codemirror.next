
import * as Y from 'yjs' // eslint-disable-line
import { StateField, Facet, ChangeSet, Transaction, Annotation, AnnotationType } from '@codemirror/next/state' // eslint-disable-line
import { ViewPlugin, PluginValue, ViewUpdate, EditorView } from '@codemirror/next/view' // eslint-disable-line
import { InputState } from '@codemirror/next/view/src/input'

/**
 * @type {AnnotationType<YCollabConfig>}
 */
export const yAnnotation = Annotation.define()

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
    this.prevText = null
    this.prevAwareness = null
    this.conf = view.state.facet(yCollabConfig)
    this.conf.ytext.observe((event, tr) => {
      debugger
      if (tr.origin !== this.conf) {
        const delta = event.delta
        const changes = []
        let pos = 0
        for (let i = 0; i < delta.length; i++) {
          const d = delta[i]
          if (d.insert != null) {
            changes.push({ from: pos, insert: d.insert })
          } else if (d.delete != null) {
            changes.push({ from: pos, to: pos + d.delete, insert: '' })
          } else {
            pos += d.retain
          }
        }
        view.dispatch({ changes, annotations: [yAnnotation.of(this.conf)] })
      }
    })
  }

  /**
   * @param {ViewUpdate} update
   */
  update (update) {
    if (update.transactions.length > 0 && update.transactions[0].annotation(yAnnotation) === this.conf) {
      return
    }
    const ytext = this.conf.ytext
    ytext.doc.transact(() => {
      update.changes.iterChanges((fromA, toA, fromB, toB, insert) => {
        const insertText = insert.sliceString(0, insert.length, '\n')
        if (fromA !== toA) {
          ytext.delete(fromA, toA - fromA)
        }
        if (insertText.length > 0) {
          ytext.insert(fromA, insertText)
        }
      })
    }, this.conf)
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
