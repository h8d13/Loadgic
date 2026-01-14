import { useState } from 'react'
import type { ViewMode } from '../../types/view'
import type { ProjectNode } from '../../types/project'

type Props = {
  activeView: ViewMode
  isOpen: boolean
  onToggle: () => void
  projectRoot?: string | null
  projectTree?: ProjectNode | null
  onOpenProject?: () => void
}

type TreeProps = {
  node: ProjectNode
  level?: number
}

function TreeNode({ node, level = 0 }: TreeProps) {
  const [isOpen, setIsOpen] = useState(level === 0)
  const isDir = node.type === 'dir'
  const hasChildren = !!node.children?.length

  function toggle() {
    if (!isDir || !hasChildren) return
    setIsOpen((open) => !open)
  }

  return (
    <div className="file-tree-node" style={{ paddingLeft: `${level * 8}px` }}>
      <div
        className={`file-tree-label ${node.type}`}
        role={isDir ? 'button' : undefined}
        onClick={toggle}
        onKeyDown={(event) => {
          if (!isDir || !hasChildren) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
        tabIndex={isDir ? 0 : -1}
        aria-expanded={isDir ? isOpen : undefined}
      >
        {isDir ? (isOpen ? '▾' : '▸') : '•'} {node.name}
      </div>
      {isDir && isOpen && hasChildren
        ? node.children?.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} />
          ))
        : null}
    </div>
  )
}

export default function SidePanel({
  activeView,
  isOpen,
  onToggle,
  projectRoot,
  projectTree,
  onOpenProject,
}: Props) {
  return (
    <aside className={`sidepanel ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidepanel-header">
        <div className="sidepanel-title">{activeView.toUpperCase()}</div>
        <button
          className="sidepanel-toggle"
          onClick={onToggle}
          aria-label={isOpen ? 'Hide panel' : 'Show panel'}
          title={isOpen ? 'Hide panel' : 'Show panel'}
        >
          <span className="sidepanel-toggle-icon">{isOpen ? '<' : '>'}</span>
          <span className="sidepanel-toggle-text">{isOpen ? 'Hide' : 'Show'}</span>
        </button>
      </div>

      <div className="sidepanel-body">
        {activeView === 'logic' && <div>Logic options</div>}
        {activeView === 'files' && (
          <div className="files-panel">
            <button className="files-open-btn" onClick={onOpenProject}>
              Open project folder
            </button>
            {projectRoot ? (
              <div className="files-root">Folder: {projectRoot}</div>
            ) : (
              <div className="files-empty">No project loaded yet.</div>
            )}
            {projectTree ? (
              <div className="file-tree">
                <TreeNode node={projectTree} />
              </div>
            ) : null}
            <div className="files-footer-space" />
          </div>
        )}
        {activeView === 'run' && <div>Run options</div>}
        {activeView === 'settings' && <div>Settings options</div>}
      </div>
    </aside>
  )
}
