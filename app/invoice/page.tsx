"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/axios'; // Default import for API helper
import { MainLayout } from '@/components/layout/main-layout'; // Import to add sidebar and header
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // For card wrapping
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Check, Clock, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Eye, MessageSquare, Trash2, Pencil } from 'lucide-react';

// Utility function for currency formatting (matching payments page)
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Updated Invoice interface to match payments page structure
interface Invoice {
  id: number;
  invoice_number: string;
  tenant: {
    id: number;  // Added for tenant ID (used in SMS recipients)
    user: {
      full_name: string;  // Use this instead of separate first_name/last_name
      email: string;
    };
  };
  unit: {
    unit_number: string;
    property: {
      name: string;
    };
  };
  amount: string | number;
  due_date: string;
  paid_date?: string;
  status: string;
  method?: string;  // Added for payment method (matches API serializer)
  // Add any other fields as needed from your API response
}

// Schedule interface (unchanged)
interface Schedule {
  id: number;
  properties: number[];
  tenants: (number | 'all')[];
  frequency: string;
  dueDateOffset: number;
  active: boolean;
  nextRun: string;
  notificationsEnabled: boolean;
}

interface InvoiceResponse {
  results: Invoice[];
  count: number;
  next: string | null;
  previous: string | null;
}

export default function InvoiceManagementPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
  const [tenants, setTenants] = useState<{ id: number; name: string }[]>([]);
  const [formData, setFormData] = useState<Partial<Schedule>>({ tenants: [], notificationsEnabled: false });
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tenantMode, setTenantMode] = useState<'all' | 'specific'>('all');

  // New states for table (matching payments)
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditInvoiceMode, setIsEditInvoiceMode] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
    fetchProperties();
    fetchTenants();
  }, []);

  // Fetch schedules, properties, tenants (unchanged)
  const fetchSchedules = async () => {
    try {
      const response = await api.get('/payments/invoice-schedules/');
      setSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties/');
      setProperties(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants/');
      setTenants(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setTenants([]);
    }
  };

  // Use react-query for invoices (matching payments)
  const { data: invoicesData, isLoading } = useQuery<InvoiceResponse>({
    queryKey: ['invoices', page, pageSize],
    queryFn: async () => {
      const response = await api.get(`/payments/invoices/?page=${page}&page_size=${pageSize}`);
      return response.data;
    },
  });

  const filteredInvoices = (invoicesData?.results || []).filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.tenant.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||  // Updated to use full_name
    invoice.unit.property.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <Badge className="bg-blue-500 hover:bg-blue-600">paid</Badge>
          </div>
        );
      case "overdue":
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <Badge variant="destructive">overdue</Badge>
          </div>
        );
      case "sent":
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <Badge variant="outline" className="text-orange-500 border-orange-500">pending</Badge>
          </div>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleSendSMS = async (invoice: Invoice) => {
    try {
      await api.post(`/communications/`, {
        recipients: [invoice.tenant.id],  // Now safe with tenant.id in interface
        landlord: 1, // Adjust as needed
        body: `Dear ${invoice.tenant.user.full_name},\n\nThis is a reminder about invoice ${invoice.invoice_number} for ${formatCurrency(Number(invoice.amount))}, due on ${new Date(invoice.due_date).toLocaleDateString()}.\n\nThank you.`,  // Updated to use full_name
      });
      toast({ title: "Success", description: "Invoice SMS sent successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to send SMS" });
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    try {
      await api.delete(`/payments/invoices/${invoice.id}/`);
      toast({ title: "Success", description: "Invoice deleted successfully" });
      // Refresh data
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete invoice" });
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditInvoiceMode(true);
    // Implement edit logic here (e.g., open form)
  };

  // Other handlers (create/update schedule, etc.) unchanged
  const handleCreateOrUpdate = async () => {
    try {
      if (isEditMode && selectedId) {
        await api.put(`/invoice-schedules/${selectedId}/`, formData);
      } else {
        await api.post('/invoice-schedules/', formData);
      }
      fetchSchedules();
      setFormData({ tenants: [], notificationsEnabled: false });
      setIsEditMode(false);
      setSelectedId(null);
      setTenantMode('all');
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData(schedule);
    setIsEditMode(true);
    setSelectedId(schedule.id);
    setTenantMode(schedule.tenants.includes('all') ? 'all' : 'specific');
  };

  const handleDeleteSchedule = async (id: number) => {
    try {
      await api.delete(`/invoice-schedules/${id}/`);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleToggleActive = async (id: number, active: boolean) => {
    try {
      await api.patch(`/invoice-schedules/${id}/`, { active: !active });
      fetchSchedules();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handlePreview = async (id: number) => {
    try {
      const res = await api.get(`/invoice-schedules/${id}/preview/`);
      alert(`Preview: ${res.data.affectedTenants.length} tenants would get invoices. Details: ${JSON.stringify(res.data)}`);
    } catch (error) {
      console.error('Error previewing schedule:', error);
    }
  };

  // Simple stats
  const totalInvoices = filteredInvoices.length;
  const overdueInvoices = filteredInvoices.filter(inv => new Date(inv.due_date) < new Date() && inv.status !== 'PAID').length;

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold">Invoice Management</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">Create Schedule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit' : 'Create'} Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <MultiSelect
                  options={properties.map(p => ({ value: p.id, label: p.name }))}
                  onChange={(vals: number[]) => setFormData({ ...formData, properties: vals })}
                  value={formData.properties || []}
                  placeholder="Select Properties"
                />
                <Select value={tenantMode} onValueChange={val => {
                  setTenantMode(val as 'all' | 'specific');
                  setFormData({ ...formData, tenants: val === 'all' ? ['all'] : [] });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Tenant Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="specific">Specific Tenants</SelectItem>
                  </SelectContent>
                </Select>
                {tenantMode === 'specific' && (
                  <MultiSelect
                    options={tenants.map(t => ({ value: t.id, label: t.name }))}
                    onChange={(vals: number[]) => setFormData({ ...formData, tenants: vals })}
                    value={formData.tenants?.filter(t => typeof t === 'number') || []}
                    placeholder="Select Specific Tenants"
                  />
                )}
                <Select onValueChange={val => setFormData({ ...formData, frequency: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom (Cron)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.frequency === 'custom' && (
                  <Input
                    type="text"
                    placeholder="Cron Expression (e.g., 0 0 1 * *)"
                    value={formData.frequency || ''}
                    onChange={e => setFormData({ ...formData, frequency: `cron:${e.target.value}` })}
                  />
                )}
                <Input
                  type="number"
                  placeholder="Due Date Offset (days)"
                  value={formData.dueDateOffset ?? 5}
                  onChange={e => setFormData({ ...formData, dueDateOffset: parseInt(e.target.value) })}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={formData.notificationsEnabled ?? false}
                    onCheckedChange={checked => setFormData({ ...formData, notificationsEnabled: !!checked })}
                  />
                  <label htmlFor="notifications">Enable Notifications (SMS/Email)</label>
                </div>
                <Button onClick={handleCreateOrUpdate}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" className="w-full sm:w-auto">Generate Invoices</Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>Total Invoices: {totalInvoices}</div>
          <div>Overdue: {overdueInvoices}</div>
        </CardContent>
      </Card>

      <Tabs defaultValue="invoices" className="space-y-4">
        <div className="sticky top-0 z-10 bg-background overflow-x-auto scrollbar-hide">
          <TabsList className="flex space-x-2 min-w-max flex-nowrap">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage tenant invoices and payment tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm mb-4"
              />
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="hidden sm:table-cell">Paid Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Method</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{invoice.tenant.user.full_name}</span>
                              <span className="text-sm text-muted-foreground">{invoice.tenant.user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{invoice.unit.property.name}</span>
                              <span className="text-sm text-green-600">Unit {invoice.unit.unit_number}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(Number(invoice.amount))}</TableCell>
                          <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                          <TableCell className="hidden sm:table-cell">{invoice.paid_date ? new Date(invoice.paid_date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{invoice.method || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedInvoice(invoice)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                  <DialogHeader>
                                    <DialogTitle>Invoice Details</DialogTitle>
                                    <DialogDescription>Invoice #{invoice.invoice_number}</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <div className="font-semibold">Amount:</div>
                                      <div className="col-span-3">{formatCurrency(Number(invoice.amount))}</div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <div className="font-semibold">Due Date:</div>
                                      <div className="col-span-3">{new Date(invoice.due_date).toLocaleDateString()}</div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <div className="font-semibold">Status:</div>
                                      <div className="col-span-3">{getStatusBadge(invoice.status)}</div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSendSMS(invoice)}>
                                <MessageSquare className="h-4 w-4 text-orange-500" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditInvoice(invoice)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedInvoice(invoice); setIsDeleteDialogOpen(true); }}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Confirm Delete</DialogTitle>
                                    <DialogDescription>Are you sure you want to delete invoice #{invoice.invoice_number}?</DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={() => { handleDelete(invoice); setIsDeleteDialogOpen(false); }}>Delete</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-end mt-4 gap-2">
                    <Button variant="outline" disabled={!invoicesData?.previous} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    <Button variant="outline" disabled={!invoicesData?.next} onClick={() => setPage(page + 1)}>
                      Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Schedules</CardTitle>
              <CardDescription>Manage automated invoice schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Tenants</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(schedule => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.id}</TableCell>
                      <TableCell>{schedule.properties.length} selected</TableCell>
                      <TableCell>{schedule.tenants.includes('all') ? 'All' : `${schedule.tenants.length} specific`}</TableCell>
                      <TableCell>{schedule.frequency}</TableCell>
                      <TableCell>{new Date(schedule.nextRun).toLocaleDateString()}</TableCell>
                      <TableCell>{schedule.active ? 'Active' : 'Paused'}</TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(schedule.id, schedule.active)}>
                          {schedule.active ? 'Pause' : 'Resume'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>Delete</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePreview(schedule.id)}>Preview</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}