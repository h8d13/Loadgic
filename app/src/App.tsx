import Sidebar from './components/sidebar/ActivityBar'
import SidePanel from './components/sidebar/SidePanel'
import { useState } from 'react'
import type { ViewMode } from './types/view'

function App() {
  const [activeView, setActiveView] = useState<ViewMode>('logic')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [panelWidth, setPanelWidth] = useState(320)

  function selectView(next: ViewMode) {
    setActiveView((prev) => {
      if (prev === next) {
        setIsPanelOpen((o) => !o)
        return prev
      }
      setIsPanelOpen(true)
      return next
    })
  }

  return (
    <div className="app">
      <div className="titlebar">
        <div className="title">Loadgic</div>

        <div className="window-controls">
          <button onClick={() => window.loadgic?.minimize()}>—</button>
          <button onClick={() => window.loadgic?.toggleFullscreen()}>▢</button>
          <button className="close" onClick={() => window.loadgic?.close()}>✕</button>
        </div>
      </div>

      <div
        className="main"
        style={{ ['--panel-width' as any]: isPanelOpen ? `${panelWidth}px` : '0px' }}
      >
        <Sidebar activeView={activeView} onChangeView={selectView} />
        <SidePanel activeView={activeView} isOpen={isPanelOpen} />

        <div className="content">
          {activeView === 'logic' && <div>Logic View</div>}
          {activeView === 'files' && <div>Files View</div>}
          {activeView === 'run' && <div>Run View</div>}
          {activeView === 'settings' && <div>Settings View</div>}
        </div>
      </div>
    </div>
  )
}

export default App
