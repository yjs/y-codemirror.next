/* eslint-env browser */

import * as Y from 'yjs'
// @ts-ignore
import { ycollab } from 'y-codemirror.next'
import { WebrtcProvider } from 'y-webrtc'

import { EditorState, EditorView, basicSetup } from '@codemirror/next/basic-setup'
import { javascript } from '@codemirror/next/lang-javascript'
// import { oneDark } from '@codemirror/next/theme-one-dark'

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('codemirror6-demo-room', ydoc)
const ytext = ydoc.getText('codemirror')

const state = EditorState.create({
  doc: ytext.toString(),
  extensions: [
    basicSetup,
    javascript(),
    ycollab(ytext, provider.awareness)
    // oneDark
  ]
})

const view = new EditorView({ state, parent: /** @type {HTMLElement} */ (document.querySelector('#editor')) })

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
window.example = { provider, ydoc, ytext, view }
