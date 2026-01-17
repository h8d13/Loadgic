import { RangeSet, type Extension } from '@codemirror/state'
import { GutterMarker, gutter, Decoration, EditorView } from '@codemirror/view'

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

const lineTheme = EditorView.baseTheme({
  '.cm-line-entry': { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  '.cm-line-break': { backgroundColor: 'rgba(234, 179, 8, 0.15)' },
  '.cm-line-exit': { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
})

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

export function createMarkerExtensions(state: MarkerState, onCycle: (line: number) => void): Extension {
  const gutterExt = gutter({
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

  const lineDecos = EditorView.decorations.compute([], (editorState) => {
    const decos: ReturnType<Decoration['range']>[] = []
    for (let i = 1; i <= editorState.doc.lines; i++) {
      const pos = editorState.doc.line(i).from
      if (state.entry === i) decos.push(Decoration.line({ class: 'cm-line-entry' }).range(pos))
      else if (state.breaks.has(i)) decos.push(Decoration.line({ class: 'cm-line-break' }).range(pos))
      else if (state.exits.has(i)) decos.push(Decoration.line({ class: 'cm-line-exit' }).range(pos))
    }
    return Decoration.set(decos)
  })

  return [gutterExt, lineDecos, lineTheme]
}
