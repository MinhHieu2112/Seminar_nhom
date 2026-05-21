import { useEffect, useState } from 'react'
import './App.css'
import { Item, RootResponse, HealthResponse } from './types'
import { fetchRoot, fetchHealth, getItems, createItem, deleteItem } from './api'

function App() {
  const [appInfo, setAppInfo] = useState<RootResponse | null>(null)
  const [healthInfo, setHealthInfo] = useState<HealthResponse | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAppData()
  }, [])

  const loadAppData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [root, health, itemsList] = await Promise.all([
        fetchRoot(),
        fetchHealth(),
        getItems(),
      ])
      
      setAppInfo(root)
      setHealthInfo(health)
      setItems(itemsList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) {
      setError('Item name is required')
      return
    }

    try {
      const newItem = await createItem({
        name: newItemName,
        description: newItemDescription || undefined,
        price: newItemPrice ? parseFloat(newItemPrice) : undefined,
      })
      setItems([...items, newItem])
      setNewItemName('')
      setNewItemDescription('')
      setNewItemPrice('')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteItem(id)
      setItems(items.filter(item => item.id !== id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  return (
    <div className="container">
      {appInfo && (
        <header className="header">
          <h1>{appInfo.app}</h1>
          <p>{appInfo.message}</p>
          <span className="version">v{appInfo.version}</span>
        </header>
      )}

      {error && <div className="error-banner">{error}</div>}

      {healthInfo && (
        <section className="health-section">
          <h2>System Status</h2>
          <div className="health-info">
            <p>
              <strong>Status:</strong>{' '}
              <span className={`status ${healthInfo.status}`}>
                {healthInfo.status.toUpperCase()}
              </span>
            </p>
            <p>
              <strong>Uptime:</strong> {healthInfo.uptime_seconds.toFixed(2)}s
            </p>
            <p>
              <strong>Timestamp:</strong> {new Date(healthInfo.timestamp).toLocaleString()}
            </p>
            {healthInfo.checks.length > 0 && (
              <div className="checks">
                <h3>Health Checks:</h3>
                <ul>
                  {healthInfo.checks.map((check, idx) => (
                    <li key={idx}>
                      <strong>{check.name}</strong>: {check.status}
                      {check.details && ` (${check.details})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="items-section">
        <h2>Luxury Items</h2>

        <form onSubmit={handleAddItem} className="add-item-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Description (optional)"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="number"
              step="0.01"
              placeholder="Price (optional)"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-add">
            Add Item
          </button>
        </form>

        {items.length === 0 ? (
          <p className="no-items">No items yet. Add one to get started!</p>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-header">
                  <h3>{item.name}</h3>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete item"
                  >
                    ✕
                  </button>
                </div>
                {item.description && <p className="item-desc">{item.description}</p>}
                {item.price !== null && item.price !== undefined && (
                  <p className="item-price">${item.price.toFixed(2)}</p>
                )}
                <small className="item-date">
                  Created: {new Date(item.created_at).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      <button className="btn-refresh" onClick={loadAppData}>
        Refresh Data
      </button>
    </div>
  )
}

export default App
