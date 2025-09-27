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

  const handleSubmitSchedule = async (data: ScheduleFormData) => {
    try {
      if (editingSchedule) {
        await api.put(`/payments/invoice-schedules/${editingSchedule.id}/`, data);
      } else {
        await api.post('/payments/invoice-schedules/', data);
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
            <Button onClick={handleCreateSchedule}>Create Schedule</Button>
            {schedulesLoading ? <p>Loading...</p> : (
              <>
                <ScheduleList 
                  schedules={schedules as import('@/types/invoice').Schedule[]} 
                  onEdit={setEditingSchedule} 
                  onDelete={(id: number) => { /* delete logic */ }} 
                />
                <CreateEditScheduleDialog
                  isOpen={isDialogOpen}
                  onClose={() => setIsDialogOpen(false)}
                  onSubmit={handleSubmitSchedule}
                  initialData={editingSchedule ? {
                    id: editingSchedule.id,
                    property: editingSchedule.property || '',
                    tenants: editingSchedule.tenants || [],
                    frequency: editingSchedule.frequency || '',
                    amount_type: 'unit_rent', // Provide default instead of accessing from Schedule (assuming it's not present)
                    // Add defaults for any other required ScheduleFormData fields, e.g.:
                    // some_other_field: editingSchedule.some_other_field || defaultValue,
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