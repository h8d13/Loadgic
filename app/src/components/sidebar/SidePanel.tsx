import type { ViewMode } from "../../types/view";

type Props = {
    activeView: ViewMode;
    isOpen: boolean;
}

export default function SidePanel({ activeView, isOpen }: Props) {
    return (
        <aside className={`sidepanel ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidepanel-header">
                <div className="sidepanel-title">{activeView.toUpperCase()}</div>
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