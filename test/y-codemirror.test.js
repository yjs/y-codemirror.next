
import * as t from 'lib0/testing.js'
import * as prng from 'lib0/prng.js'
import * as math from 'lib0/math.js'
import * as Y from 'yjs' // eslint-disable-line
import { applyRandomTests } from 'yjs/tests/testHelper.js'

import CodeMirror from 'codemirror'
import { CodemirrorBinding } from '../src/y-codemirror.js'

/**
 * @param {any} y
 * @return {CodeMirror.Editor}
 */
const createNewCodemirror = y => {
  const editor = CodeMirror(document.createElement('div'), {
    mode: 'javascript',
    lineNumbers: true
  })
  const binding = new CodemirrorBinding(y.getText('codemirror'), editor)
  return binding.cm
}

let charCounter = 0

const cmChanges = [
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {CodeMirror.Editor} cm
   */
  (y, gen, cm) => { // insert text
    const insertPos = prng.int32(gen, 0, cm.getValue().length)
    const text = charCounter++ + prng.utf16String(gen, 6)
    const pos = cm.posFromIndex(insertPos)
    cm.replaceRange(text, pos, pos)
  },
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {CodeMirror.Editor} cm
   */
  (y, gen, cm) => { // delete text
    const insertPos = prng.int32(gen, 0, cm.getValue().length)
    const overwrite = prng.int32(gen, 0, cm.getValue().length - insertPos)
    cm.replaceRange('', cm.posFromIndex(insertPos), cm.posFromIndex(insertPos + overwrite))
  },
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {CodeMirror.Editor} cm
   */
  (y, gen, cm) => { // replace text
    const insertPos = prng.int32(gen, 0, cm.getValue().length)
    const overwrite = math.min(prng.int32(gen, 0, cm.getValue().length - insertPos), 3)
    const text = charCounter++ + prng.word(gen)
    cm.replaceRange(text, cm.posFromIndex(insertPos), cm.posFromIndex(insertPos + overwrite))
  },
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {CodeMirror.Editor} cm
   */
  (y, gen, cm) => { // insert paragraph
    const insertPos = prng.int32(gen, 0, cm.getValue().length)
    const overwrite = math.min(prng.int32(gen, 0, cm.getValue().length - insertPos), 3)
    const text = '\n'
    cm.replaceRange(text, cm.posFromIndex(insertPos), cm.posFromIndex(insertPos + overwrite))
  }
]

/**
 * @param {any} result
 */
const checkResult = result => {
  for (let i = 1; i < result.testObjects.length; i++) {
    const p1 = result.testObjects[i - 1].getValue()
    const p2 = result.testObjects[i].getValue()
    t.compare(p1, p2)
  }
  // console.log(result.testObjects[0].getValue())
  charCounter = 0
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
