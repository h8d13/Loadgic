import { useRef } from 'react'
import Sidebar from './components/sidebar/Sidebar'
import { useState } from 'react'
import type { ViewMode } from './types/view'

function App() {
  const titlebarRef = useRef<HTMLDivElement>(null)
  const windowPosRef = useRef({ x: 0, y: 0 })
  const mouseStartRef = useRef({ x: 0, y: 0 })
  const [activeView, setActiveView] = useState<ViewMode>('logic')

  // Handle window dragging
  const handleTitlebarMouseDown = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) {
      return
    }

    // Get init pos of the window
    const pos = await window.loadgic.getWindowPos()
    windowPosRef.current = pos
    mouseStartRef.current = { x: e.clientX, y: e.clientY }
    
    let currentX = pos.x
    let currentY = pos.y
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - mouseStartRef.current.x
      const deltaY = moveEvent.clientY - mouseStartRef.current.y
      
      currentX = windowPosRef.current.x + deltaX
      currentY = windowPosRef.current.y + deltaY
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      // Apply window position at the end of the drag
      window.loadgic.moveAbsolute(Math.round(currentX), Math.round(currentY))
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="app">
      <div 
        ref={titlebarRef}
        className="titlebar"
        onMouseDown={handleTitlebarMouseDown}
      >
        <div className="title">Loadgic</div>

        <div className="window-controls window-no-drag">
          <button onClick={() => window.loadgic.minimize()}>—</button>
          <button onClick={() => window.loadgic.toggleMaximize()}>▢</button>
          <button className="close" onClick={() => window.loadgic.close()}>✕</button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="main">
        <Sidebar activeView={activeView} onChangeView={setActiveView}/>
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
