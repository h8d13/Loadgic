import { RangeSet } from '@codemirror/state'
import { GutterMarker, gutter } from '@codemirror/view'

const marker = (cls: string, title: string) =>
  new (class extends GutterMarker {
    toDOM() {
      const el = document.createElement('div')
      el.className = cls
      el.title = title
      return el
    }
  })()

const markers = {
  entry: marker('cm-entry-marker', 'Entry'),
  break: marker('cm-breakpoint-marker', 'Break'),
  exit: marker('cm-exit-marker', 'Exit'),
}

export type MarkerState = { entry: number | null; breaks: Set<number>; exits: Set<number> }

export function cycleMarker(state: MarkerState, line: number): MarkerState {
  const { entry, breaks, exits } = state
  if (entry === line) return { entry: null, breaks: new Set(breaks).add(line), exits }
  if (breaks.has(line)) {
    const b = new Set(breaks); b.delete(line)
    return { entry, breaks: b, exits: new Set(exits).add(line) }
  }
  if (exits.has(line)) {
    const e = new Set(exits); e.delete(line)
    return { entry, breaks, exits: e }
  }
  return entry === null
    ? { entry: line, breaks, exits }
    : { entry, breaks: new Set(breaks).add(line), exits }
}

export function createMarkerGutter(state: MarkerState, onCycle: (line: number) => void) {
  return gutter({
    class: 'cm-breakpoint-gutter',
    markers: (view) => {
      const list: { from: number; to: number; value: GutterMarker }[] = []
      for (let i = 1; i <= view.state.doc.lines; i++) {
        const pos = view.state.doc.line(i).from
        const m = state.entry === i ? markers.entry
          : state.breaks.has(i) ? markers.break
          : state.exits.has(i) ? markers.exit : null
        if (m) list.push({ from: pos, to: pos, value: m })
      }
      return RangeSet.of(list, true)
    },
    domEventHandlers: {
      mousedown: (view, block) => (onCycle(view.state.doc.lineAt(block.from).number), true),
    },
  })
}
