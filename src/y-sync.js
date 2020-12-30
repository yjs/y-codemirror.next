
import * as Y from 'yjs'
import { Facet, Annotation, AnnotationType } from '@codemirror/next/state' // eslint-disable-line
import { ViewPlugin, ViewUpdate, EditorView } from '@codemirror/next/view' // eslint-disable-line

export class YSyncConfig {
  constructor (ytext, awareness) {
    this.ytext = ytext
    this.awareness = awareness
    this.undoManager = new Y.UndoManager(ytext)
  }
}

/**
 * @type {Facet<YSyncConfig, YSyncConfig>}
 */
export const ySyncFacet = Facet.define({
  combine (inputs) {
    return inputs[inputs.length - 1]
  }
})

/**
 * @type {AnnotationType<YSyncConfig>}
 */
export const ySyncAnnotation = Annotation.define()

/**
 * @extends {PluginValue}
 */
class YSyncPluginValue {
  /**
   * @param {EditorView} view
   */
  constructor (view) {
    this.view = view
    this.conf = view.state.facet(ySyncFacet)
    this.conf.ytext.observe((event, tr) => {
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
        view.dispatch({ changes, annotations: [ySyncAnnotation.of(this.conf)] })
      }
    })
  }

  /**
   * @param {ViewUpdate} update
   */
  update (update) {
    if (update.transactions.length > 0 && update.transactions[0].annotation(ySyncAnnotation) === this.conf) {
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
    // @todo
  }
}

export const ySync = ViewPlugin.fromClass(YSyncPluginValue)
