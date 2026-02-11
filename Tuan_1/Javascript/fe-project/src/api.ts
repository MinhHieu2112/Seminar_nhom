import { Item, ItemCreate, RootResponse, HealthResponse } from './types'

const API_BASE_URL = 'http://localhost:8000'

export async function fetchRoot(): Promise<RootResponse> {
  const response = await fetch(`${API_BASE_URL}/`)
  if (!response.ok) {
    throw new Error('Failed to fetch root data')
  }
  return response.json()
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`)
  if (!response.ok) {
    throw new Error('Failed to fetch health data')
  }
  return response.json()
}

export async function getItems(): Promise<Item[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/items`)
    if (!response.ok) {
      throw new Error('Failed to fetch items')
    }
    return response.json()
  } catch {
    // Items endpoint may not exist yet
    return []
  }
}

export async function createItem(item: ItemCreate): Promise<Item> {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  })
  if (!response.ok) {
    throw new Error('Failed to create item')
  }
  return response.json()
}

export async function deleteItem(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete item')
  }
}
