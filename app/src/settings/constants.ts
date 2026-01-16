export type EditorTheme = 'oneDark' | 'dracula' | 'github' | 'solarized' | 'nord'

export const EDITOR_THEMES: { value: EditorTheme; label: string }[] = [
  { value: 'oneDark', label: 'One Dark' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'github', label: 'GitHub' },
  { value: 'solarized', label: 'Solarized' },
  { value: 'nord', label: 'Nord' },
]
