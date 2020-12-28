
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
    position: 'relative'
  },
  $ycursorInfo: {
    position: 'absolute',
    top: '-1.05em',
    left: '-1px',
    fontSize: '.6em',
    fontFamily: 'serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 'normal',
    userSelect: 'none',
    color: 'white',
    paddingLeft: '2px',
    paddingRight: '2px',
    zIndex: 3,
    transition: 'opacity .3s ease-in-out'
  }
})

/*
.remote-caret {
  position: relative;
  border-left: 1px solid black;
  border-right: 1px solid black;
  margin-left: -1px;
  margin-right: -1px;
  box-sizing: border-box;
}
.remote-caret > div {
  position: absolute;
  top: -1.05em;
  left: -1px;
  font-size: .6em;
  background-color: rgb(250, 129, 0);
  font-family: serif;
  font-style: normal;
  font-weight: normal;
  line-height: normal;
  user-select: none;
  color: white;
  padding-left: 2px;
  padding-right: 2px;
  z-index: 3;
  transition: opacity .3s ease-in-out;
}
.remote-caret.hide-name > div {
  transition-delay: .7s;
  opacity: 0;
}
.remote-caret:hover > div {
  opacity: 1;
  transition-delay: 0s;
}
*/

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
    return /** @type {HTMLElement} */ (dom.element('div', [pair.create('class', themeClass('ycursor')), pair.create('style', `background-color: ${this.color}`)]))
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
    decorations.add(1, 5, Decoration.mark({
      attributes: { style: 'background-color: orange' },
      class: themeClass('yselection')
    }))
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
