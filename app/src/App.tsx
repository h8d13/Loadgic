function App() {

  return (
    <div className="app">
      <div className="titlebar window-drag-region">
        <div className="title">Loadgic</div>

        <div className="window-controls window-no-drag">
          <button onClick={() => window.loadgic.minimize()}>—</button>
          <button onClick={() => window.loadgic.toggleMaximize()}>▢</button>
          <button className="close" onClick={() => window.loadgic.close()}>✕</button>
        </div>
      </div>

        {/* MAIN CONTENT */}
      <div className="content">
        {/* futur content */}
      </div>

    </div>
  )
}

export default App
