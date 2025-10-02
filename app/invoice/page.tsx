'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // Added import for Badge
import { MainLayout } from '@/components/layout/main-layout'; // Changed to named import
import { useInvoices } from '@/hooks/useInvoices';
import { useSchedules } from '@/hooks/useSchedules';
import { InvoiceList } from './components/InvoiceList';
import { ScheduleList } from './components/ScheduleList'; // Now imports correctly
import { CreateEditScheduleDialog } from './components/CreateEditScheduleDialog';
import api from '@/lib/axios';
import { Invoice, Schedule, ScheduleFormData } from '@/types/invoice'; // Import types

export default function InvoiceManagementPage() {
  const { invoicesData, page, setPage, loading: invoicesLoading, fetchInvoices } = useInvoices();
  const { schedules, loading: schedulesLoading, fetchSchedules } = useSchedules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [amountType, setAmountType] = useState<'unit_rent' | 'fixed'>('unit_rent'); // Re-declared if moved
  const [fixedAmount, setFixedAmount] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]); // Re-declared with type

  // Handlers...
  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setIsDialogOpen(true);
  };

  // Add: open dialog with selected schedule
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsDialogOpen(true);
  };

  // Add: delete schedule and refresh
  const handleDeleteSchedule = async (id: number) => {
    const confirmed = window.confirm('Delete this schedule? This cannot be undone.');
    if (!confirmed) return;
    try {
      await api.delete(`/payments/invoice-schedules/${id}/`);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };
  const handleSubmitSchedule = async (data: ScheduleFormData) => {
    const transformedData = {
      ...data,
      properties: data.property ? [data.property] : [],
      tenant_mode: data.tenantMode || 'all',
      excluded_tenants: data.excludedTenants || [],
      send_day: data.sendDay,
      send_time: data.sendTime,
      due_day: data.dueDay,
      due_time: data.dueTime,
      amount_type: data.amount_type,
      fixed_amount: data.fixed_amount,
      send_sms: data.sendSms,
      // Remove frontend-specific fields
      property: undefined,
      tenants: undefined,
      tenantMode: undefined,
      excludedTenants: undefined,
      sendDay: undefined,
      sendTime: undefined,
      dueDay: undefined,
      dueTime: undefined,
      sendSms: undefined,
    };
    try {
      if (editingSchedule) {
        await api.put(`/payments/invoice-schedules/${editingSchedule.id}/`, transformedData);
      } else {
        await api.post('/payments/invoice-schedules/', transformedData);
      }
      fetchSchedules();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      await api.delete(`/payments/invoices/${id}/`);
      fetchInvoices(page);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  // Example for implicit any fix (line 156)
  const someFunction = (inv: Invoice) => { /* ... */ }; // Explicit type

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Invoice Management</h1>
        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>
          <TabsContent value="invoices">
            {invoicesLoading ? <p>Loading...</p> : (
              <>
                <InvoiceList 
                  invoices={invoicesData.results} // Changed from 'invoices' to 'invoicesData.results'
                  onDelete={handleDeleteInvoice} // Now optional
                /> {/* Type cast if needed */}
                {/* Pagination; remove empty expressions, e.g., prop={validValue} */}
              </>
            )}
          </TabsContent>
          <TabsContent value="schedules">
            <Button onClick={handleCreateSchedule} className="mb-4">Create Schedule</Button>
            {schedulesLoading ? <p>Loading...</p> : (
              <>
                <div className="overflow-x-auto">
                  <ScheduleList 
                    schedules={schedules as import('@/types/invoice').Schedule[]} 
                    onEdit={handleEditSchedule} 
                    onDelete={handleDeleteSchedule} 
                  />
                </div>
                <CreateEditScheduleDialog
                  isOpen={isDialogOpen}
                  onClose={() => setIsDialogOpen(false)}
                  onSubmit={handleSubmitSchedule}
                  initialData={editingSchedule ? {
                    id: editingSchedule.id,
                    property: editingSchedule.properties?.[0] || '',
                    tenants: [],
                    frequency: editingSchedule.frequency || '',
                    amount_type: editingSchedule.amount_type || 'unit_rent',
                    fixed_amount: editingSchedule.fixed_amount,
                    tenantMode: editingSchedule.tenant_mode || 'all',
                    excludedTenants: editingSchedule.excluded_tenants || [],
                    sendDay: editingSchedule.send_day || 25,
                    sendTime: editingSchedule.send_time || '09:00',
                    dueDay: editingSchedule.due_day || 5,
                    dueTime: editingSchedule.due_time || '23:59',
                    sendSms: editingSchedule.send_sms ?? true,
                  } : undefined}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}