import { api } from '@/lib/api'
import type { AdminStats, AdminUser, AdminUserDetail, AdminContentStats, Role } from '@/types'

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: Role | ''
  sortBy?: 'createdAt' | 'name' | 'lastActive'
  order?: 'asc' | 'desc'
}

export interface UsersPage {
  data: AdminUser[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const adminApi = {
  getStats: (): Promise<AdminStats> =>
    api.get('/admin/stats').then((r) => r.data.data),

  getUsers: (params: GetUsersParams = {}): Promise<UsersPage> =>
    api.get('/admin/users', { params }).then((r) => r.data.data),

  getUserById: (id: string): Promise<AdminUserDetail> =>
    api.get(`/admin/users/${id}`).then((r) => r.data.data),

  updateUser: (id: string, data: { role?: Role; isActive?: boolean }): Promise<AdminUser> =>
    api.put(`/admin/users/${id}`, data).then((r) => r.data.data),

  getContent: (): Promise<AdminContentStats> =>
    api.get('/admin/content').then((r) => r.data.data),
}
