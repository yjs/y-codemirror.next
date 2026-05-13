# y-codemirror.next

> [CodeMirror 6](https://codemirror.net/) 编辑器绑定 [Yjs](https://github.com/yjs/yjs) - [演示](https://demos.yjs.dev/codemirror.next/codemirror.next.html)

> **注意：** 这个仓库的 `main` 分支是不稳定版本 `@y/codemirror` 的开发分支，它添加了对 Yjs v14 (`@y/y`) 的支持。大多数用户目前应该继续使用稳定的 `y-codemirror.next` 包和 Yjs v13。

这个绑定将 [Y.Text](https://docs.yjs.dev/api/shared-types/y.text) 绑定到 CodeMirror 编辑器。

## 功能特性

* 同步 CodeMirror 6 编辑器
* 感知：渲染远程选择范围和光标 - 作为单独的插件
* 共享撤销/重做（每个客户端都有自己的撤销/重做历史）- 作为单独的插件

![CodeMirror Yjs Demo](https://user-images.githubusercontent.com/5553757/79250004-5ed1ac80-7e7e-11ea-81b8-9f833e2d8e66.gif)

### 示例

```js
/* eslint-env browser */

import * as Y from '@y/y'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
import { WebrtcProvider } from 'y-webrtc'

import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from '@codemirror/lang-javascript'

import * as random from 'lib0/random'

export const usercolors = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
]

const usercolor = usercolors[random.uint32() % usercolors.length]

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('codemirror.next.example', ydoc)

const ytext = ydoc.getText('codemirror')
const undoManager = new Y.UndoManager(ytext)

const state = EditorState.create({
  doc: ytext.toString(),
  extensions: [
    basicSetup,
    javascript(),
    yCollab(ytext, provider.awareness, {
      undoManager,
      userColors: usercolors
    }),
  ],
})

const view = new EditorView({ state, parent: document.body })
```

## 安装

```bash
npm install y-codemirror.next yjs y-webrtc
```

## API

### yCollab(ytext, awareness, options)

将 Y.Text 绑定到 CodeMirror 编辑器。

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| ytext | Y.Text | Yjs 文本类型 |
| awareness | Awareness | 感知实例 |
| options | Object | 配置选项 |

**选项：**

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| undoManager | Y.UndoManager | null | 撤销管理器 |
| userColors | Array | [] | 用户颜色配置 |
| cursorBuilder | Function | 默认光标构建器 | 自定义光标构建函数 |
| selectionBuilder | Function | 默认选择构建器 | 自定义选择构建函数 |
| selectionFilter | Function | null | 选择过滤函数 |

## 许可证

MIT

---

> 项目地址：[yjs/y-codemirror.next](https://github.com/yjs/y-codemirror.next)
> npm 包：[y-codemirror.next](https://www.npmjs.com/package/y-codemirror.next)
