import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Branch, Customer, Employee, Order, Service, Invoice } from '@/types';

const defaultServices: Service[] = [
  { id: '1', name: 'غسيل خارجي', price: 50, duration: 30, description: 'غسيل خارجي شامل للسيارة' },
  { id: '2', name: 'غسيل داخلي وخارجي', price: 100, duration: 60, description: 'غسيل كامل داخلي وخارجي' },
  { id: '3', name: 'تلميع', price: 150, duration: 90, description: 'تلميع كامل للسيارة' },
  { id: '4', name: 'غسيل محرك', price: 80, duration: 45, description: 'غسيل وتنظيف المحرك' },
];

const defaultBranch: Branch = {
  id: '1', name: 'الفرع الرئيسي', address: 'شارع الملك فهد', phone: '0501234567', isActive: true,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

interface AppContextType {
  branches: Branch[];
  currentBranch: Branch;
  setCurrentBranch: (b: Branch) => void;
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(() => loadFromStorage('lavage_branches', [defaultBranch]));
  const [currentBranch, setCurrentBranch] = useState<Branch>(() => branches[0]);
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('lavage_customers', []));
  const [employees, setEmployees] = useState<Employee[]>(() => loadFromStorage('lavage_employees', []));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('lavage_orders', []));
  const [services, setServices] = useState<Service[]>(() => loadFromStorage('lavage_services', defaultServices));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadFromStorage('lavage_invoices', []));

  useEffect(() => { localStorage.setItem('lavage_branches', JSON.stringify(branches)); }, [branches]);
  useEffect(() => { localStorage.setItem('lavage_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('lavage_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('lavage_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('lavage_services', JSON.stringify(services)); }, [services]);
  useEffect(() => { localStorage.setItem('lavage_invoices', JSON.stringify(invoices)); }, [invoices]);

  return (
    <AppContext.Provider value={{
      branches, setBranches, currentBranch, setCurrentBranch,
      customers, setCustomers, employees, setEmployees,
      orders, setOrders, services, setServices, invoices, setInvoices,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
