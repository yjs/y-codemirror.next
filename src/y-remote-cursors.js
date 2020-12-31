
import { ViewPlugin, ViewUpdate, EditorView, Decoration, themeClass, DecorationSet } from '@codemirror/next/view' // eslint-disable-line
import { RangeSet, RangeSetBuilder } from '@codemirror/next/rangeset'
import { Annotation, AnnotationType } from '@codemirror/next/state' // eslint-disable-line
import * as dom from 'lib0/dom.js'
import * as pair from 'lib0/pair.js'

import * as Y from 'yjs'
import { ySyncFacet } from './y-sync.js'

/**
 * @todo specify the users that actually changed. Currently, we recalculate positions for every user.
 * @type {AnnotationType<Array<number>>}
 */
const yRemoteCursorsAnnotation = Annotation.define()

class YRemoteCursorWidget {
  constructor (color) {
    this.color = color
  }

  toDOM () {
    return /** @type {HTMLElement} */ (dom.element('span', [pair.create('class', themeClass('ycursor')), pair.create('style', `background-color: ${this.color}`)], [
      dom.element('div', [
        pair.create('class', themeClass('ycursorInfo'))
      ], [
        dom.text('Keanu Reeves')
      ])
    ]))
  }

  eq (widget) {
    return widget.color === this.color
  }

  compare (widget) {
    return widget.color === this.color
  }

  updateDOM () {
    return false
  }

  get estimatedHeight () { return -1 }

  ignoreEvent () {
    return true
  }
}

class YRemoteCursorsPluginValue {
  /**
   * @param {EditorView} view
   */
  constructor (view) {
    this.conf = view.state.facet(ySyncFacet)
    this.conf.awareness.on('change', (added, updated, removed) => {
      console.log('y-awareness', { added, updated, removed })
      view.dispatch({ annotations: [yRemoteCursorsAnnotation.of([])] })
    })
    /**
     * @type {DecorationSet}
     */
    this.decorations = RangeSet.of([])
  }

  /**
   * @param {ViewUpdate} update
   */
  update (update) {
    const ytext = this.conf.ytext
    const ydoc = /** @type {Y.Doc} */ (ytext.doc)
    const awareness = this.conf.awareness
    /**
     * @type {RangeSetBuilder<Decoration>}
     */
    const decorations = new RangeSetBuilder()
    const localAwarenessState = this.conf.awareness.getLocalState()

    // set local awareness state (update cursors)
    if (localAwarenessState != null) {
      let sel = update.state.selection.primary
      const currentAnchor = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.anchor)
      const currentHead = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.head)

      if (!update.view.hasFocus || !update.view.dom.ownerDocument.hasFocus()) {
        sel = null
      }
      if (sel != null) {
        const anchor = Y.createRelativePositionFromTypeIndex(ytext, sel.anchor)
        const head = Y.createRelativePositionFromTypeIndex(ytext, sel.head)
        if (localAwarenessState.cursor == null || !Y.compareRelativePositions(currentAnchor, anchor) || !Y.compareRelativePositions(currentHead, head)) {
          awareness.setLocalStateField('cursor', {
            anchor,
            head
          })
        }
      } else if (localAwarenessState.cursor != null) {
        awareness.setLocalStateField('cursor', null)
      }
    }

    // update decorations (remote selections)
    awareness.getStates().forEach((state, clientid) => {
      if (clientid === awareness.doc.clientID) {
        return
      }
      const cursor = state.cursor
      if (cursor == null || cursor.anchor == null || cursor.head == null) {
        return
      }
      const anchor = Y.createAbsolutePositionFromRelativePosition(cursor.anchor, ydoc)
      const head = Y.createAbsolutePositionFromRelativePosition(cursor.head, ydoc)
      if (anchor == null || head == null || anchor.type !== ytext || head.type !== ytext) {
        return
      }
      if (anchor.index !== head.index) {
        decorations.add(anchor.index, head.index, Decoration.mark({
          attributes: { style: 'background-color: orange' },
          class: themeClass('yselection')
        }))
      }
      decorations.add(head.index, head.index, Decoration.widget({
        side: head.index - anchor.index > 0 ? -1 : 1, // the local cursor should be rendered outside the remote selection
        block: false,
        widget: new YRemoteCursorWidget('orange')
      }))
    })
    this.decorations = decorations.finish()
  }
}

export const yRemoteCursors = ViewPlugin.fromClass(YRemoteCursorsPluginValue, {
  decorations: v => v.decorations
})
