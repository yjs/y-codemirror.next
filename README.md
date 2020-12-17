# y-codemirror.next

> [CodeMirror](https://codemirror.net/6) Binding for [Yjs](https://github.com/yjs/yjs) - [Demo](https://demos.yjs.dev/codemirror/codemirror.html)

This binding binds a [Y.Text](https://github.com/yjs/yjs#Shared-Types) to a CodeMirror editor.

## Features

* Sync CodeMirror editor
* Shared Cursors
* Shared Undo / Redo (each client has its own undo-/redo-history)
* Successfully recovers when concurrents edit result in an invalid document schema

![CodeMirror Yjs Demo](https://user-images.githubusercontent.com/5553757/79250004-5ed1ac80-7e7e-11ea-81b8-9f833e2d8e66.gif)

### Example

```js
import * as Y from 'yjs'
import { CodemirrorBinding } from 'y-codemirror'
import { WebrtcProvider } from 'y-webrtc'
import CodeMirror from 'codemirror'

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('codemirror-demo-room', ydoc)
const yText = ydoc.getText('codemirror')

const editor = CodeMirror(editorDiv, {
  mode: 'javascript',
  lineNumbers: true
})

const binding = new CodemirrorBinding(yText, editor, provider.awareness)
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
