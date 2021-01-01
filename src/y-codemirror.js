
import * as Y from 'yjs' // eslint-disable-line

import { ySync, ySyncFacet, YSyncConfig } from './y-sync.js'
import { yRemoteSelections, yRemoteSelectionsTheme } from './y-remote-selections.js'

export { yRemoteSelections, yRemoteSelectionsTheme, ySync, ySyncFacet, YSyncConfig }

/**
 * @param {Y.Text} ytext
 * @param {any} awareness
 */
export const yCollab = (ytext, awareness) => [
  ySyncFacet.of(new YSyncConfig(ytext, awareness)),
  ySync,
  yRemoteSelectionsTheme,
  yRemoteSelections
]
