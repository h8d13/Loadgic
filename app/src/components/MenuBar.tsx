import { useState, useRef, useEffect } from 'react'

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

const menus: Menu[] = [
  {
    label: 'File',
    items: [
      { label: 'New File', shortcut: 'Ctrl+N' },
      { label: 'Open File...', shortcut: 'Ctrl+O' },
      { label: 'Open Folder...', shortcut: 'Ctrl+Shift+O' },
      { separator: true, label: '' },
      { label: 'Save', shortcut: 'Ctrl+S' },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
      { separator: true, label: '' },
      { label: 'Exit', shortcut: 'Alt+F4' },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z' },
      { separator: true, label: '' },
      { label: 'Cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', shortcut: 'Ctrl+V' },
      { separator: true, label: '' },
      { label: 'Find', shortcut: 'Ctrl+F' },
      { label: 'Replace', shortcut: 'Ctrl+H' },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Toggle Sidebar', shortcut: 'Ctrl+B' },
      { label: 'Toggle Panel', shortcut: 'Ctrl+J' },
      { separator: true, label: '' },
      { label: 'Zoom In', shortcut: 'Ctrl+=' },
      { label: 'Zoom Out', shortcut: 'Ctrl+-' },
      { label: 'Reset Zoom', shortcut: 'Ctrl+0' },
      { separator: true, label: '' },
      { label: 'Full Screen', shortcut: 'F11' },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Documentation' },
      { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+K Ctrl+S' },
      { separator: true, label: '' },
      { label: 'About Loadgic' },
    ],
  },
]

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
