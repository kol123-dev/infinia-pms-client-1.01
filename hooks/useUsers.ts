import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/users-api'

export function useUsersQuery(params: api.ListUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => api.listUsers(params),
    staleTime: 10_000,
  })
}

export function useUserQuery(id: number) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
    enabled: !!id,
  })
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ['permissionsCatalog'],
    queryFn: () => api.getPermissionsCatalog(),
    staleTime: Infinity,
  })
}

export function useUserPermissions(id: number) {
  return useQuery({
    queryKey: ['userPermissions', id],
    queryFn: () => api.getUserPermissions(id),
    enabled: !!id,
  })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.updateUser,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['user', (vars as any).id] })
    },
  })
}

export function useBlockUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.blockUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUserPermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.updateUserPermissions,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['userPermissions', (vars as any).id] })
    },
  })
}