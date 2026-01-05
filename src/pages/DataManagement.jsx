import { useState, useEffect } from 'react'

export default function DataManagement({ onNavigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('table')
  const [selectedTag, setSelectedTag] = useState('')
  const [tags, setTags] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const [modalItemId, setModalItemId] = useState(null)
  const [modalZoom, setModalZoom] = useState(1)
  const API_BASE = 'http://localhost:8000'

  useEffect(() => {
    loadTags()
    loadData()
  }, [selectedTag])

  const loadTags = async () => {
    try {
      const r = await fetch(`${API_BASE}/tags`)
      const j = await r.json()
      setTags(j.tags || [])
    } catch (e) {
      console.error('Failed to load tags:', e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = selectedTag 
        ? `${API_BASE}/data?tag=${encodeURIComponent(selectedTag)}`
        : `${API_BASE}/data`
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = await r.json()
      setItems(j.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load data: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this item? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const r = await fetch(`${API_BASE}/data/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      // remove from local state
      setItems(prev => prev.filter(it => it.id !== id))
     } catch (e) {
      console.error('Delete failed', e)
      alert('Delete failed: ' + e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getImageUrl = (item) => `${API_BASE}/data/${item.id}`

  const clamp = (v, a = 0.2, b = 3) => Math.max(a, Math.min(b, v))

  

  const openModal = (id) => {
    setModalItemId(id)
    setModalZoom(1)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setModalItemId(null)
    setModalZoom(1)
    document.body.style.overflow = ''
  }

  // keyboard escape to close modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    if (modalItemId) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalItemId])

  const TableView = () => (
    <div className="table-view">
      <table className="data-table">
        <thead>
          <tr>
              <th>ID</th>
              <th>Preview</th>
              <th>Filename</th>
              <th>Tag</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ overflow: 'hidden', width: 100, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={getImageUrl(item)}
                      alt={item.filename}
                      className="table-thumbnail"
                      style={{ transition: 'transform 0.18s', transformOrigin: 'center', cursor: 'zoom-in' }}
                      onClick={() => openModal(item.id)}
                      onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="50%" x="50%" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E' }}
                    />
                  </div>
                  {/* inline zoom controls removed; modal still provides zoom */}
                </div>
              </td>
              <td>{item.filename}</td>
              <td><span className="tag-badge">{item.tag || 'N/A'}</span></td>
              <td>{formatFileSize(item.file_size)}</td>
              <td>{formatDate(item.created_at)}</td>
              <td>
                <button className="btn btn-danger" onClick={() => deleteItem(item.id)} disabled={deletingId === item.id}>
                  {deletingId === item.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const GridView = () => (
      <div className="grid-view">
      {items.map(item => (
        <div key={item.id} className="grid-card">
            <div className="grid-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={getImageUrl(item)} alt={item.filename} style={{ maxWidth: '100%', maxHeight: 200, transition: 'transform 0.18s', transformOrigin: 'center', cursor: 'zoom-in' }} onClick={() => openModal(item.id)} onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" dy="50%" x="50%" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E' }} />
          </div>
          <div className="grid-card-content">
            <h3 className="grid-card-title">{item.filename}</h3>
            <div className="grid-card-meta">
              <span className="tag-badge">{item.tag || 'N/A'}</span>
              <span className="file-size">{formatFileSize(item.file_size)}</span>
            </div>
            <div className="grid-card-footer">
              <small>ID: {item.id}</small>
              <small>{formatDate(item.created_at)}</small>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {/* inline zoom controls removed; modal still provides zoom */}
                </div>
                <div>
                  <button className="btn btn-danger" onClick={() => deleteItem(item.id)} disabled={deletingId === item.id}>
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="data-manage">
      <div className="data-manage-header">
        <h2>Data Management</h2>
        <div>
          <button className="btn" onClick={() => onNavigate('label')}>Back to Labelling</button>
        </div>
      </div>

      <div className="data-manage-controls">
        <div className="view-toggle">
          <button className={`btn-toggle ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>Table View</button>
          <button className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>Grid View</button>
        </div>

        <div className="filter-controls">
          <label>Filter by Tag:</label>
          <select className="select" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
            <option value="">All Tags</option>
            {tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <button className="btn" onClick={loadData}>Refresh</button>
        </div>
      </div>

      {loading && <div className="loading">Loading data...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <div className="empty-state">No records found</div>
          ) : (
            <>
              <div className="data-stats">Showing {items.length} record{items.length !== 1 ? 's' : ''}{selectedTag && ` filtered by tag: ${selectedTag}`}</div>
              {viewMode === 'table' ? <TableView /> : <GridView />}
            </>
          )}
        </>
      )}

      {modalItemId && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className && e.target.className.includes('modal-overlay')) closeModal() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%', background: '#fff', padding: 12, borderRadius: 6 }}>
            <button onClick={closeModal} style={{ position: 'absolute', right: 8, top: 8, zIndex: 10, background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginRight: 8 }}>
                <button className="btn" onClick={() => setModalZoom(v => clamp(parseFloat((v - 0.2).toFixed(2))))}>-</button>
                <button className="btn" onClick={() => setModalZoom(v => clamp(parseFloat((v + 0.2).toFixed(2))))}>+</button>
                <button className="btn" onClick={() => setModalZoom(1)}>Reset</button>
                <div style={{ fontSize: 13, color: '#333', textAlign: 'center' }}>x{modalZoom.toFixed(2)}</div>
              </div>
              <div style={{ overflow: 'auto', maxWidth: '80vw', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`${API_BASE}/data/${modalItemId}`} alt="zoomed" style={{ transform: `scale(${modalZoom})`, transition: 'transform 0.12s', maxWidth: '100%', maxHeight: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
