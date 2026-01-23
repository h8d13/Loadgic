import Sidebar from './components/sidebar/ActivityBar'
import SidePanel from './components/sidebar/SidePanel'
import MenuBar from './components/MenuBar'
import LogicView from '@/components/logic/LogicView'
import type { LogicViewHandle } from '@/components/logic/LogicView'
import InspectorPanel from '@/components/inspector/InspectorPanel'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ViewMode } from './types/view'
import type { ProjectNode } from './types/project'
import type { FileContent } from './types/file'

const FileViewer = lazy(() => import('./components/files/FileViewer'))

type ContextMenuItem = { label: string; action: () => void }

//hreflang
//system color theme

const SIDEBAR_WIDTH = 54
const MIN_PANEL_WIDTH = 220
const MIN_INSPECTOR_WIDTH = 220
const COLLAPSE_THRESHOLD = 140
const MIN_CONTENT_WIDTH = 200

function App() {
  const [activeView, setActiveView] = useState<ViewMode>('files')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [panelWidth, setPanelWidth] = useState(320)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [inspectorWidth, setInspectorWidth] = useState(280)
  const [logicRevealKey, setLogicRevealKey] = useState(0)
  const [prevActiveView, setPrevActiveView] = useState(activeView)
  const [projectRoot, setProjectRoot] = useState<string | null>(null)
  const [projectTree, setProjectTree] = useState<ProjectNode | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [selectedFileContent, setSelectedFileContent] = useState<FileContent | null>(null)
  const [copied, setCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [runOutput, setRunOutput] = useState<string[]>([])
  const [, setRunSummary] = useState<{ durations: { from: number; to: number; fromMarker: string; toMarker: string; duration: number }[] } | null>(null)
  const [runResult, setRunResult] = useState<{ time: number; code: number | null } | null>(null)
  const [goToLine, setGoToLine] = useState<{ line: number; key: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null)
  const runStartRef = useRef<number>(0)
  const goToLineKeyRef = useRef(0)
  const suppressContextCloseRef = useRef(false)
  const logicViewRef = useRef<LogicViewHandle | null>(null)
  const isResizingRef = useRef(false)
  const isInspectorResizingRef = useRef(false)
  const panelWidthRef = useRef(panelWidth)
  const isPanelOpenRef = useRef(isPanelOpen)
  const lastOpenWidthRef = useRef(panelWidth)
  const inspectorWidthRef = useRef(inspectorWidth)
  const isInspectorOpenRef = useRef(isInspectorOpen)
  const lastInspectorWidthRef = useRef(inspectorWidth)

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

  const togglePanel = useCallback(() => {
    setIsPanelOpen((o) => !o)
  }, [])

  useEffect(() => {
    const handleTogglePanel = () => togglePanel()
    window.addEventListener('loadgic:toggle-panel', handleTogglePanel)
    return () => {
      window.removeEventListener('loadgic:toggle-panel', handleTogglePanel)
    }
  }, [togglePanel])

  useEffect(() => {
    panelWidthRef.current = panelWidth
  }, [panelWidth])

  useEffect(() => {
    isPanelOpenRef.current = isPanelOpen
  }, [isPanelOpen])

  useEffect(() => {
    inspectorWidthRef.current = inspectorWidth
  }, [inspectorWidth])

  useEffect(() => {
    isInspectorOpenRef.current = isInspectorOpen
  }, [isInspectorOpen])

  // Track view changes and increment reveal key when switching to logic view
  if (activeView !== prevActiveView) {
    setPrevActiveView(activeView)
    if (activeView === 'logic') {
      setLogicRevealKey((prev) => prev + 1)
    }
  }

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      // Side panel resizing
      if (isResizingRef.current) {
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

      // Inspector panel resizing
      if (isInspectorResizingRef.current) {
        const nextWidth = Math.max(0, window.innerWidth - event.clientX)

        if (nextWidth < COLLAPSE_THRESHOLD) {
          if (isInspectorOpenRef.current) {
            setIsInspectorOpen(false)
          }
          return
        }

        if (!isInspectorOpenRef.current) {
          setIsInspectorOpen(true)
        }

        const maxInspectorWidth = Math.max(
          MIN_INSPECTOR_WIDTH,
          window.innerWidth - SIDEBAR_WIDTH - MIN_CONTENT_WIDTH
        )
        const clampedWidth = Math.min(Math.max(nextWidth, MIN_INSPECTOR_WIDTH), maxInspectorWidth)
        setInspectorWidth(clampedWidth)
        lastInspectorWidthRef.current = clampedWidth
      }
    }

    function handleMouseUp() {
      if (isResizingRef.current) {
        isResizingRef.current = false
        if (!isPanelOpenRef.current) {
          setPanelWidth(lastOpenWidthRef.current)
        }
      }

      if (isInspectorResizingRef.current) {
        isInspectorResizingRef.current = false
        if (!isInspectorOpenRef.current) {
          setInspectorWidth(lastInspectorWidthRef.current)
        }
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

  function startInspectorResize(event: React.MouseEvent) {
    event.preventDefault()
    isInspectorResizingRef.current = true
  }

  async function openProject() {
    const result = await window.loadgic?.openProject?.()
    if (!result) return
    setProjectRoot(result.rootPath)
    setProjectTree(result.tree)
    setSelectedFilePath(null)
    setSelectedFileContent(null)
  }

  async function handleSelectFile(filePath: string) {
    setSelectedFilePath(filePath)
    const content = await window.loadgic?.readFile?.(filePath)
    setSelectedFileContent(content ?? null)
  }

  // Re-read file when it changes on disk
  useEffect(() => {
    const unsubscribe = window.loadgic?.onFileChanged?.((changedPath) => {
      if (changedPath === selectedFilePath) {
        window.loadgic?.readFile?.(changedPath).then((content) => {
          setSelectedFileContent(content ?? null)
        })
      }
    })
    return () => unsubscribe?.()
  }, [selectedFilePath])

  // Refresh tree when files are added/removed
  useEffect(() => {
    const unsubscribe = window.loadgic?.onTreeRefresh?.((tree) => {
      setProjectTree(tree)
    })
    return () => unsubscribe?.()
  }, [])

  function openSettings() {
    window.loadgic?.openSettingsWindow?.()
  }

  async function handleRun() {
    if (!selectedFilePath || isRunning) return
    setIsRunning(true)
    setRunOutput([])
    setRunSummary(null)
    setRunResult(null)
    runStartRef.current = performance.now()
    await window.loadgic?.lgRun(selectedFilePath)
  }

  function handleStop() {
    window.loadgic?.lgKill()
    setIsRunning(false)
  }

  // LgRunner event listeners
  useEffect(() => {
    const metrics: { marker: string; line: number; time: number; source: string }[] = []

    const unsubMetric = window.loadgic?.onLgMetric?.((m) => {
      metrics.push(m)
    })
    const unsubStdout = window.loadgic?.onLgStdout?.((data) => {
      setRunOutput((prev) => [...prev, data])
    })
    const unsubStderr = window.loadgic?.onLgStderr?.((data) => {
      setRunOutput((prev) => [...prev, `[err] ${data}`])
    })
    const unsubDone = window.loadgic?.onLgDone?.((result) => {
      setIsRunning(false)
      const elapsed = performance.now() - runStartRef.current
      setRunResult({ time: elapsed, code: result.code })

      // Sort metrics by time and build output with diffs
      metrics.sort((a, b) => a.time - b.time)
      const metricLines: string[] = []
      for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i]
        metricLines.push(`[${m.marker}] ${m.source}:${m.line} @ ${m.time.toFixed(3)}`)
        if (i < metrics.length - 1) {
          const diffMs = (metrics[i + 1].time - m.time) * 1000
          metricLines.push(`        ↓ ${diffMs.toFixed(3)}ms`)
        }
      }

      setRunOutput((prev) => [...prev, '', ...metricLines, `\n--- Exit: ${result.code} ---`])

      const summary = result.summary as { durations: { from: number; to: number; fromMarker: string; toMarker: string; duration: number }[] }
      if (summary?.durations?.length) {
        setRunSummary(summary)
      }

      metrics.length = 0 // clear for next run
    })
    return () => {
      unsubMetric?.()
      unsubStdout?.()
      unsubStderr?.()
      unsubDone?.()
    }
  }, [])

  function splitPath(filePath: string) {
    // Replace /home/username/ with ~/
    const homeMatch = filePath.match(/^\/home\/[^/]+\//)
    const displayPath = homeMatch ? filePath.replace(homeMatch[0], '~/') : filePath
    const parts = displayPath.split(/[/\\]/)
    const name = parts.pop() ?? displayPath
    const dir = parts.join('/')
    return { dir, name }
  }

  // Find file path by name in project tree
  function findFileByName(node: ProjectNode | null, filename: string): string | null {
    if (!node) return null
    if (node.type === 'file' && node.name === filename) return node.path
    if (node.children) {
      for (const child of node.children) {
        const found = findFileByName(child, filename)
        if (found) return found
      }
    }
    return null
  }

  // Handle clicking on a location in the output
  async function handleLocationClick(location: string) {
    // Parse "filename:line" format
    const match = location.trim().match(/^(.+):(\d+)$/)
    if (!match) return

    const [, filename, lineStr] = match
    const line = parseInt(lineStr, 10)

    // Find file in project tree
    const filePath = findFileByName(projectTree, filename)
    if (!filePath) return

    // Navigate to file and line
    if (filePath !== selectedFilePath) {
      setSelectedFilePath(filePath)
      const content = await window.loadgic?.readFile?.(filePath)
      setSelectedFileContent(content ?? null)
    }
    goToLineKeyRef.current += 1
    setGoToLine({ line, key: goToLineKeyRef.current })
  }

  async function copyPathToClipboard(filePath: string) {
    if (!filePath) return
    await navigator.clipboard.writeText(filePath)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Close context menu on click/escape
  useEffect(() => {
    if (!contextMenu) return
    function handleClose() {
      if (suppressContextCloseRef.current) return
      setContextMenu(null)
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', handleClose)
    window.addEventListener('contextmenu', handleClose)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('contextmenu', handleClose)
      window.removeEventListener('keydown', handleKey)
    }
  }, [contextMenu])

  // Global context menu handler (right-click)
  useEffect(() => {
    function handleGlobalContextMenu(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!target) return

      const openContextMenu = (items: ContextMenuItem[]) => {
        suppressContextCloseRef.current = true
        setContextMenu({ x: event.clientX, y: event.clientY, items })
        window.setTimeout(() => {
          suppressContextCloseRef.current = false
        }, 0)
      }

      // Check if right-clicked on a file in the tree view
      const treeFile = target.closest('[data-file-path]') as HTMLElement | null
      if (treeFile) {
        const filePath = treeFile.dataset.filePath
        if (filePath) {
          event.preventDefault()
          openContextMenu([
            {
              label: 'Reveal in file view',
              action: () => {
                setActiveView('files')
                handleSelectFile(filePath)
              },
            },
            {
              label: 'Reveal in logic view',
              action: () => {
                setActiveView('logic')
                handleSelectFile(filePath)
              },
            },
            { label: 'Copy path', action: () => copyPathToClipboard(filePath) },
          ])
          return
        }
      }

      // Check if right-clicked on a file node in the logic view
      const logicHandle = logicViewRef.current
      if (logicHandle && logicHandle.isCanvasTarget(target)) {
        const filePath = logicHandle.hitTestFile(event.clientX, event.clientY)
        if (filePath) {
          event.preventDefault()
          openContextMenu([
            {
              label: 'Read in file view',
              action: () => {
                setActiveView('files')
                handleSelectFile(filePath)
              },
            },
          ])
          return
        }
      }

      // Check if right-clicked inside code editor
      if (target.closest('.cm-editor') && selectedFilePath) {
        event.preventDefault()
        openContextMenu([
          { label: 'Copy path', action: () => copyPathToClipboard(selectedFilePath) },
          { label: 'Reveal in logic view', action: () => setActiveView('logic') },
        ])
      }
    }

    window.addEventListener('contextmenu', handleGlobalContextMenu, true)
    return () => {
      window.removeEventListener('contextmenu', handleGlobalContextMenu, true)
    }
  }, [selectedFilePath])

  return (
    <div className="app">
      <div className="titlebar">
        <div className="titlebar-left">
          <div className="title">Loadgic</div>
          <MenuBar />
        </div>

        <div className="titlebar-right">
          {selectedFilePath && (
            <button
              className={`run-btn ${isRunning ? 'running' : ''}`}
              onClick={isRunning ? handleStop : handleRun}
              title={isRunning ? 'Stop (Ctrl+Shift+C)' : 'Run (Ctrl+Enter)'}
            >
              {isRunning ? '■' : '▶'}
            </button>
          )}
          <div className="window-controls">
            <button onClick={() => window.loadgic?.minimize()}>—</button>
            <button onClick={() => window.loadgic?.toggleFullscreen()}>▢</button>
            <button className="close" onClick={() => window.loadgic?.close()}>✕</button>
          </div>
        </div>
      </div>

      <div
        className="main"
        style={{
          '--panel-width': isPanelOpen ? `${panelWidth}px` : '0px',
          '--inspector-width': isInspectorOpen ? `${inspectorWidth}px` : '0px',
        } as React.CSSProperties}
      >
        <Sidebar activeView={activeView} onChangeView={selectView} onOpenSettings={openSettings} />
        <SidePanel
          activeView={activeView}
          isOpen={isPanelOpen}
          projectRoot={projectRoot}
          projectTree={projectTree}
          onOpenProject={openProject}
          onSelectFile={handleSelectFile}
          selectedFilePath={selectedFilePath}
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

        <div className="content-area">
          <div className={`content${activeView === 'logic' ? ' logic-view' : ''}`}>
            {activeView === 'logic' ? (
              <LogicView
                projectTree={projectTree}
                selectedFilePath={selectedFilePath}
                onSelectFilePath={handleSelectFile}
                revealKey={logicRevealKey}
                ref={logicViewRef}
              />
            ) : activeView === 'files' && selectedFilePath ? (
              <div className="file-viewer">
                <div
                  className="file-viewer-header"
                  onClick={() => copyPathToClipboard(selectedFilePath)}
                  title="Copy full path"
                >
                  <span className={`file-viewer-copy${copied ? ' copied' : ''}`}>
                    <span className={`file-viewer-copy-icon${copied ? ' check' : ''}`}>{copied ? '✓' : '⧉'}</span>
                  </span>
                  <span className="file-viewer-path">
                    {splitPath(selectedFilePath).dir}
                    {splitPath(selectedFilePath).dir ? '/' : ''}
                  </span>
                  <span className="file-viewer-name">
                    {splitPath(selectedFilePath).name}
                  </span>
                </div>
                {selectedFileContent?.kind === 'text' ? (
                  <Suspense fallback={<div className="file-viewer-loading">Loading editor...</div>}>
                    <FileViewer
                      content={selectedFileContent.content}
                      filePath={selectedFilePath}
                      goToLine={goToLine}
                    />
                  </Suspense>
                ) : selectedFileContent?.kind === 'image' ? (
                  <div className="image-viewer">
                    <img
                      src={`data:${selectedFileContent.mime};base64,${selectedFileContent.data}`}
                      alt={splitPath(selectedFilePath).name}
                    />
                  </div>
                ) : (
                  <pre className="file-viewer-body">
                    {selectedFileContent?.kind === 'unsupported'
                      ? selectedFileContent.reason
                      : 'Unable to load file.'}
                  </pre>
                )}
              </div>
            ) : (
              <img
                className="content-watermark"
                src="/logo-mark.svg"
                alt=""
                loading="eager"
                decoding="async"
              />
            )}
          </div>
          {(isRunning || runOutput.length > 0) && (
            <div className="run-output">
              <div className="run-output-header">
                <span>Output</span>
                {isRunning && <span className="run-progress-bar" />}
                {runResult && (
                  <span className={`run-result ${runResult.code === 0 ? 'success' : 'error'}`}>
                    {runResult.time >= 1000
                      ? `${(runResult.time / 1000).toFixed(2)}s`
                      : `${runResult.time.toFixed(0)}ms`}
                  </span>
                )}
                <button className="run-output-clear" onClick={() => { setRunOutput([]); setRunSummary(null); setRunResult(null) }}>✕</button>
              </div>
              <div className="run-output-body">
                {runOutput.map((line, i) => {
                  // Match metric lines: [EN] source:line @ timestamp
                  const metricMatch = line.match(/^\[(\w+)\] ([^@]+) @ (.+)$/)
                  if (metricMatch) {
                    const [, marker, location, time] = metricMatch
                    return (
                      <div key={i} className="run-line run-metric">
                        <span className={`run-marker run-marker-${marker.toLowerCase()}`}>[{marker}]</span>
                        <span
                          className="run-location"
                          onClick={() => handleLocationClick(location)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleLocationClick(location)}
                        >
                          {location}
                        </span>
                        <span className="run-at">@</span>
                        <span className="run-time">{time}</span>
                      </div>
                    )
                  }
                  // Match duration lines: ↓ 0.123ms
                  const durationMatch = line.match(/^(\s+)(↓)\s*(.+)$/)
                  if (durationMatch) {
                    const [, indent, arrow, duration] = durationMatch
                    return (
                      <div key={i} className="run-line run-duration-line">
                        <span className="run-indent">{indent}</span>
                        <span className="run-arrow">{arrow}</span>
                        <span className="run-duration-value">{duration}</span>
                      </div>
                    )
                  }
                  // Error lines
                  if (line.startsWith('[err]')) {
                    return <div key={i} className="run-line run-error">{line}</div>
                  }
                  // Regular output
                  return <div key={i} className="run-line">{line}</div>
                })}
              </div>
            </div>
          )}
        </div>
        {!isInspectorOpen ? (
          <button
            className="inspector-open-btn"
            onClick={() => setIsInspectorOpen(true)}
            aria-label="Show inspector"
            title="Show inspector"
            type="button"
          >
            <svg className="inspector-open-icon" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="9" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13 13l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
        <aside className={`inspector${isInspectorOpen ? '' : ' closed'}`}>
          <div className="inspector-header">
            <span>INSPECTOR</span>
            <button
              className="inspector-toggle"
              onClick={() => setIsInspectorOpen(false)}
              aria-label="Hide inspector"
              title="Hide inspector"
              type="button"
            >
              <span className="inspector-toggle-icon">&gt;</span>
              <span className="inspector-toggle-text">Hide</span>
            </button>
          </div>
          <InspectorPanel filePath={selectedFilePath} fileContent={selectedFileContent} />
        </aside>
        {isInspectorOpen ? (
          <div
            className="inspector-resizer"
            onMouseDown={startInspectorResize}
            aria-label="Resize inspector"
            role="separator"
          />
        ) : null}
        {contextMenu && (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
            role="menu"
          >
            {contextMenu.items.map((item) => (
              <button
                key={item.label}
                className="context-menu-item"
                onClick={() => {
                  item.action()
                  setContextMenu(null)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
