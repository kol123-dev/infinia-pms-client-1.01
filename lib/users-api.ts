// Mock in-memory API for frontend scaffolding.
// Swap implementations with real HTTP calls later.

export type Role = 'agent' | 'tenant'
export type Status = 'active' | 'blocked' | 'pending'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  status: Status
  permissions?: string[]
  created_at: string
  last_active_at?: string | null
}

export interface ListUsersParams {
  q?: string
  role?: Role
  status?: Status
  page?: number
  pageSize?: number
}

let ID = 1000
const now = () => new Date().toISOString()
const USERS: User[] = [
  { id: 1, name: 'Alice Agent', email: 'alice@example.com', role: 'agent', status: 'active', permissions: ['users.view', 'users.create', 'users.update'], created_at: now(), last_active_at: now() },
  { id: 2, name: 'Bob Agent', email: 'bob@example.com', role: 'agent', status: 'blocked', permissions: ['users.view'], created_at: now(), last_active_at: null },
  { id: 3, name: 'Tina Tenant', email: 'tina@example.com', role: 'tenant', status: 'active', created_at: now(), last_active_at: now() },
  { id: 4, name: 'Tom Tenant', email: 'tom@example.com', role: 'tenant', status: 'pending', created_at: now(), last_active_at: null },
]

const PERMISSIONS = [
  'users.view',
  'users.create',
  'users.update',
  'users.delete',
  'users.block',
  'users.permissions.manage',
  'users.activity.view',
]

function delay(ms = 400) { return new Promise((res) => setTimeout(res, ms)) }
import api from './axios'

// Helper: map backend user to frontend
// toUser mapper
function toUser(u: any): User {
  return {
    id: u.id,
    name: u.full_name || u.name || u.email,
    email: u.email,
    role: (u.role === 'agent' ? 'agent' : 'tenant') as Role,
    status: (u.is_active ? 'active' : (u.status ?? 'blocked')) as Status,
    permissions: Array.isArray(u.permissions) ? u.permissions : [],
    created_at: u.date_joined || u.created_at || new Date().toISOString(),
    last_active_at: u.last_login ?? u.last_active_at ?? null,
  }
}

// List users using limit/offset pagination
export async function listUsers(params: ListUsersParams): Promise<{ results: User[]; count: number }> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.max(1, params.pageSize ?? 10)
  const offset = (page - 1) * pageSize

  const res = await api.get('/auth/users/', {
    params: {
      q: params.q,
      role: params.role,
      status: params.status,
      limit: pageSize,
      offset,
    },
  })
  const data = res.data || {}
  const raw = data.results || data || []
  return {
    results: Array.isArray(raw) ? raw.map(toUser) : [],
    count: Number(data.count ?? Array.isArray(raw) ? raw.length : 0),
  }
}

// Fetch single user
export async function getUser(id: number): Promise<User | undefined> {
  const res = await api.get(`/auth/users/${id}/`)
  const u = res.data
  return u ? toUser(u) : undefined
}

// Create agent
export async function createAgent(payload: { email: string; name?: string; permissions?: string[] }) {
  const res = await api.post('/auth/invite-agent/', {
    email: payload.email,
    name: payload.name,
    permissions: payload.permissions ?? [],
  })
  return toUser(res.data)
}

// Update user (name, status, role)
export async function updateUser(payload: { id: number; name?: string; status?: Status; role?: Role }) {
  const res = await api.patch(`/auth/users/${payload.id}/`, {
    name: payload.name,
    status: payload.status,
    role: payload.role,
  })
  return toUser(res.data)
}

// Block/unblock user
export async function blockUser(payload: { id: number; action: 'block' | 'unblock' }) {
  const res = await api.patch(`/auth/users/${payload.id}/`, {
    status: payload.action === 'block' ? 'blocked' : 'active',
  })
  return toUser(res.data)
}

// Delete user
export async function deleteUser(payload: { id: number }) {
  await api.delete(`/auth/users/${payload.id}/`)
  return { ok: true }
}

// Permissions catalog
export async function getPermissionsCatalog(): Promise<{ permissions: string[] }> {
  const res = await api.get('/auth/permissions/')
  const p = res.data?.permissions ?? []
  return { permissions: Array.isArray(p) ? p : [] }
}

// Get user permissions
export async function getUserPermissions(id: number): Promise<string[]> {
  const res = await api.get(`/auth/user-permissions/${id}/`)
  const p = res.data?.permissions ?? []
  return Array.isArray(p) ? p : []
}

// Update user permissions
export async function updateUserPermissions(payload: { id: number; permissions: string[] }) {
  const res = await api.patch(`/auth/user-permissions/${payload.id}/`, {
    permissions: payload.permissions,
  })
  const p = res.data?.permissions ?? []
  return Array.isArray(p) ? p : []
}