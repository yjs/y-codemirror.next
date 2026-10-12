import * as t from 'lib0/testing'
import * as prng from 'lib0/prng'
import * as math from 'lib0/math'
import * as promise from 'lib0/promise'
import * as error from 'lib0/error'
import * as Y from '@y/y' // eslint-disable-line
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from '@y/protocols/awareness'

import { applyRandomTests } from '@y/y/testHelper'

import { yCollab, yRemoteSelections } from '@y/codemirror'

/**
 * @param {Y.Doc} ydoc
 * @return {EditorView}
 */
const createNewCodemirror = ydoc => {
  const state = EditorState.create({
    doc: ydoc.get().toString(),
    extensions: [
      basicSetup,
      yCollab(ydoc.get(), null, { undoManager: false })
    ]
  })
  return new EditorView({ state })
}

let charCounter = 0

/**
 * @type {Array<function(Y.Doc, prng.PRNG, EditorView):{from:number,to:number,insert:string}>}
 */
const trChange = [
  /**
   * @param {Y.Doc} _y
   * @param {prng.PRNG} gen
   * @param {EditorView} cm
   */
  (_y, gen, cm) => { // insert text
    const from = prng.int32(gen, 0, cm.state.doc.length)
    const insert = charCounter++ + prng.word(gen, 1, 6)
    return {
      from,
      to: from,
      insert
    }
  },
  /**
   * @param {Y.Doc} _y
   * @param {prng.PRNG} gen
   * @param {EditorView} cm
   */
  (_y, gen, cm) => { // delete text
    const from = prng.int32(gen, 0, cm.state.doc.length)
    const to = from + prng.int32(gen, 0, cm.state.doc.length - from)
    const insert = ''
    return {
      from,
      to,
      insert
    }
  },
  /**
   * @param {Y.Doc} _y
   * @param {prng.PRNG} gen
   * @param {EditorView} cm
   */
  (_y, gen, cm) => { // replace text
    const from = prng.int32(gen, 0, cm.state.doc.length)
    const to = from + math.min(prng.int32(gen, 0, cm.state.doc.length - from), 3)
    const insert = charCounter++ + prng.word(gen)
    return {
      from,
      to,
      insert
    }
  },
  /**
   * @param {Y.Doc} _y
   * @param {prng.PRNG} gen
   * @param {EditorView} cm
   */
  (_y, gen, cm) => { // insert paragraph
    const from = prng.int32(gen, 0, cm.state.doc.length)
    const to = from + math.min(prng.int32(gen, 0, cm.state.doc.length - from), 3)
    const insert = '\n'
    return {
      from,
      to,
      insert
    }
  }
]

const cmChanges = [
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {EditorView} cm
   */
  (y, gen, cm) => { // create a transaction containing 1-4 changes
    const changes = []
    const numOfChanges = prng.int31(gen, 1, 4)
    for (let i = 0; i < numOfChanges; i++) {
      changes.push(prng.oneOf(gen, trChange)(y, gen, cm))
    }
    cm.dispatch({ changes })
  }
]

/**
 * @param {any} result
 */
const checkResult = result => {
  for (let i = 1; i < result.testObjects.length; i++) {
    const p1 = result.testObjects[i - 1].state.doc.toString()
    const p2 = result.testObjects[i].state.doc.toString()
    t.compare(p1, p2)
  }
  charCounter = 0
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges1 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 1, createNewCodemirror))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges2 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 2, createNewCodemirror))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges3 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 3, createNewCodemirror))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges30 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 30, createNewCodemirror))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges40 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 40, createNewCodemirror))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges70 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 70, createNewCodemirror))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges100 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 100, createNewCodemirror))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateProsemirrorChanges300 = tc => {
  checkResult(applyRandomTests(tc, cmChanges, 300, createNewCodemirror))
}

/**
 * Remote selections must not affect the layout of the document (see
 * https://github.com/yjs/y-codemirror.next/issues/44). The selection background is drawn in a
 * separate layer behind the text instead of using mark- and line-decorations. Only the remote caret
 * is rendered as a (zero-width) widget decoration.
 *
 * @param {t.TestCase} _tc
 */
export const testRemoteSelections = async _tc => {
  const ydoc1 = new Y.Doc()
  const ydoc2 = new Y.Doc()
  const ytext1 = ydoc1.get()
  const ytext2 = ydoc2.get()
  ytext1.insert(0, 'first line\nsecond line\nthird line')
  Y.applyUpdate(ydoc2, Y.encodeStateAsUpdate(ydoc1))
  // forward document- and awareness-updates from the second to the first client
  ydoc2.on('update', update => Y.applyUpdate(ydoc1, update))
  const awareness1 = new Awareness(ydoc1)
  const awareness2 = new Awareness(ydoc2)
  awareness2.on('update', ({ added, updated, removed }) => {
    applyAwarenessUpdate(awareness1, encodeAwarenessUpdate(awareness2, added.concat(updated).concat(removed)), 'remote')
  })
  awareness2.setLocalStateField('user', { name: 'Remote', color: '#ee6352', colorLight: '#ee635233' })
  const view = new EditorView({
    state: EditorState.create({
      doc: ytext1.toString(),
      extensions: [basicSetup, yCollab(ytext1, awareness1, { undoManager: false })]
    })
  })
  const plugin = view.plugin(yRemoteSelections)
  if (plugin == null) error.unexpectedCase()
  t.compare(plugin.remoteSelections.length, 0)
  // the selection layer is rendered outside of the content
  t.assert(view.scrollDOM.querySelector('.cm-ySelectionLayer') != null)

  // remote user selects "line\nsecond " (spanning two lines)
  awareness2.setLocalStateField('cursor', {
    anchor: Y.createRelativePositionFromTypeIndex(ytext2, 6),
    head: Y.createRelativePositionFromTypeIndex(ytext2, 18)
  })
  await promise.wait(0) // let the view measure & draw the selection layer
  t.compare(plugin.remoteSelections.length, 1)
  t.compare(plugin.remoteSelections[0].anchor, 6)
  t.compare(plugin.remoteSelections[0].head, 18)
  t.compare(plugin.remoteSelections[0].name, 'Remote')
  t.compare(plugin.remoteSelections[0].color, '#ee6352')
  t.compare(plugin.remoteSelections[0].colorLight, '#ee635233')
  // the caret is rendered as a widget at the head of the selection
  const caretIter = plugin.decorations.iter()
  t.assert(caretIter.value != null && caretIter.from === 18 && caretIter.to === 18)
  caretIter.next()
  t.assert(caretIter.value == null)
  t.compare(view.contentDOM.querySelectorAll('.cm-ySelectionCaret').length, 1)
  // the selection background must not be rendered as decorations because they change the layout
  t.assert(view.contentDOM.querySelector('.cm-ySelection, .cm-yLineSelection') == null)

  // the remote selection must follow document changes
  ytext2.insert(0, 'xyz')
  await promise.wait(0)
  t.compare(view.state.doc.toString(), ytext1.toString())
  t.compare(plugin.remoteSelections[0].anchor, 9)
  t.compare(plugin.remoteSelections[0].head, 21)

  // the remote selection is removed when the remote user removes the cursor
  awareness2.setLocalStateField('cursor', null)
  await promise.wait(0)
  t.compare(plugin.remoteSelections.length, 0)
  t.compare(view.contentDOM.querySelectorAll('.cm-ySelectionCaret').length, 0)

  view.destroy()
  awareness1.destroy()
  awareness2.destroy()
  ydoc1.destroy()
  ydoc2.destroy()
}
