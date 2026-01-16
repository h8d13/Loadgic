import { useSettings } from '@/settings/useSettings'
import { EDITOR_THEMES } from '@/settings/constants'

function ThemeToggle() {
  const { theme, toggleTheme } = useSettings()
  return (
    <button className="settings-toggle" onClick={toggleTheme} type="button">
      {theme === 'dark' ? 'On' : 'Off'}
    </button>
  )
}

function EditorThemeSelect() {
  const { editorTheme, setEditorTheme } = useSettings()
  return (
    <select
      value={editorTheme}
      onChange={(e) => setEditorTheme(e.target.value as typeof editorTheme)}
    >
      {EDITOR_THEMES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  )
}

function ShowHiddenToggle() {
  const { showHidden, setShowHidden } = useSettings()
  return (
    <button
      className="settings-toggle"
      onClick={() => setShowHidden(!showHidden)}
      type="button"
    >
      {showHidden ? 'On' : 'Off'}
    </button>
  )
}

function AutoWrapToggle() {
  const { autoWrap, setAutoWrap } = useSettings()
  return (
    <button
      className="settings-toggle"
      onClick={() => setAutoWrap(!autoWrap)}
      type="button"
    >
      {autoWrap ? 'On' : 'Off'}
    </button>
  )
}

export default function SettingsPage() {
  return (
    <div className="settings-shell">
      <div className="settings-titlebar">
        <div className="settings-title">Settings</div>
        <div className="settings-window-controls">
          <button onClick={() => window.loadgic?.minimizeSettings?.()}>—</button>
          <button className="close" onClick={() => window.loadgic?.closeSettings?.()}>
            ✕
          </button>
        </div>
      </div>

      <div className="settings-page">
        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <label className="settings-row">
            <span>Dark mode</span>
            <ThemeToggle />
          </label>
          <label className="settings-row">
            <span>Syntax highlighting</span>
            <EditorThemeSelect />
          </label>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Editor</div>
          <label className="settings-row">
            <span>Auto wrap</span>
            <AutoWrapToggle />
          </label>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Files</div>
          <label className="settings-row">
            <span>Show hidden files</span>
            <ShowHiddenToggle />
          </label>
        </div>
      </div>
    </div>
  )
}
