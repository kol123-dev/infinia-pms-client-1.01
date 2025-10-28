import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Schedule } from '@/types/invoice';

interface ScheduleListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: number) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[800px] sm:min-w-full">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[160px]">Properties</TableHead>
            <TableHead className="hidden sm:table-cell">Tenants</TableHead>
            <TableHead className="hidden sm:table-cell">Frequency</TableHead>
            <TableHead className="hidden sm:table-cell">Send</TableHead>
            <TableHead className="hidden sm:table-cell">Due</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="min-w-[120px]">Expected Invoices</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((schedule) => (
            <TableRow key={schedule.id} className="align-top">
              <TableCell className="font-medium">
                {(schedule.propertyNames && schedule.propertyNames.length > 0
                  ? schedule.propertyNames.join(', ')
                  : Array.isArray(schedule.properties) ? schedule.properties.join(', ') : '')}
                <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                  <span className="mr-2">
                    Send: {schedule.send_day} @ {schedule.send_time}
                  </span>
                  <span>
                    Due: +{schedule.due_day} @ {schedule.due_time}
                  </span>
                </div>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                {schedule.tenant_mode === 'all'
                  ? 'All Tenants'
                  : `All except ${schedule.excluded_tenants?.length || 0} tenants`}
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary" className="capitalize">{schedule.frequency}</Badge>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <div className="flex flex-col">
                  <span>Day: {schedule.send_day}</span>
                  <span>Time: {schedule.send_time}</span>
                </div>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <div className="flex flex-col">
                  <span>Day +{schedule.due_day}</span>
                  <span>Time: {schedule.due_time}</span>
                </div>
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <Badge variant={schedule.active ? 'default' : 'secondary'}>
                  {schedule.active ? 'Active' : 'Inactive'}
                </Badge>
                {schedule.next_run ? (
                  <div className="text-xs text-muted-foreground mt-1">Next: {new Date(schedule.next_run).toLocaleString()}</div>
                ) : null}
              </TableCell>

              <TableCell>
                {typeof schedule.expectedInvoiceCount === 'number'
                  ? schedule.expectedInvoiceCount
                  : <span className="text-muted-foreground">—</span>}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(schedule)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (schedule.id !== undefined) {
                        onDelete(schedule.id);
                      } else {
                        console.error('Schedule ID is undefined');
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};