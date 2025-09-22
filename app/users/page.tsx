'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, Users, AlertCircle, TrendingUp, Edit, Trash, UserPlus, Home, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { MainLayout } from '@/components/layout/main-layout'
import api from '@/lib/axios'
import { Badge } from '@/components/ui/badge'
import { UserOnboardingFlow } from './components/user-form' // Import creation flow
import { UserEditDialog } from './components/user-edit-dialog' // Import edit dialog
import { ProfileCreationForm, UnitAssignmentForm } from './components/user-form' // For separate profile/unit dialogs
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Define User type based on backend serializer
interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: 'tenant' | 'landlord' | 'admin' // Add other roles as needed
  has_profile?: boolean // We'll compute this based on API data or separate check
  // Add other fields as needed
  profile?: any; // e.g., { id, ... } or null
  current_unit?: any; // For tenants
}

// Update columns for has_profile (based on profile existence)
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'phone',
    header: 'Phone'
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>
  },
  {
    accessorKey: 'has_profile',
    header: 'Profile Status',
    cell: ({ row }) => (
      row.original.profile 
        ? <Badge variant="default">Complete</Badge> 
        : <Badge variant="destructive">Incomplete</Badge>
    )
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const { onView, onEdit, onDelete, onCreateProfile, onAssignUnit } = table.options.meta as {
        onView: (user: User) => void;
        onEdit: (user: User) => void;
        onDelete: (user: User) => void;
        onCreateProfile: (user: User) => void;
        onAssignUnit: (user: User) => void;
      };
      const u = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(u)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(u)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(u)}><Trash className="h-4 w-4" /></Button>
          {!u.profile && <Button variant="ghost" size="sm" onClick={() => onCreateProfile(u)}><UserPlus className="h-4 w-4" /></Button>}
          {u.role === 'tenant' && !u.current_unit && <Button variant="ghost" size="sm" onClick={() => onAssignUnit(u)}><Home className="h-4 w-4" /></Button>}
        </div>
      );
    }
  }
]

// Adapted DataTable (local to this file to avoid 'user' column issue; filters on 'full_name' instead)
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  pageIndex: number
  pageSize: number
  onPageChange: (page: number) => void
  meta?: any
}

function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex,
  pageSize,
  onPageChange,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    pageCount: pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: true,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter users..."
            value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("full_name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium">
              Page {pageIndex + 1} of {pageCount}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; // Adjust as needed

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users/', {
          params: { page: pageIndex + 1, page_size: pageSize }
        });
        const data = response.data;
        setUsers(Array.isArray(data.results) ? data.results.map((user: any) => ({
          ...user,
          has_profile: !!user.profile // Compute based on profile existence
        })) : []);
        setTotalPages(Math.ceil(data.count / pageSize));
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({ variant: "destructive", description: "Failed to load users" });
        setUsers([]);
        setTotalPages(1);
      }
    };
    fetchUsers();
  }, [pageIndex]);

  const handleDelete = async (user: User) => {
    if (confirm(`Delete ${user.first_name} ${user.last_name}?`)) {
      try {
        await api.delete(`/auth/users/${user.id}/`);
        toast({ description: "User deleted" });
        // Refresh list
        const response = await api.get('/auth/users/', {
          params: { page: pageIndex + 1, page_size: pageSize }
        });
        setUsers(Array.isArray(response.data.results) ? response.data.results : []);
      } catch (error) {
        toast({ variant: "destructive", description: "Failed to delete user" });
      }
    }
  };

  const handleCreateProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const handleAssignUnit = (user: User) => {
    setSelectedUser(user);
    setIsUnitOpen(true);
  };

  const handleView = (user: User) => {
    // TODO: Implement details view dialog
    console.log('View user:', user)
  }

  // TODO: Implement summary stats similar to tenants page
  const totalUsers = users.length
  // Add more stats as needed

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Users</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreationOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <Users className="h-4 w-4 text-brand-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">All roles</p>
            </div>
          </CardContent>
        </Card>
        {/* Add more summary cards as needed */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users}
            pageCount={totalPages}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPageChange={setPageIndex}
            meta={{
              onView: handleView,
              onEdit: (user: User) => { setSelectedUser(user); setIsEditOpen(true); },
              onDelete: handleDelete,
              onCreateProfile: handleCreateProfile,
              onAssignUnit: handleAssignUnit
            }}
          />

          <UserOnboardingFlow isOpen={isCreationOpen} onClose={() => setIsCreationOpen(false)} />
          {selectedUser && (
            <>
              <UserEditDialog user={selectedUser} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onUpdate={async () => {
                // Refresh list
                const response = await api.get('/auth/users/', {
                  params: { page: pageIndex + 1, page_size: pageSize }
                });
                setUsers(Array.isArray(response.data.results) ? response.data.results : []);
              }} />
              <ProfileCreationForm isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSuccess={async () => {
                toast({ description: "Profile created" });
                setIsProfileOpen(false);
                // Refresh
                const response = await api.get('/auth/users/', {
                  params: { page: pageIndex + 1, page_size: pageSize }
                });
                setUsers(Array.isArray(response.data.results) ? response.data.results : []);
              }} userData={selectedUser} role={selectedUser.role as 'tenant' | 'landlord'} />
              {selectedUser.role === 'tenant' && (
                <UnitAssignmentForm isOpen={isUnitOpen} onClose={() => setIsUnitOpen(false)} onSuccess={async () => {
                  toast({ description: "Unit assigned" });
                  setIsUnitOpen(false);
                  // Refresh
                  const response = await api.get('/auth/users/', {
                    params: { page: pageIndex + 1, page_size: pageSize }
                  });
                  setUsers(Array.isArray(response.data.results) ? response.data.results : []);
                }} userData={selectedUser} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* TODO: Add creation dialog here, similar to TenantOnboardingFlow */}
    </MainLayout>
  )
}