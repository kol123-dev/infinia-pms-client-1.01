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

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, onEdit, onDelete }) => { // Named export
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property</TableHead>
          <TableHead>Tenants</TableHead>
          <TableHead>Frequency</TableHead>
          {/* Add other headers */}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>{schedule.property}</TableCell>
            <TableCell>{Array.isArray(schedule.tenants) ? schedule.tenants.join(', ') : schedule.tenants}</TableCell>
            <TableCell>{schedule.frequency}</TableCell>
            {/* Other cells */}
            <TableCell>
              <Button onClick={() => onEdit(schedule)}>Edit</Button>
              <Button onClick={() => {
                if (schedule.id !== undefined) {
                  onDelete(schedule.id); // Now safe: id is number
                } else {
                  console.error('Schedule ID is undefined');
                }
              }}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};