export interface Item {
  id: number
  name: string
  description?: string
  price?: number
  created_at: string
}

export interface ItemCreate {
  name: string
  description?: string
  price?: number
}

export interface RootResponse {
  app: string
  version: string
  message: string
}

export interface HealthCheckDetail {
  name: string
  status: string
  details?: string
}

export interface HealthResponse {
  status: string
  uptime_seconds: number
  timestamp: string
  checks: HealthCheckDetail[]
}
