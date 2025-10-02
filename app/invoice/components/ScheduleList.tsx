import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; // If needed
import { Button } from '@/components/ui/button';
import { Schedule } from '@/types/invoice';

interface ScheduleListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: number) => void;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, onEdit, onDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-[140px]">Properties</TableHead>
          <TableHead className="hidden sm:table-cell">Tenants</TableHead>
          <TableHead>Frequency</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell className="font-medium">
              {Array.isArray(schedule.properties) ? schedule.properties.join(', ') : ''}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {schedule.tenant_mode === 'all'
                ? 'All Tenants'
                : `All except ${schedule.excluded_tenants?.length || 0} tenants`}
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">{schedule.frequency}</Badge>
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
  );
};