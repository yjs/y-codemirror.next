
import * as Y from 'yjs' // eslint-disable-line

import { baseTheme } from './theme.js'
import { ySync, ySyncFacet, YSyncConfig } from './y-sync.js'
import { yRemoteCursors } from './y-remote-cursors.js'

export { baseTheme, ySync, ySyncFacet, YSyncConfig, yRemoteCursors }

/**
 * @param {Y.Text} ytext
 * @param {any} awareness
 */
export const yCollab = (ytext, awareness) => [
  baseTheme,
  ySyncFacet.of(new YSyncConfig(ytext, awareness)),
  ySync,
  yRemoteCursors
]
