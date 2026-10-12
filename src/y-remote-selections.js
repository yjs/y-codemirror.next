import * as cmView from '@codemirror/view'

import * as cmState from '@codemirror/state'
import * as dom from 'lib0/dom'
import * as pair from 'lib0/pair'
import * as math from 'lib0/math'

import * as Y from '@y/y'
import { ySyncFacet } from './y-sync.js'

export const yRemoteSelectionsTheme = cmView.EditorView.baseTheme({
  '.cm-ySelection': {
  },
  '.cm-ySelectionCaret': {
    position: 'relative',
    borderLeft: '1px solid black',
    borderRight: '1px solid black',
    marginLeft: '-1px',
    marginRight: '-1px',
    boxSizing: 'border-box',
    display: 'inline'
  },
  '.cm-ySelectionCaretDot': {
    borderRadius: '50%',
    position: 'absolute',
    width: '.4em',
    height: '.4em',
    top: '-.2em',
    left: '-.2em',
    backgroundColor: 'inherit',
    transition: 'transform .3s ease-in-out',
    boxSizing: 'border-box'
  },
  '.cm-ySelectionCaret:hover > .cm-ySelectionCaretDot': {
    transformOrigin: 'bottom center',
    transform: 'scale(0)'
  },
  '.cm-ySelectionInfo': {
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
    transitionDelay: '0s',
    whiteSpace: 'nowrap'
  },
  '.cm-ySelectionCaret:hover > .cm-ySelectionInfo': {
    opacity: 1,
    transitionDelay: '0s'
  }
})

/**
 * @todo specify the users that actually changed. Currently, we recalculate positions for every user.
 * @type {cmState.AnnotationType<Array<number>>}
 */
const yRemoteSelectionsAnnotation = cmState.Annotation.define()

/**
 * The selection of a remote user, resolved to absolute positions in the editor document.
 *
 * @typedef {Object} RemoteSelection
 * @property {number} anchor
 * @property {number} head
 * @property {string} name
 * @property {string} color
 * @property {string} colorLight
 */

/**
 * Resolve the selections of all remote users to absolute positions in the editor document.
 *
 * @param {import('./y-sync.js').YSyncConfig} conf
 * @param {number} docLength
 * @return {Array<RemoteSelection>}
 */
const getRemoteSelections = (conf, docLength) => {
  const ytext = conf.ytext
  const ydoc = /** @type {Y.Doc} */ (ytext.doc)
  const awareness = conf.awareness
  /**
   * @type {Array<RemoteSelection>}
   */
  const selections = []
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
    selections.push({
      // Guard against positions outside of the editor document (e.g. when ytext and the editor are
      // temporarily out of sync). Out-of-range positions would break the layout computation.
      anchor: math.min(anchor.index, docLength),
      head: math.min(head.index, docLength),
      name,
      color,
      colorLight
    })
  })
  return selections
}

class YRemoteCaretWidget extends cmView.WidgetType {
  /**
   * @param {string} color
   * @param {string} name
   */
  constructor (color, name) {
    super()
    this.color = color
    this.name = name
  }

  toDOM () {
    return /** @type {HTMLElement} */ (dom.element('span', [pair.create('class', 'cm-ySelectionCaret'), pair.create('style', `background-color: ${this.color}; border-color: ${this.color}`)], [
      dom.text('\u2060'),
      dom.element('div', [
        pair.create('class', 'cm-ySelectionCaretDot')
      ]),
      dom.text('\u2060'),
      dom.element('div', [
        pair.create('class', 'cm-ySelectionInfo')
      ], [
        dom.text(this.name)
      ]),
      dom.text('\u2060')
    ]))
  }

  /**
   * @param {any} widget
   */
  eq (widget) {
    return widget.color === this.color
  }

  /**
   * @param {any} widget
   */
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

/**
 * A layer marker that draws one rectangle of a remote selection in the color of the remote user.
 *
 * @implements {cmView.LayerMarker}
 */
class YRemoteSelectionMarker {
  /**
   * @param {cmView.RectangleMarker} rect
   * @param {string} color
   */
  constructor (rect, color) {
    this.rect = rect
    this.color = color
  }

  /**
   * @param {cmView.LayerMarker} other
   * @return {boolean}
   */
  eq (other) {
    return other instanceof YRemoteSelectionMarker && other.color === this.color && this.rect.eq(other.rect)
  }

  draw () {
    const elt = this.rect.draw()
    elt.style.backgroundColor = this.color
    return elt
  }

  /**
   * @param {HTMLElement} elt
   * @param {cmView.LayerMarker} prev
   * @return {boolean}
   */
  update (elt, prev) {
    if (!(prev instanceof YRemoteSelectionMarker) || !this.rect.update(elt, prev.rect)) {
      return false
    }
    elt.style.backgroundColor = this.color
    return true
  }
}

export class YRemoteSelectionsPluginValue {
  /**
   * @param {cmView.EditorView} view
   */
  constructor (view) {
    this.conf = view.state.facet(ySyncFacet)
    this._awareness = this.conf.awareness
    this._listener = this._awareness.on('change', ({ added, updated, removed }) => {
      const clients = added.concat(updated).concat(removed)
      if (clients.findIndex(id => id !== this.conf.awareness.doc.clientID) >= 0) {
        view.dispatch({ annotations: [yRemoteSelectionsAnnotation.of([])] })
      }
    })
    /**
     * The remote selections that are currently rendered. The selection layer reads this to draw the
     * selection backgrounds.
     *
     * @type {Array<RemoteSelection>}
     */
    this.remoteSelections = []
    /**
     * @type {cmView.DecorationSet}
     */
    this.decorations = cmState.RangeSet.of([])
    this._renderRemoteSelections(view.state)
  }

  destroy () {
    this._awareness.off('change', this._listener)
  }

  /**
   * Compute the remote selections and the caret decorations for the given state.
   *
   * The selection backgrounds are not rendered as decorations because mark- and line-decorations
   * affect the layout of the document. They are drawn by the selection layer instead.
   *
   * @param {cmState.EditorState} state
   */
  _renderRemoteSelections (state) {
    this.remoteSelections = getRemoteSelections(this.conf, state.doc.length)
    this.decorations = cmView.Decoration.set(this.remoteSelections.map(({ anchor, head, color, name }) => ({
      from: head,
      to: head,
      value: cmView.Decoration.widget({
        side: head - anchor > 0 ? -1 : 1, // the local cursor should be rendered outside the remote selection
        block: false,
        widget: new YRemoteCaretWidget(color, name)
      })
    })), true)
  }

  /**
   * @param {cmView.ViewUpdate} update
   */
  update (update) {
    const ytext = this.conf.ytext
    const awareness = this.conf.awareness
    const localAwarenessState = this.conf.awareness.getLocalState()

    // set local awareness state (update cursors)
    if (localAwarenessState != null) {
      const hasFocus = update.view.hasFocus && update.view.dom.ownerDocument.hasFocus()
      const sel = hasFocus ? update.state.selection.main : null
      const currentAnchor = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.anchor)
      const currentHead = localAwarenessState.cursor == null ? null : Y.createRelativePositionFromJSON(localAwarenessState.cursor.head)

      if (sel != null) {
        const anchor = Y.createRelativePositionFromTypeIndex(ytext, sel.anchor)
        const head = Y.createRelativePositionFromTypeIndex(ytext, sel.head)
        if (localAwarenessState.cursor == null || !Y.compareRelativePositions(currentAnchor, anchor) || !Y.compareRelativePositions(currentHead, head)) {
          awareness.setLocalStateField('cursor', {
            anchor,
            head
          })
        }
      } else if (localAwarenessState.cursor != null && hasFocus) {
        awareness.setLocalStateField('cursor', null)
      }
    }

    // update decorations (remote selections)
    this._renderRemoteSelections(update.state)
  }
}

/**
 * Draws the selection ranges of remote users in a layer behind the text - the same way CodeMirror's
 * `drawSelection` extension draws the local selection. The layer is positioned absolutely, so it
 * doesn't affect the layout of the document (no layout shifts), and the rectangles of partially and
 * fully selected lines connect seamlessly.
 *
 * @param {cmView.ViewPlugin<YRemoteSelectionsPluginValue, any>} plugin
 */
const yRemoteSelectionsLayer = plugin => cmView.layer({
  above: false,
  class: 'cm-ySelectionLayer',
  update: update => update.docChanged || update.viewportChanged || update.transactions.some(tr => tr.annotation(yRemoteSelectionsAnnotation) !== undefined),
  markers: view => {
    /**
     * @type {Array<cmView.LayerMarker>}
     */
    const markers = []
    view.plugin(plugin)?.remoteSelections.forEach(({ anchor, head, colorLight }) => {
      if (anchor !== head) {
        cmView.RectangleMarker.forRange(view, 'cm-ySelection', cmState.EditorSelection.range(anchor, head)).forEach(rect => {
          markers.push(new YRemoteSelectionMarker(rect, colorLight))
        })
      }
    })
    return markers
  }
})

export const yRemoteSelections = cmView.ViewPlugin.fromClass(YRemoteSelectionsPluginValue, {
  decorations: v => v.decorations,
  provide: yRemoteSelectionsLayer
})
