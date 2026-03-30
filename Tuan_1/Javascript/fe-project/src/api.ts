import { Item, ItemCreate, RootResponse, HealthResponse, LearningProfile, LearningProfileCreate, Language } from './types'

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

// Learning Profile API Functions
export async function getLanguages(): Promise<Language[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/languages`)
    if (!response.ok) {
      throw new Error('Failed to fetch languages')
    }
    return response.json()
  } catch (err) {
    console.error('Error fetching languages:', err)
    // Fallback to mock data if API not available
    return [
      { id: 1, name: 'Python', judge0_id: 71, is_active: true },
      { id: 2, name: 'JavaScript', judge0_id: 63, is_active: true },
      { id: 3, name: 'Java', judge0_id: 62, is_active: true },
      { id: 4, name: 'C#', judge0_id: 51, is_active: true },
    ]
  }
}

export async function getLearningProfile(userId: number): Promise<LearningProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-profile`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch learning profile')
    }
    return response.json()
  } catch (err) {
    console.error('Error fetching learning profile:', err)
    return null
  }
}

export async function createLearningProfile(
  userId: number,
  profile: LearningProfileCreate
): Promise<LearningProfile> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create learning profile')
  }
  return response.json()
}

export async function updateLearningProfile(
  userId: number,
  profile: LearningProfileCreate
): Promise<LearningProfile> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/learning-profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update learning profile')
  }
  return response.json()
}
