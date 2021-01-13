
import * as Y from 'yjs'
import { Facet, Annotation, AnnotationType, SelectionRange, EditorSelection } from '@codemirror/next/state' // eslint-disable-line
import { ViewPlugin, ViewUpdate, EditorView } from '@codemirror/next/view' // eslint-disable-line

export class YSyncConfig {
  constructor (ytext, awareness) {
    this.ytext = ytext
    this.awareness = awareness
    this.undoManager = new Y.UndoManager(ytext)
  }

  /**
   * @param {number} pos
   * @param {number} [assoc]
   */
  toYPos (pos, assoc = 0) {
    return Y.createRelativePositionFromTypeIndex(this.ytext, pos, assoc)
  }

  /**
   * @param {Y.RelativePosition | Object} rpos
   */
  fromYPos (rpos) {
    const pos = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(rpos), this.ytext.doc)
    if (pos == null || pos.type !== this.ytext) {
      throw new Error('[y-codemirror] The position you want to retrieve was created by a different document')
    }
    return {
      pos: pos.index,
      assoc: pos.assoc
    }
  }

  /**
   * @param {SelectionRange} range
   */
  toYSelectionRange (range) {
    const assoc = range.assoc
    const yanchor = this.toYPos(range.anchor, assoc)
    const yhead = this.toYPos(range.head, assoc)
    return { yanchor, yhead }
  }

  /**
   * @param {any} yrange
   */
  fromYSelectionRange (yrange) {
    const anchor = this.fromYPos(yrange.yanchor)
    const head = this.fromYPos(yrange.yhead)
    if (anchor.pos === head.pos) {
      return EditorSelection.cursor(head.pos, head.assoc)
    }
    return EditorSelection.range(anchor.pos, head.pos)
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
            changes.push({ from: pos, to: pos, insert: d.insert })
          } else if (d.delete != null) {
            changes.push({ from: pos, to: pos + d.delete, insert: '' })
            pos += d.delete
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
      /**
       * This variable adjusts the fromA position to the current position in the Y.Text type.
       */
      let adj = 0
      update.changes.iterChanges((fromA, toA, fromB, toB, insert) => {
        const insertText = insert.sliceString(0, insert.length, '\n')
        if (fromA !== toA) {
          ytext.delete(fromA + adj, toA - fromA)
        }
        if (insertText.length > 0) {
          ytext.insert(fromA + adj, insertText)
        }
        adj += insertText.length - (toA - fromA)
      })
    }, this.conf)
  }

  destroy () {
    // @todo
  }
}

export const ySync = ViewPlugin.fromClass(YSyncPluginValue)
