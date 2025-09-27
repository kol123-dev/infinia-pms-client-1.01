import { useState, useEffect } from 'react';
import api from '@/lib/axios';

import { Invoice } from '@/types/invoice'; // Add this import

type InvoicesData = {
  results: Invoice[];
  count: number;
  next: string | null;
  previous: string | null;
};

export const useInvoices = (initialPage: number = 1) => {
  const [invoicesData, setInvoicesData] = useState<InvoicesData>({ results: [], count: 0, next: null, previous: null });
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/payments/invoices/?page=${page}`);
      setInvoicesData(res.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(page);
  }, [page]);

  return { invoicesData, page, setPage, loading, fetchInvoices };
};