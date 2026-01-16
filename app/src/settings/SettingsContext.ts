import { createContext } from 'react'
import type { EditorTheme } from './constants'

type Theme = 'dark' | 'light'

export type SettingsContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  editorTheme: EditorTheme
  setEditorTheme: (theme: EditorTheme) => void
  showHidden: boolean
  setShowHidden: (show: boolean) => void
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)
