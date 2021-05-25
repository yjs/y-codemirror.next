import * as Y from 'yjs' // eslint-disable-line
import {
  EditorState, StateCommand, Facet, Annotation, AnnotationType // eslint-disable-line
} from '@codemirror/state'

import { ViewPlugin, ViewUpdate, KeyBinding, EditorView } from '@codemirror/view' // eslint-disable-line
import { ySyncFacet } from './y-sync.js'
import { YRange } from './y-range.js' // eslint-disable-line
import { createMutex } from 'lib0/mutex'

export class YUndoManagerConfig {
  /**
   * @param {Y.UndoManager} undoManager
   */
  constructor (undoManager) {
    this.undoManager = undoManager
  }

  /**
   * @param {any} origin
   */
  addTrackedOrigin (origin) {
    this.undoManager.trackedOrigins.add(origin)
  }

  /**
   * @param {any} origin
   */
  removeTrackedOrigin (origin) {
    this.undoManager.trackedOrigins.delete(origin)
  }

  /**
   * @return {boolean} Whether a change was undone.
   */
  undo () {
    return this.undoManager.undo() != null
  }

  /**
   * @return {boolean} Whether a change was redone.
   */
  redo () {
    return this.undoManager.redo() != null
  }
}

/**
 * @type {Facet<YUndoManagerConfig, YUndoManagerConfig>}
 */
export const yUndoManagerFacet = Facet.define({
  combine (inputs) {
    return inputs[inputs.length - 1]
  }
})

/**
 * @type {AnnotationType<YUndoManagerConfig>}
 */
export const yUndoManagerAnnotation = Annotation.define()

/**
 * @extends {PluginValue}
 */
class YUndoManagerPluginValue {
  /**
   * @param {EditorView} view
   */
  constructor (view) {
    this.view = view
    this.conf = view.state.facet(yUndoManagerFacet)
    this.syncConf = view.state.facet(ySyncFacet)
    /**
     * @type {null | YRange}
     */
    this._beforeChangeSelection = null
    this._mux = createMutex()

    this._onStackItemAdded = ({ stackItem, changedParentTypes }) => {
      // only store metadata if this type was affected
      if (changedParentTypes.has(this.syncConf.ytext) && this._beforeChangeSelection) {
        stackItem.meta.set(this, this._beforeChangeSelection)
      }
    }
    this._onStackItemPopped = ({ stackItem }) => {
      const sel = stackItem.meta.get(this)
      if (sel) {
        const selection = this.syncConf.fromYRange(sel)
        view.dispatch(view.state.update({ selection }))
        this._beforeChange()
      }
    }
    /**
     * Do this without mutex, simply use the sync annotation
     */
    this._beforeChange = () => {
      // update the the beforeChangeSelection that is stored befor each change to the editor (except when applying remote changes)
      this._mux(() => {
        // store the selection before the change is applied so we can restore it with the undo manager.
        this._beforeChangeSelection = this.syncConf.toYRange(this.view.state.selection.main)
      })
    }
    this.conf.undoManager.on('stack-item-added', this._onStackItemAdded)
    this.conf.undoManager.on('stack-item-popped', this._onStackItemPopped)
  }

  /**
   * @param {ViewUpdate} update
   */
  update (update) {
    // This only works when YUndoManagerPlugin is included before the sync plugin
    this._beforeChange()
  }

  destroy () {
    this.conf.undoManager.off('stack-item-added', this._onStackItemAdded)
    this.conf.undoManager.off('stack-item-popped', this._onStackItemPopped)
  }
}
export const yUndoManager = ViewPlugin.fromClass(YUndoManagerPluginValue)

/**
 * @type {StateCommand}
 */
export const undo = ({ state, dispatch }) =>
  state.facet(yUndoManagerFacet).undo() || true

/**
 * @type {StateCommand}
 */
export const redo = ({ state, dispatch }) =>
  state.facet(yUndoManagerFacet).redo() || true

/**
 * @param {EditorState} state
 * @return {number}
 */
export const undoDepth = state => state.facet(yUndoManagerFacet).undoManager.undoStack.length

/**
 * @param {EditorState} state
 * @return {number}
 */
export const redoDepth = state => state.facet(yUndoManagerFacet).undoManager.redoStack.length

/**
 * Default key bindigs for the undo manager.
 * @type {Array<KeyBinding>}
 */
export const yUndoManagerKeymap = [
  { key: 'Mod-z', run: undo, preventDefault: true },
  { key: 'Mod-y', mac: 'Mod-Shift-z', run: redo, preventDefault: true }
]
