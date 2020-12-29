
import * as Y from 'yjs' // eslint-disable-line
import { StateField, Facet, ChangeSet, Transaction, Annotation, AnnotationType } from '@codemirror/next/state' // eslint-disable-line
import { Range, ViewPlugin, PluginValue, ViewUpdate, EditorView, Decoration, themeClass } from '@codemirror/next/view' // eslint-disable-line
import { RangeSet, RangeSetBuilder } from '@codemirror/next/rangeset'
import * as dom from 'lib0/dom.js'
import * as pair from 'lib0/pair.js'

const baseTheme = EditorView.baseTheme({
  $yselection: {
  },
  $ycursor: {
    position: 'relative',
    borderLeft: '1px solid black',
    borderRight: '1px solid black',
    marginLeft: '-1px',
    marginRight: '-1px',
    boxSizing: 'border-box',
    borderColor: 'orange',
    display: 'inline'
  },
  '$ycursor::before': {
    content: '"\u00a0"', // this is a unicode non-breaking space
    borderRadius: '50%',
    position: 'absolute',
    width: '.4em',
    height: '.4em',
    top: '-.32em',
    left: '-.2em',
    backgroundColor: 'inherit',
    transition: 'transform .3s ease-in-out'
  },
  '$ycursor:hover::before': {
    transformOrigin: 'bottom center',
    transform: 'scale(0)'
  },
  $ycursorInfo: {
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
    zIndex: 3,
    transition: 'opacity .3s ease-in-out',
    backgroundColor: 'inherit',
    // these should be separate
    opacity: 0,
    transitionDelay: '0s'
  },
  '$ycursor:hover > $ycursorInfo': {
    opacity: 1,
    transitionDelay: '0s'
  }
})

/**
 * @type {AnnotationType<YCollabConfig>}
 */
export const yAnnotation = Annotation.define()

/**
 * @extends {PluginValue}
 */
class YCollabViewPluginValue {
  /**
   * @param {EditorView} view
   */
  constructor (view) {
    this.view = view
    this.conf = view.state.facet(yCollabConfig)
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

class YCollabCursorViewPluginValue {
  /**
   * @param {EditorView} view
   */
  constructor (view) {
    this.view = view
    this.conf = view.state.facet(yCollabConfig)
    this.conf.awareness.on('change', (added, updated, removed) => {
      console.log('y-awareness', { added, updated, removed })
    })
    this.decorations = RangeSet.of([])
  }

  /**
   * @param {ViewUpdate} update
   */
  update (update) {
    const decorations = new RangeSetBuilder()
    if (3 !== 5) {
      decorations.add(3, 5, Decoration.mark({
        attributes: { style: 'background-color: orange' },
        class: themeClass('yselection')
      }))
    }
    decorations.add(5, 5, Decoration.widget({
      side: 5 - 1 > 0 ? -1 : 1,
      block: false,
      widget: new YRemoteCursorWidget('orange')
    }))
    this.decorations = decorations.finish()
  }
}

const YCollabCursorPlugin = ViewPlugin.fromClass(YCollabCursorViewPluginValue, {
  decorations: v => v.decorations
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
  baseTheme,
  yCollabConfig.of(new YCollabConfig(ytext, awareness)),
  YCollabViewPlugin,
  YCollabCursorPlugin
]
