
import * as Y from 'yjs' // eslint-disable-line
import { StateField, Facet, ChangeSet, Transaction, Annotation, AnnotationType } from '@codemirror/next/state' // eslint-disable-line
import { Range, ViewPlugin, PluginValue, ViewUpdate, EditorView, Decoration } from '@codemirror/next/view' // eslint-disable-line
import { RangeSet, RangeSetBuilder } from '@codemirror/next/rangeset'
import * as dom from 'lib0/dom.js'
import * as pair from 'lib0/pair.js'

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
    return /** @type {HTMLElement} */ (dom.element('span', [pair.create('class', 'y-cm-cursor'), pair.create('style', `color: ${this.color}`)]))
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
      attributes: { color: 'blue' },
      class: 'y-cm-selection'
    }))
    decorations.add(5, 5, Decoration.widget({
      side: 5 - 1 > 0 ? -1 : 1,
      block: false,
      widget: new YRemoteCursorWidget('blue')
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
  yCollabConfig.of(new YCollabConfig(ytext, awareness)),
  YCollabViewPlugin,
  YCollabCursorPlugin
]
