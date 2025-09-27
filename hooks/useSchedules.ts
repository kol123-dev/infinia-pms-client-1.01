import { useState, useEffect } from 'react';
import api from '@/lib/axios';

interface Schedule { /* Add your Schedule type here */ }

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/invoice-schedules/');
      setSchedules(res.data.results || res.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return { schedules, loading, fetchSchedules };
};