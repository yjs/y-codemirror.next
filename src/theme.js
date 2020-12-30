
import { EditorView } from '@codemirror/next/view' // eslint-disable-line

export const baseTheme = EditorView.baseTheme({
  $yselection: {
  },
  $ycursor: {
    position: 'relative',
    borderLeft: '1px solid black',
    borderRight: '1px solid black',
    marginLeft: '-1px',
    marginRight: '-1px',
    boxSizing: 'border-box',
    borderColor: 'orange',
    display: 'inline'
  },
  '$ycursor::before': {
    content: '"\u00a0"', // this is a unicode non-breaking space
    borderRadius: '50%',
    position: 'absolute',
    width: '.4em',
    height: '.4em',
    top: '-.37em',
    left: '-.2em',
    backgroundColor: 'inherit',
    transition: 'transform .3s ease-in-out'
  },
  '$ycursor:hover::before': {
    transformOrigin: 'bottom center',
    transform: 'scale(0)'
  },
  $ycursorInfo: {
    position: 'absolute',
    top: '-1.05em',
    left: '-1px',
    fontSize: '.75em',
    fontFamily: 'serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 'normal',
    userSelect: 'none',
    color: 'white',
    paddingLeft: '2px',
    paddingRight: '2px',
    zIndex: 3,
    transition: 'opacity .3s ease-in-out',
    backgroundColor: 'inherit',
    // these should be separate
    opacity: 0,
    transitionDelay: '0s'
  },
  '$ycursor:hover > $ycursorInfo': {
    opacity: 1,
    transitionDelay: '0s'
  }
})
