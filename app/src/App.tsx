import Sidebar from './components/sidebar/ActivityBar'
import SidePanel from './components/sidebar/SidePanel'
import MenuBar from './components/MenuBar'
import { useEffect, useRef, useState } from 'react'
import type { ViewMode } from './types/view'

const SIDEBAR_WIDTH = 54
const MIN_PANEL_WIDTH = 220
const COLLAPSE_THRESHOLD = 140
const MIN_CONTENT_WIDTH = 200

function App() {
  const [activeView, setActiveView] = useState<ViewMode>('logic')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [panelWidth, setPanelWidth] = useState(320)
  const isResizingRef = useRef(false)
  const panelWidthRef = useRef(panelWidth)
  const isPanelOpenRef = useRef(isPanelOpen)
  const lastOpenWidthRef = useRef(panelWidth)

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

  useEffect(() => {
    panelWidthRef.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    isPanelOpenRef.current = isPanelOpen
  }, [isPanelOpen])

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!isResizingRef.current) return
      const nextWidth = Math.max(0, event.clientX - SIDEBAR_WIDTH)

      if (nextWidth < COLLAPSE_THRESHOLD) {
        if (isPanelOpenRef.current) {
          setIsPanelOpen(false)
        }
        return
      }

      if (!isPanelOpenRef.current) {
        setIsPanelOpen(true)
      }

      const maxPanelWidth = Math.max(
        MIN_PANEL_WIDTH,
        window.innerWidth - SIDEBAR_WIDTH - MIN_CONTENT_WIDTH
      )
      const clampedWidth = Math.min(Math.max(nextWidth, MIN_PANEL_WIDTH), maxPanelWidth)
      setPanelWidth(clampedWidth)
      lastOpenWidthRef.current = clampedWidth
    }

    function handleMouseUp() {
      if (!isResizingRef.current) return
      isResizingRef.current = false

      if (!isPanelOpenRef.current) {
        setPanelWidth(lastOpenWidthRef.current)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    function handleResize() {
      const maxPanelWidth = Math.max(
        MIN_PANEL_WIDTH,
        window.innerWidth - SIDEBAR_WIDTH - MIN_CONTENT_WIDTH
      )
      const nextWidth = Math.min(panelWidthRef.current, maxPanelWidth)
      if (nextWidth !== panelWidthRef.current) {
        setPanelWidth(nextWidth)
        lastOpenWidthRef.current = nextWidth
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function startResize(event: React.MouseEvent) {
    event.preventDefault()
    isResizingRef.current = true
  }

  return (
    <div className="app">
      <div className="titlebar">
        <div className="titlebar-left">
          <div className="title">Loadgic</div>
          <MenuBar />
        </div>

        <div className="window-controls">
          <button onClick={() => window.loadgic?.minimize()}>—</button>
          <button onClick={() => window.loadgic?.toggleFullscreen()}>▢</button>
          <button className="close" onClick={() => window.loadgic?.close()}>✕</button>
        </div>
      </div>

      <div
        className="main"
        style={{ '--panel-width': isPanelOpen ? `${panelWidth}px` : '0px' } as React.CSSProperties}
      >
        <Sidebar activeView={activeView} onChangeView={selectView} />
        <SidePanel
          activeView={activeView}
          isOpen={isPanelOpen}
        />
        <div
          className="sidepanel-resizer"
          onMouseDown={startResize}
          aria-label="Resize panel"
          role="separator"
        />
        <button
          className="sidepanel-handle"
          onClick={() => setIsPanelOpen((open) => !open)}
          aria-label={isPanelOpen ? 'Hide panel' : 'Show panel'}
          title={isPanelOpen ? 'Hide panel' : 'Show panel'}
        >
          {isPanelOpen ? '◀' : '▶'}
        </button>

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
