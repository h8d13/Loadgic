import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { StreamLanguage } from '@codemirror/language'
import { useState, useEffect } from 'react'
import type { Extension } from '@codemirror/state'

type Props = {
  content: string
  filePath: string
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
    case 'fish': {
      const { shell } = await import('@codemirror/legacy-modes/mode/shell')
      return StreamLanguage.define(shell)
    }
    default:
      return null
  }
}

export default function FileViewer({ content, filePath }: Props) {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const ext = getExtension(filePath)
    loadLanguageExtension(ext).then((lang) => {
      if (cancelled) return
      setExtensions(lang ? [lang] : [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [filePath])

  if (loading) {
    return <div className="file-viewer-loading">Loading...</div>
  }

  return (
    <CodeMirror
      value={content}
      theme={oneDark}
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
