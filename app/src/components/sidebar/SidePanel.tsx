import { useState } from 'react'
import type { ViewMode } from '../../types/view'
import type { ProjectNode } from '../../types/project'

type Props = {
  activeView: ViewMode
  isOpen: boolean
  projectRoot?: string | null
  projectTree?: ProjectNode | null
  onOpenProject?: () => void
  onSelectFile?: (filePath: string) => void
  selectedFilePath?: string | null
}

type TreeProps = {
  node: ProjectNode
  level?: number
  onSelectFile?: (filePath: string) => void
  selectedFilePath?: string | null
}

function TreeNode({ node, level = 0, onSelectFile, selectedFilePath }: TreeProps) {
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
        className={`file-tree-label ${node.type} ${
          node.path === selectedFilePath ? 'selected' : ''
        }`}
        role={isDir ? 'button' : undefined}
        onClick={() => {
          if (isDir) {
            toggle()
          } else {
            onSelectFile?.(node.path)
          }
        }}
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
        {isDir ? (isOpen ? '▾' : '▸') : '•'} {node.name}{isDir ? '/' : ''}
      </div>
      {isDir && isOpen && hasChildren
        ? node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              selectedFilePath={selectedFilePath}
            />
          ))
        : null}
    </div>
  )
}

export default function SidePanel({
  activeView,
  isOpen,
  projectRoot,
  projectTree,
  onOpenProject,
  onSelectFile,
  selectedFilePath,
}: Props) {
  return (
    <aside className={`sidepanel ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidepanel-header">
        <div className="sidepanel-title">{activeView.toUpperCase()}</div>
      </div>

      <div className="sidepanel-body">
        {activeView === 'logic' && <div>Logic options</div>}
        {activeView === 'files' && (
          <div className="files-panel">
            <button className="files-open-btn" onClick={onOpenProject}>
              Open a folder
            </button>
            {projectRoot ? (
              <div className="files-root">{projectRoot}</div>
            ) : (
              <div className="files-empty">No project loaded yet.</div>
            )}
            {projectTree ? (
              <div className="file-tree">
                <TreeNode
                  node={projectTree}
                  onSelectFile={onSelectFile}
                  selectedFilePath={selectedFilePath}
                />
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
