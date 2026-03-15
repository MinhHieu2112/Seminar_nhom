export interface UnlockHistoryItem {
  id: string
  courseTitle: string
  moduleTitle: string
  unlockedAt: string
}

const STORAGE_KEY = 'course_unlock_history'

export function getUnlockHistory(): UnlockHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as UnlockHistoryItem[]
  } catch {
    return []
  }
}

export function addUnlockHistory(courseTitle: string, moduleTitle: string) {
  if (typeof window === 'undefined') return

  const history = getUnlockHistory()
  const item: UnlockHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    courseTitle,
    moduleTitle,
    unlockedAt: new Date().toISOString(),
  }
  const updated = [item, ...history].slice(0, 10)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
