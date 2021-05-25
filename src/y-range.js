import * as Y from 'yjs'

export class YRange {
  /**
   * @param {Y.RelativePosition} yanchor
   * @param {Y.RelativePosition} yhead
   */
  constructor (yanchor, yhead) {
    this.yanchor = yanchor
    this.yhead = yhead
  }

  /**
   * @returns {any}
   */
  toJSON () {
    return {
      yanchor: Y.relativePositionToJSON(this.yanchor),
      yhead: Y.relativePositionToJSON(this.yhead)
    }
  }

  /**
   * @param {any} json
   */
  static fromJSON (json) {
    return new YRange(Y.createRelativePositionFromJSON(json.yanchor), Y.createRelativePositionFromJSON(json.yhead))
  }
}
