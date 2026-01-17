import type { MarkerState } from '@/components/files/breakpointGutter'

// Parse #lg=type_ or #lg=type  in code
// Types: entry, break, exit (or short: en, br, ex)
const LG_REGEX = /#lg=(\w+)[_ ]/g

const TYPE_MAP: Record<string, 'entry' | 'break' | 'exit'> = {
  entry: 'entry',
  en: 'entry',
  break: 'break',
  br: 'break',
  exit: 'exit',
  ex: 'exit',
}

export function parseCodeMarkers(content: string): MarkerState {
  const state: MarkerState = { entry: null, breaks: new Set(), exits: new Set() }
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let match
    LG_REGEX.lastIndex = 0
    while ((match = LG_REGEX.exec(line)) !== null) {
      const type = TYPE_MAP[match[1].toLowerCase()]
      if (!type) continue
      const lineNum = i + 1
      if (type === 'entry') state.entry = lineNum
      else if (type === 'break') state.breaks.add(lineNum)
      else if (type === 'exit') state.exits.add(lineNum)
    }
  }

  return state
}

// External metadata format for .cstore
// Line format: hash,[EN|BR|EX]
export function serializeMarkers(state: MarkerState): string[] {
  const tags: string[] = []
  if (state.entry !== null) tags.push(`${state.entry}:EN`)
  for (const line of state.breaks) tags.push(`${line}:BR`)
  for (const line of state.exits) tags.push(`${line}:EX`)
  return tags
}

export function parseMetaMarkers(meta: string[]): MarkerState {
  const state: MarkerState = { entry: null, breaks: new Set(), exits: new Set() }
  for (const tag of meta) {
    const [lineStr, type] = tag.split(':')
    const line = parseInt(lineStr, 10)
    if (isNaN(line)) continue
    if (type === 'EN') state.entry = line
    else if (type === 'BR') state.breaks.add(line)
    else if (type === 'EX') state.exits.add(line)
  }
  return state
}

// Merge code-parsed markers with external metadata (external takes precedence)
export function mergeMarkers(fromCode: MarkerState, fromMeta: MarkerState): MarkerState {
  return {
    entry: fromMeta.entry ?? fromCode.entry,
    breaks: new Set([...fromCode.breaks, ...fromMeta.breaks]),
    exits: new Set([...fromCode.exits, ...fromMeta.exits]),
  }
}
