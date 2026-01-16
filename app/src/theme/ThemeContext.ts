import { createContext } from 'react'
import type { EditorTheme } from './constants'

type Theme = 'dark' | 'light'

export type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  editorTheme: EditorTheme
  setEditorTheme: (theme: EditorTheme) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
