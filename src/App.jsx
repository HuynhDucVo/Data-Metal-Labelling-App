import { useState } from 'react'
import './App.css'
import LabelPage from './pages/LabelPage'
import DataManagement from './pages/DataManagement'

function App() {
  const [view, setView] = useState('label')

  return (
    <div className="app">
      <header className="header">
        <h1>Data Labelling App</h1>
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={() => setView('label')} style={{ marginRight: 8 }}>Label</button>
          <button className="btn" onClick={() => setView('manage')}>Data Management</button>
        </div>
      </header>

      {view === 'label' ? (
        <LabelPage onNavigate={setView} />
      ) : (
        <main className="main">
          <DataManagement onNavigate={setView} />
        </main>
      )}
    </div>
  )
}

export default App
// sudo mongod --dbpath /data/db