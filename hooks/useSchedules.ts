import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Schedule } from '@/types/invoice';

export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/invoice-schedules/');
      const raw = res.data.results || res.data || [];

      // Fetch property names for mapping
      const propsRes = await api.get('/properties/');
      const properties = propsRes.data.results || propsRes.data || [];
      const propNameById: Record<string, string> = {};
      properties.forEach((p: any) => {
        propNameById[String(p.id)] = p.name;
      });

      // Attach propertyNames
      const withNames: Schedule[] = raw.map((s: any) => ({
        ...s,
        propertyNames: Array.isArray(s.properties)
          ? s.properties.map((id: any) => propNameById[String(id)] || String(id))
          : [],
      }));

      // Fetch expectedInvoiceCount via preview endpoint (best-effort)
      const counts = await Promise.all(
        withNames.map(async (s) => {
          try {
            const pv = await api.get(`/payments/invoice-schedules/${s.id}/preview/`);
            const affected = pv.data?.affectedTenants || [];
            return Array.isArray(affected) ? affected.length : 0;
          } catch {
            return undefined;
          }
        })
      );

      const enriched = withNames.map((s, idx) => ({
        ...s,
        expectedInvoiceCount: counts[idx] ?? undefined,
      }));

      setSchedules(enriched);
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