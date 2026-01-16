import { useState, useRef, useEffect, useCallback } from 'react'

interface MenuItem {
  label: string
  shortcut?: string
  action?: () => void
  separator?: boolean
  disabled?: boolean
}

interface Menu {
  label: string
  items: MenuItem[]
}

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)

  const handleTogglePanel = useCallback(() => {
    window.dispatchEvent(new CustomEvent('loadgic:toggle-panel'))
  }, [])

  const handleZoomIn = useCallback(async () => {
    await window.loadgic?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(async () => {
    await window.loadgic?.zoomOut()
  }, [])

  const handleZoomReset = useCallback(async () => {
    await window.loadgic?.zoomReset()
  }, [])

  const handleFullscreen = useCallback(() => {
    window.loadgic?.toggleFullscreen()
  }, [])

  const handleReload = useCallback(() => {
    window.loadgic?.reload()
  }, [])

  const handleHardReload = useCallback(() => {
    window.loadgic?.hardReload()
  }, [])

  const handleOpenDevTools = useCallback(() => {
    window.loadgic?.openDevTools()
  }, [])

  const menus: Menu[] = [
    {
      label: 'View',
      items: [
        { label: 'Toggle Panel', shortcut: 'Ctrl+J', action: handleTogglePanel },
        { separator: true, label: '' },
        { label: 'Zoom In', shortcut: 'Ctrl+=', action: handleZoomIn },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: handleZoomOut },
        { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: handleZoomReset },
        { separator: true, label: '' },
        { label: 'Full Screen', shortcut: 'F11', action: handleFullscreen },
      ],
    },
    {
      label: 'Debug',
      items: [
        { label: 'Reload', shortcut: 'Ctrl+R', action: handleReload },
        { label: 'Hard Reload', shortcut: 'Ctrl+Shift+R', action: handleHardReload },
        { separator: true, label: '' },
        { label: 'Dev Tools', shortcut: 'Ctrl+Shift+I', action: handleOpenDevTools },
      ],
    },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'j') {
        e.preventDefault()
        handleTogglePanel()
      } else if (ctrl && e.key === '=') {
        e.preventDefault()
        handleZoomIn()
      } else if (ctrl && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      } else if (ctrl && e.key === '0') {
        e.preventDefault()
        handleZoomReset()
      } else if (e.key === 'F11') {
        e.preventDefault()
        handleFullscreen()
      } else if (ctrl && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        handleHardReload()
      } else if (ctrl && !e.shiftKey && e.key === 'r') {
        e.preventDefault()
        handleReload()
      } else if (ctrl && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        handleOpenDevTools()
      } else if (e.key === 'Escape') {
        setOpenMenu(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTogglePanel, handleZoomIn, handleZoomOut, handleZoomReset, handleFullscreen, handleReload, handleHardReload, handleOpenDevTools])

  function handleMenuClick(label: string) {
    setOpenMenu(openMenu === label ? null : label)
  }

  function handleMenuHover(label: string) {
    if (openMenu !== null) {
      setOpenMenu(label)
    }
  }

  function handleItemClick(item: MenuItem) {
    if (!item.disabled && !item.separator && item.action) {
      item.action()
    }
    setOpenMenu(null)
  }

  return (
    <div className="menubar" ref={menuBarRef}>
      {menus.map((menu) => (
        <div key={menu.label} className="menu-wrapper">
          <button
            className={`menu-trigger ${openMenu === menu.label ? 'active' : ''}`}
            onClick={() => handleMenuClick(menu.label)}
            onMouseEnter={() => handleMenuHover(menu.label)}
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <div className="menu-dropdown">
              {menu.items.map((item, index) =>
                item.separator ? (
                  <div key={index} className="menu-separator" />
                ) : (
                  <button
                    key={index}
                    className={`menu-item ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                  >
                    <span className="menu-item-label">{item.label}</span>
                    {item.shortcut && (
                      <span className="menu-item-shortcut">{item.shortcut}</span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
