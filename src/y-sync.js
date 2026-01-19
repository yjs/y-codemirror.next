import * as Y from '@y/y'
import * as cmState from '@codemirror/state' // eslint-disable-line
import * as cmView from '@codemirror/view' // eslint-disable-line
import * as delta from 'lib0/delta'
import { YRange } from './y-range.js'

export const yAttributionAnnotation = cmState.Annotation.define()

export const yAttributionDecorations = cmState.StateField.define({
  create (state) {
    const conf = state.facet(ySyncFacet)
    const ytext = conf.ytext
    const delta = ytext.toDelta(conf.am, { retainInserts: true, retainDeletes: true })
    const { decorations } = ydeltaToCmChanges(delta, false)
    return cmView.Decoration.set(decorations)
  },
  update (decorations, tr) {
    /**
     * @type {Array<cmState.Range<cmView.Decoration>>}
     */
    const splitDecorations = []
    // Identify decorations that need to be split
    tr.changes.iterChanges((fromA, toA, fromB, toB) => {
      const insertedLength = toB - fromB
      const deletedLength = toA - fromA

      if (insertedLength > 0 && deletedLength === 0) {
        const insertPos = fromA

        decorations.between(insertPos, insertPos, (from, to, value) => {
          if (from < insertPos && insertPos < to) {
            const newInsertPos = fromB
            splitDecorations.push(value.range(from, newInsertPos))
            splitDecorations.push(value.range(newInsertPos + insertedLength, to + insertedLength))

            // Remove the original decoration that spans this range
            decorations = decorations.update({
              filterFrom: from,
              filterTo: to,
              filter: (f, t) => !(f === from && t === to)
            })
          }
        })
      }
    })
    // Map remaining decorations
    decorations = decorations.map(tr.changes)
    // Add split decorations
    if (splitDecorations.length > 0) {
      decorations = decorations.update({ add: splitDecorations })
    }
    /**
     * @type {Array<cmState.Range<cmView.Decoration>>}
     */
    const newDecorations = tr.annotation(yAttributionAnnotation)
    if ((newDecorations?.length || 0) > 0) {
      decorations = decorations.update({ add: newDecorations })
    }
    return decorations
  },
  provide: f => cmView.EditorView.decorations.from(f)
})

/**
 * @param {'insert'|'delete'} type
 * @param {string} username
 */
const createAttributionDecoration = (type, username) => {
  return cmView.Decoration.mark({
    class: `yjs-attribution-${type}`,
    attributes: {
      'data-user': username,
      title: `Edited by ${username}`
    },
    inclusive: false
  })
}

export class YSyncConfig {
  /**
   * @param {Y.Type<{ text: true }>} ytext
   * @param {import('@y/protocols/awareness').Awareness} awareness
   * @param {Y.AbstractAttributionManager} am
   */
  constructor (ytext, awareness, am) {
    /**
     * @type {Y.Type<{ text: true }>}
     */
    this.ytext = ytext
    this.awareness = awareness
    this.undoManager = new Y.UndoManager(ytext)
    this.am = am
  }

  /**
   * Helper function to transform an absolute index position to a Yjs-based relative position
   * (https://docs.yjs.dev/api/relative-positions).
   *
   * A relative position can be transformed back to an absolute position even after the document has changed. The position is
   * automatically adapted. This does not require any position transformations. Relative positions are computed based on
   * the internal Yjs document model. Peers that share content through Yjs are guaranteed that their positions will always
   * synced up when using relatve positions.
   *
   * ```js
   * import { ySyncFacet } from 'y-codemirror'
   *
   * ..
   * const ysync = view.state.facet(ySyncFacet)
   * // transform an absolute index position to a ypos
   * const ypos = ysync.getYPos(3)
   * // transform the ypos back to an absolute position
   * ysync.fromYPos(ypos) // => 3
   * ```
   *
   * It cannot be guaranteed that absolute index positions can be synced up between peers.
   * This might lead to undesired behavior when implementing features that require that all peers see the
   * same marked range (e.g. a comment plugin).
   *
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
    const pos = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(rpos), /** @type {Y.Doc} */ (this.ytext.doc))
    if (pos == null || pos.type !== this.ytext) {
      throw new Error('[y-codemirror] The position you want to retrieve was created by a different document')
    }
    return {
      pos: pos.index,
      assoc: pos.assoc
    }
  }

  /**
   * @param {cmState.SelectionRange} range
   * @return {YRange}
   */
  toYRange (range) {
    const assoc = range.assoc
    const yanchor = this.toYPos(range.anchor, assoc)
    const yhead = this.toYPos(range.head, assoc)
    return new YRange(yanchor, yhead)
  }

  /**
   * @param {YRange} yrange
   */
  fromYRange (yrange) {
    const anchor = this.fromYPos(yrange.yanchor)
    const head = this.fromYPos(yrange.yhead)
    if (anchor.pos === head.pos) {
      return cmState.EditorSelection.cursor(head.pos, head.assoc)
    }
    return cmState.EditorSelection.range(anchor.pos, head.pos)
  }
}

/**
 * @type {cmState.Facet<YSyncConfig, YSyncConfig>}
 */
export const ySyncFacet = cmState.Facet.define({
  combine (inputs) {
    return inputs[inputs.length - 1]
  }
})

/**
 * @param {delta.DeltaAny} delta
 * @param {boolean} skipDeletes
 */
const ydeltaToCmChanges = (delta, skipDeletes) => {
  /**
   * @type {cmState.Range<cmView.Decoration>[]}
   */
  const decorations = []
  /**
   * @type {Array<any>}
   */
  const changes = []
  let pos = 0
  for (const op of delta.children) {
    if (op.type === 'insert' || op.type === 'retain') {
      const attribution = op.attribution
      if (attribution) {
        if (attribution.insert) {
          decorations.push(
            createAttributionDecoration('insert', attribution.insert[0] || 'Anon').range(
              pos,
              pos + op.length
            )
          )
        } else if (attribution.delete) {
          decorations.push(
            createAttributionDecoration('delete', attribution.delete[0] || 'Anon').range(
              pos,
              pos + op.length
            )
          )
        }
      }
    }
    if (op.type === 'insert') {
      changes.push({ from: pos, to: pos, insert: /** @type {string} */ (op.insert) })
    } else if (op.type === 'delete' && !skipDeletes) {
      changes.push({ from: pos, to: pos + op.delete, insert: '' })
      pos += op.delete
    } else if (op.type === 'retain') {
      pos += op.retain
    }
  }
  return { changes, decorations }
}

/**
 * @type {cmState.AnnotationType<YSyncConfig>}
 */
export const ySyncAnnotation = cmState.Annotation.define()

/**
 * @extends {PluginValue}
 */
class YSyncPluginValue {
  /**
   * @param {cmView.EditorView} view
   */
  constructor (view) {
    this.view = view
    this.conf = view.state.facet(ySyncFacet)
    this._ytext = this.conf.ytext
    this._observer = this._ytext.observe((event, tr) => {
      /**
       * @type {delta.Delta<{text: true}>?}
       */
      let delta = null
      if (tr.origin === this.conf && this.conf.am !== Y.noAttributionsManager) {
        const changes = Y.mergeIdSets([tr.insertSet, tr.deleteSet])
        delta = this._ytext.toDelta(this.conf.am, { itemsToRender: changes, retainInserts: true })
      } else if (tr.origin !== this.conf) {
        delta = event.getDelta(this.conf.am)
      }
      if (delta != null) {
        const { changes, decorations } = ydeltaToCmChanges(delta, tr.origin === this.conf)
        // @todo find the proper way to do this
        const dispatch = () => view.dispatch({ changes, annotations: [ySyncAnnotation.of(this.conf), yAttributionAnnotation.of(decorations)] })
        if (tr.origin === this.conf) { setTimeout(dispatch, 0) } else { dispatch() }
      }
    })
    this._onAttrChange = this.conf.am.on('change', (changes) => {
      const delta = this._ytext.toDelta(this.conf.am, { itemsToRender: changes, retainInserts: true, retainDeletes: true })
      if (!delta.isEmpty()) {
        const { changes, decorations } = ydeltaToCmChanges(delta, false)
        if (changes.length > 0 && decorations.length > 0) {
          const dispatch = () => view.dispatch({ changes, annotations: [ySyncAnnotation.of(this.conf), yAttributionAnnotation.of(decorations)] })
          setTimeout(dispatch, 0)
        }
      }
    })
  }

  /**
   * @param {cmView.ViewUpdate} update
   */
  update (update) {
    if (!update.docChanged || (update.transactions.length > 0 && update.transactions[0].annotation(ySyncAnnotation) === this.conf)) {
      return
    }
    const ytext = this.conf.ytext
    ;/** @type {Y.Doc} */ (ytext.doc).transact(tr => {
      /**
       * This variable adjusts the fromA position to the current position in the Y.Text type.
       */
      let adj = 0
      const d = delta.create(delta.$delta({ text: true }))
      update.changes.iterChanges((fromA, toA, fromB, toB, insert) => {
        const insertText = insert.sliceString(0, insert.length, '\n')
        if (fromA !== toA) {
          d.apply(delta.create().retain(fromA + adj).delete(toA - fromA))
        }
        if (insertText.length > 0) {
          d.apply(delta.create().retain(fromA + adj).insert(insertText))
        }
        adj += insertText.length - (toA - fromA)
      })
      ytext.applyDelta(d, this.conf.am)
      const attributedDeletes = tr.meta.get('attributedDeletes')
      if (attributedDeletes != null) {
        const updateFix = this._ytext.toDelta(this.conf.am, { itemsToRender: attributedDeletes })
        const { changes, decorations } = ydeltaToCmChanges(updateFix, false)
        const dispatch = () => this.view.dispatch({ changes, annotations: [ySyncAnnotation.of(this.conf), yAttributionAnnotation.of(decorations)] })
        setTimeout(dispatch, 0)
      }
    }, this.conf)
  }

  destroy () {
    this._ytext.unobserve(this._observer)
  }
}

export const ySync = cmView.ViewPlugin.fromClass(YSyncPluginValue)
