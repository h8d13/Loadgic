import type { ViewMode } from "../../types/view";

type Props = {
    activeView: ViewMode;
    isOpen: boolean;
    onToggle: () => void;
}

export default function SidePanel({ activeView, isOpen, onToggle }: Props) {
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
                {activeView === 'files' && <div>Files options</div>}
                {activeView === 'run' && <div>Run options</div>}
                {activeView === 'settings' && <div>Settings options</div>}
            </div>
        </aside>
    );
}
