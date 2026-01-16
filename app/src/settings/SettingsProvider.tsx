import { useEffect, useMemo, useState } from 'react'
import { EDITOR_THEMES, type EditorTheme } from './constants'
import { SettingsContext } from './SettingsContext'

type Theme = 'dark' | 'light'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem('loadgic:theme')
  if (stored === 'dark' || stored === 'light') return stored
  return 'dark'
}

function getInitialEditorTheme(): EditorTheme {
  if (typeof window === 'undefined') return 'oneDark'
  const stored = window.localStorage.getItem('loadgic:editorTheme')
  if (stored && EDITOR_THEMES.some((t) => t.value === stored)) return stored as EditorTheme
  return 'oneDark'
}

function getInitialShowHidden(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('loadgic:showHidden') === 'true'
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [editorTheme, setEditorTheme] = useState<EditorTheme>(getInitialEditorTheme)
  const [showHidden, setShowHidden] = useState(getInitialShowHidden)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('loadgic:theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem('loadgic:editorTheme', editorTheme)
  }, [editorTheme])

  useEffect(() => {
    window.localStorage.setItem('loadgic:showHidden', String(showHidden))
  }, [showHidden])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === 'loadgic:theme') {
        if (event.newValue === 'dark' || event.newValue === 'light') {
          setTheme(event.newValue)
        }
      }
      if (event.key === 'loadgic:editorTheme') {
        if (event.newValue && EDITOR_THEMES.some((t) => t.value === event.newValue)) {
          setEditorTheme(event.newValue as EditorTheme)
        }
      }
      if (event.key === 'loadgic:showHidden') {
        setShowHidden(event.newValue === 'true')
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      editorTheme,
      setEditorTheme,
      showHidden,
      setShowHidden,
    }),
    [theme, editorTheme, showHidden]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
