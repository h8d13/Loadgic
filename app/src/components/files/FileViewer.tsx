import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import { solarizedDark, solarizedLight } from '@uiw/codemirror-theme-solarized'
import { nordInit } from '@uiw/codemirror-theme-nord'
import { StreamLanguage } from '@codemirror/language'
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Extension } from '@codemirror/state'
import { useTheme } from '@/theme/useTheme'
import { createMarkerExtensions, cycleMarker, type MarkerState } from './breakpointGutter'

type Props = {
  content: string
  filePath: string
  onMarkersChange?: (state: MarkerState) => void
}

const nord = nordInit({})

const initialMarkerState: MarkerState = {
  entry: null,
  breaks: new Set(),
  exits: new Set(),
}

// Persist markers per file path
const markerCache = new Map<string, MarkerState>()

function getEditorTheme(editorTheme: string, isDark: boolean): Extension {
  switch (editorTheme) {
    case 'dracula':
      return dracula
    case 'github':
      return isDark ? githubDark : githubLight
    case 'solarized':
      return isDark ? solarizedDark : solarizedLight
    case 'nord':
      return nord
    case 'oneDark':
    default:
      return oneDark
  }
}

function getExtension(filePath: string) {
  const match = filePath.toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

async function loadLanguageExtension(ext: string): Promise<Extension | null> {
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx': {
      const { javascript } = await import('@codemirror/lang-javascript')
      return javascript({ typescript: ext.includes('ts') })
    }
    case 'html':
    case 'htm': {
      const { html } = await import('@codemirror/lang-html')
      return html()
    }
    case 'css':
    case 'scss':
    case 'less': {
      const { css } = await import('@codemirror/lang-css')
      return css()
    }
    case 'json': {
      const { json } = await import('@codemirror/lang-json')
      return json()
    }
    case 'md':
    case 'markdown': {
      const { markdown } = await import('@codemirror/lang-markdown')
      return markdown()
    }
    case 'xml':
    case 'svg': {
      const { xml } = await import('@codemirror/lang-xml')
      return xml()
    }
    case 'yaml':
    case 'yml': {
      const { yaml } = await import('@codemirror/lang-yaml')
      return yaml()
    }
    case 'py': {
      const { python } = await import('@codemirror/lang-python')
      return python()
    }
    case 'java': {
      const { java } = await import('@codemirror/lang-java')
      return java()
    }
    case 'rs': {
      const { rust } = await import('@codemirror/lang-rust')
      return rust()
    }
    case 'php': {
      const { php } = await import('@codemirror/lang-php')
      return php()
    }
    case 'sql': {
      const { sql } = await import('@codemirror/lang-sql')
      return sql()
    }
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'fish':
    default: {
      const { shell } = await import('@codemirror/legacy-modes/mode/shell')
      return StreamLanguage.define(shell)
    }
  }
}

export default function FileViewer({ content, filePath, onMarkersChange }: Props) {
  const { theme, editorTheme } = useTheme()
  const [langExtension, setLangExtension] = useState<Extension | null>(null)
  const [loading, setLoading] = useState(true)
  const [markers, setMarkers] = useState<MarkerState>(
    () => markerCache.get(filePath) ?? initialMarkerState
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const ext = getExtension(filePath)
    loadLanguageExtension(ext).then((lang) => {
      if (cancelled) return
      setLangExtension(lang)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [filePath])

  // Load cached markers when file changes
  useEffect(() => {
    setMarkers(markerCache.get(filePath) ?? initialMarkerState)
  }, [filePath])

  // Save markers to cache when they change
  useEffect(() => {
    markerCache.set(filePath, markers)
  }, [filePath, markers])

  // Notify parent of changes
  useEffect(() => {
    onMarkersChange?.(markers)
  }, [markers, onMarkersChange])

  const handleCycle = useCallback((line: number) => {
    setMarkers((s) => cycleMarker(s, line))
  }, [])

  const markerExtensions = useMemo(
    () => createMarkerExtensions(markers, handleCycle),
    [markers, handleCycle]
  )

  const extensions = useMemo(() => {
    const exts: Extension[] = [markerExtensions]
    if (langExtension) exts.push(langExtension)
    return exts
  }, [langExtension, markerExtensions])

  if (loading) {
    return <div className="file-viewer-loading">Loading...</div>
  }

  return (
    <CodeMirror
      value={content}
      theme={getEditorTheme(editorTheme, theme === 'dark')}
      extensions={extensions}
      readOnly
      editable={false}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
      }}
    />
  )
}
