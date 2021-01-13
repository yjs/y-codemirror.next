# y-codemirror.next

> [CodeMirror 6](https://codemirror.net/6) editor binding for [Yjs](https://github.com/yjs/yjs) - [Demo](https://demos.yjs.dev/codemirror/codemirror.html)

This binding binds a [Y.Text](https://docs.yjs.dev/api/shared-types/y.text) to a CodeMirror editor.

## Features

* Sync CodeMirror 6 editor
* Awareness: Render remote selection ranges and cursors - as a separate plugin
* Shared Undo / Redo (each client has its own undo-/redo-history) - as a separate plugin

## TODO

* undo plugin?
* y-selections

![CodeMirror Yjs Demo](https://user-images.githubusercontent.com/5553757/79250004-5ed1ac80-7e7e-11ea-81b8-9f833e2d8e66.gif)

### Example

```js
/* eslint-env browser */

import * as Y from 'yjs'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
import { WebrtcProvider } from 'y-webrtc'

import { EditorState, EditorView, basicSetup } from '@codemirror/next/basic-setup'
import { javascript } from '@codemirror/next/lang-javascript'
// import { oneDark } from '@codemirror/next/theme-one-dark'

import * as random from 'lib0/random.js'

export const usercolors = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' }
]

// select a random color for this user
export const userColor = usercolors[random.uint32() % usercolors.length]

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('codemirror6-demo-room', ydoc)
const ytext = ydoc.getText('codemirror')

provider.awareness.setLocalStateField('user', {
  name: 'Anonymous ' + Math.floor(Math.random() * 100),
  color: userColor.color,
  colorLight: userColor.light
})

const state = EditorState.create({
  doc: ytext.toString(),
  extensions: [
    basicSetup,
    javascript(),
    yCollab(ytext, provider.awareness)
    // oneDark
  ]
})

const view = new EditorView({ state, parent: /** @type {HTMLElement} */ (document.querySelector('#editor')) })

```

Also look [here](https://github.com/yjs/yjs-demos/tree/master/codemirror) for a working example.

## API

```js
const binding = new CodemirrorBinding(yText: Y.Text, editor: CodeMirror.Editor, [, awareness: y-protocols.Awareness])
```
Binds a Y.Text type to the CodeMirror document that is currently in use. You can <code>swapDoc</code> the CodeMirror document while a binding is active. Make sure to destroy a binding when it is no longer needed.

<dl>
  <b><code>destroy()</code></b>
  <dd>
Destroy the CodemirrorBinding, remove all event listeners from the editor and the Yjs document, and destroy the UndoManager.
  </dd>
  <b><code>cm: CodeMirror.Editor</code></b>
  <dd>
Reference to the CodeMirror editor.
  </dd>
  <b><code>cmDoc: CodeMirror.Doc</code></b>
  <dd>
Reference to the CodeMirror document.
  </dd>
  <b><code>type: Y.Text</code></b>
  <dd>
Reference to the Y.Text type that this binding binds to.
  </dd>
  <b><code>doc: Y.Doc</code></b>
  <dd>
Reference to the Yjs document.
  </dd>
  <b><code>awareness: y-protocols.Awareness</code></b>
  <dd>
Reference to the Awareness instance, if defined.
  </dd>
</dl>

The shared cursors depend on the Awareness instance that is exported by most providers. The Awareness protocol handles non-permanent data like the number of users, their user names, their cursor location, and their colors. You can change the name and color of the user like this:

```js
example.binding.awareness.setLocalStateField('user', { color: '#008833', name: 'My real name' })
```

In order to render cursor information you need to embed custom CSS for the user icon. This is a template that you can use for styling cursor information.

```css
.remote-caret {
  position: absolute;
  border-left: black;
  border-left-style: solid;
  border-left-width: 2px;
  height: 1em;
}
.remote-caret > div {
  position: relative;
  top: -1.05em;
  font-size: 13px;
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
}
```

## License

[The MIT License](./LICENSE) © Kevin Jahns
