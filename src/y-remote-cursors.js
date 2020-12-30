
import { ViewPlugin, ViewUpdate, EditorView, Decoration, themeClass } from '@codemirror/next/view' // eslint-disable-line
import { RangeSet, RangeSetBuilder } from '@codemirror/next/rangeset'
import * as dom from 'lib0/dom.js'
import * as pair from 'lib0/pair.js'
import { ySyncFacet } from './y-sync.js'

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

export const yRemoteCursors = ViewPlugin.fromClass(YRemoteCursorsPluginValue, {
  decorations: v => v.decorations
})
