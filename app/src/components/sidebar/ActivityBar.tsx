import type { ViewMode } from '@/types/view'
import { LogicIcon, FilesIcon, RunIcon, SettingsIcon } from '@/components/icons'

interface SidebarProps {
  activeView: ViewMode
  onChangeView: (view: ViewMode) => void
  onOpenSettings: () => void
}

function Sidebar({ activeView, onChangeView, onOpenSettings }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <button
          className={`menu-btn ${activeView === 'files' ? 'active' : ''}`}
          onClick={() => onChangeView('files')}
          aria-label="Files"
        >
          <FilesIcon size={20} />
        </button>

        <button
          className={`menu-btn ${activeView === 'logic' ? 'active' : ''}`}
          onClick={() => onChangeView('logic')}
          aria-label="Logic"
        >
          <LogicIcon size={20} />
        </button>

        <button
          className={`menu-btn ${activeView === 'run' ? 'active' : ''}`}
          onClick={() => onChangeView('run')}
          aria-label="Run"
        >
          <RunIcon size={20} />
        </button>
      </div>

      <div className="sidebar-bottom">
        <button className="menu-btn" onClick={onOpenSettings} aria-label="Settings">
          <SettingsIcon size={20} />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
