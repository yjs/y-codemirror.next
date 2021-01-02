
import { ViewPlugin, ViewUpdate, EditorView, Decoration, themeClass, DecorationSet } from '@codemirror/next/view' // eslint-disable-line
import { RangeSet, Range } from '@codemirror/next/rangeset' // eslint-disable-line
import { Annotation, AnnotationType } from '@codemirror/next/state' // eslint-disable-line
import * as dom from 'lib0/dom.js'
import * as pair from 'lib0/pair.js'
import * as math from 'lib0/math.js'

import * as Y from 'yjs'
import { ySyncFacet } from './y-sync.js'

export const yRemoteSelectionsTheme = EditorView.baseTheme({
  $ySelection: {
  },
  $ySelectionCaret: {
    position: 'relative',
    borderLeft: '1px solid black',
    borderRight: '1px solid black',
    marginLeft: '-1px',
    marginRight: '-1px',
    boxSizing: 'border-box',
    display: 'inline'
  },
  '$ySelectionCaret::before': {
    content: '"\u00a0"', // this is a unicode non-breaking space
    borderRadius: '50%',
    position: 'absolute',
    width: '.4em',
    height: '.4em',
    top: '-.2em',
    left: '-.2em',
    backgroundColor: 'inherit',
    transition: 'transform .3s ease-in-out'
  },
  '$ySelectionCaret:hover::before': {
    transformOrigin: 'bottom center',
    transform: 'scale(0)'
  },
  $ySelectionInfo: {
    position: 'absolute',
    top: '-1.05em',
    left: '-1px',
    fontSize: '.75em',
    fontFamily: 'serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 'normal',
    userSelect: 'none',
    color: 'white',
    paddingLeft: '2px',
    paddingRight: '2px',
    zIndex: 101,
    transition: 'opacity .3s ease-in-out',
    backgroundColor: 'inherit',
    // these should be separate
    opacity: 0,
    transitionDelay: '0s'
  },
  '$ySelectionCaret:hover > $ySelectionInfo': {
    opacity: 1,
    transitionDelay: '0s'
  }
})

/**
 * @todo specify the users that actually changed. Currently, we recalculate positions for every user.
 * @type {AnnotationType<Array<number>>}
 */
const yRemoteSelectionsAnnotation = Annotation.define()

class YRemoteCaretWidget {
  /**
   * @param {string} color
   * @param {string} name
   */
  constructor (color, name) {
    this.color = color
    this.name = name
  }

  toDOM () {
    return /** @type {HTMLElement} */ (dom.element('span', [pair.create('class', themeClass('ySelectionCaret')), pair.create('style', `background-color: ${this.color}; border-color: ${this.color}`)], [
      dom.element('div', [
        pair.create('class', themeClass('ySelectionInfo'))
      ], [
        dom.text(this.name)
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

export class YRemoteSelectionsPluginValue {
  /**
   * @param {EditorView} view
   */
  constructor (view) {
    this.conf = view.state.facet(ySyncFacet)
    this.conf.awareness.on('change', ({ added, updated, removed }, s, t) => {
      console.log('y-awareness', { added, updated, removed }, s, t)
      view.dispatch({ annotations: [yRemoteSelectionsAnnotation.of([])] })
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
     * @type {Array<Range<Decoration>>}
     */
    const decorations = []
    const localAwarenessState = this.conf.awareness.getLocalState()

    // set local awareness state (update cursors)
    if (localAwarenessState != null) {
      let sel = update.state.selection.primary
      const currentAnchor = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.anchor)
      const currentHead = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.head)

      /*
      if (!update.view.hasFocus || !update.view.dom.ownerDocument.hasFocus()) {
        sel = null
      }
      */
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
      const { color = '#30bced', name = 'Anonymous' } = state.user || {}
      const colorLight = (state.user && state.user.colorLight) || color + '33'
      const start = math.min(anchor.index, head.index)
      const end = math.max(anchor.index, head.index)
      if (start !== end) {
        decorations.push({
          from: start,
          to: end,
          value: Decoration.mark({
            attributes: { style: `background-color: ${colorLight}` },
            class: themeClass('ySelection')
          })
        })
      }
      decorations.push({
        from: head.index,
        to: head.index,
        value: Decoration.widget({
          side: head.index - anchor.index > 0 ? -1 : 1, // the local cursor should be rendered outside the remote selection
          block: false,
          widget: new YRemoteCaretWidget(color, name)
        })
      })
    })
    this.decorations = Decoration.set(decorations, true)
  }
}

export const yRemoteSelections = ViewPlugin.fromClass(YRemoteSelectionsPluginValue, {
  decorations: v => v.decorations
})
