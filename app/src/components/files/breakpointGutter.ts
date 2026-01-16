import { RangeSet } from '@codemirror/state'
import { GutterMarker, gutter } from '@codemirror/view'

// Marker types
class EntryMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div')
    el.className = 'cm-entry-marker'
    el.title = 'Entry point'
    return el
  }
}

class BreakMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div')
    el.className = 'cm-breakpoint-marker'
    el.title = 'Breakpoint'
    return el
  }
}

class ExitMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div')
    el.className = 'cm-exit-marker'
    el.title = 'Exit point'
    return el
  }
}

const entryMarker = new EntryMarker()
const breakMarker = new BreakMarker()
const exitMarker = new ExitMarker()

export type MarkerState = {
  entry: number | null
  breaks: Set<number>
  exits: Set<number>
}

export type MarkerAction =
  | { type: 'cycle'; line: number }
  | { type: 'clear' }

// Cycle: none → entry → break → exit → none
// Entry: only one (auto-clears previous)
// Breaks: multiple
// Exits: multiple
export function markerReducer(state: MarkerState, action: MarkerAction): MarkerState {
  if (action.type === 'clear') {
    return { entry: null, breaks: new Set(), exits: new Set() }
  }

  const { line } = action
  const isEntry = state.entry === line
  const isBreak = state.breaks.has(line)
  const isExit = state.exits.has(line)

  // Determine current state and cycle to next
  if (isEntry) {
    // entry → break
    return {
      entry: null,
      breaks: new Set(state.breaks).add(line),
      exits: state.exits,
    }
  }

  if (isBreak) {
    // break → exit
    const newBreaks = new Set(state.breaks)
    newBreaks.delete(line)
    return {
      entry: state.entry,
      breaks: newBreaks,
      exits: new Set(state.exits).add(line),
    }
  }

  if (isExit) {
    // exit → none
    const newExits = new Set(state.exits)
    newExits.delete(line)
    return {
      entry: state.entry,
      breaks: state.breaks,
      exits: newExits,
    }
  }

  // none → entry (if no entry exists) or → break (if entry exists elsewhere)
  if (state.entry === null) {
    return {
      entry: line,
      breaks: state.breaks,
      exits: state.exits,
    }
  } else {
    // Entry exists elsewhere, go straight to break
    return {
      entry: state.entry,
      breaks: new Set(state.breaks).add(line),
      exits: state.exits,
    }
  }
}

export function createMarkerGutter(
  state: MarkerState,
  onCycle: (line: number) => void
) {
  return gutter({
    class: 'cm-breakpoint-gutter',
    markers: (view) => {
      const markers: { from: number; to: number; value: GutterMarker }[] = []

      for (let i = 1; i <= view.state.doc.lines; i++) {
        const line = view.state.doc.line(i)
        if (state.entry === i) {
          markers.push({ from: line.from, to: line.from, value: entryMarker })
        } else if (state.breaks.has(i)) {
          markers.push({ from: line.from, to: line.from, value: breakMarker })
        } else if (state.exits.has(i)) {
          markers.push({ from: line.from, to: line.from, value: exitMarker })
        }
      }

      return RangeSet.of(markers, true)
    },
    domEventHandlers: {
      mousedown: (view, block) => {
        const line = view.state.doc.lineAt(block.from)
        onCycle(line.number)
        return true
      },
    },
  })
}
