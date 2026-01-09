import Sidebar from './components/sidebar/Sidebar'
import { useState } from 'react'
import type { ViewMode } from './types/view'

function App() {
  const [activeView, setActiveView] = useState<ViewMode>('logic')

  return (
    <div className="app">
      <div className="titlebar">
        <div className="title">Loadgic</div>

        <div className="window-controls">
          <button onClick={() => window.loadgic.minimize()}>—</button>
          <button onClick={() => window.loadgic.toggleFullscreen()}>▢</button>
          <button className="close" onClick={() => window.loadgic.close()}>✕</button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="main">
        <Sidebar activeView={activeView} onChangeView={setActiveView} />
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
