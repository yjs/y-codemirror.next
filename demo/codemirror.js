/* eslint-env browser */

import * as Y from 'yjs'
// import { CodemirrorBinding } from 'y-codemirror.next'
import { WebrtcProvider } from 'y-webrtc'

import { EditorState, EditorView, basicSetup } from '@codemirror/next/basic-setup'
import { javascript } from '@codemirror/next/lang-javascript'

// import {StreamLanguage} from "@codemirror/next/stream-parser"
// import legacyJS from "@codemirror/next/legacy-modes/src/javascript"

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('codemirror6-demo-room', ydoc)
const yText = ydoc.getText('codemirror')

const state = EditorState.create({
  doc: `
console.log('uidtarn')
  `,
  extensions: [
    basicSetup,
    javascript()
  ]
})

const view = new EditorView({ state, parent: /** @type {HTMLElement} */ (document.querySelector('#editor')) })

// const binding = new CodemirrorBinding(yText, editor, provider.awareness)

const connectBtn = /** @type {HTMLElement} */ (document.getElementById('y-connect-btn'))
connectBtn.addEventListener('click', () => {
  if (provider.shouldConnect) {
    provider.disconnect()
    connectBtn.textContent = 'Connect'
  } else {
    provider.connect()
    connectBtn.textContent = 'Disconnect'
  }
})

// @ts-ignore
window.example = { provider, ydoc, yText, view }
