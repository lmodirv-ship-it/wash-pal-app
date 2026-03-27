import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Branch, Customer, Employee, Order, Service, Invoice } from '@/types';

interface AppContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranch: (b: Branch) => void;
  customers: Customer[];
  employees: Employee[];
  orders: Order[];
  services: Service[];
  invoices: Invoice[];
  // CRUD methods
  addBranch: (b: Omit<Branch, 'id'>) => Promise<void>;
  updateBranch: (id: string, b: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id' | 'totalVisits' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addEmployee: (e: Omit<Employee, 'id' | 'hireDate'>) => Promise<void>;
  updateEmployee: (id: string, e: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addOrder: (o: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
  updateOrder: (id: string, o: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addService: (s: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, s: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addInvoice: (i: Omit<Invoice, 'id'>) => Promise<void>;
  refreshAll: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const mapBranch = (r: any): Branch => ({
    id: r.id, name: r.name, address: r.address, phone: r.phone, isActive: r.is_active,
  });
  const mapCustomer = (r: any): Customer => ({
    id: r.id, name: r.name, phone: r.phone, email: r.email, carType: r.car_type,
    carPlate: r.car_plate, totalVisits: r.total_visits, createdAt: r.created_at,
  });
  const mapEmployee = (r: any): Employee => ({
    id: r.id, name: r.name, phone: r.phone, role: r.role, branchId: r.branch_id,
    isActive: r.is_active, hireDate: r.hire_date,
  });
  const mapOrder = (r: any): Order => ({
    id: r.id, customerId: r.customer_id || '', customerName: r.customer_name,
    carType: r.car_type, carPlate: r.car_plate, services: r.services || [],
    totalPrice: Number(r.total_price), status: r.status, employeeId: r.employee_id,
    employeeName: r.employee_name, branchId: r.branch_id, notes: r.notes,
    createdAt: r.created_at, completedAt: r.completed_at,
  });
  const mapService = (r: any): Service => ({
    id: r.id, name: r.name, price: Number(r.price), duration: r.duration, description: r.description || '',
  });
  const mapInvoice = (r: any): Invoice => ({
    id: r.id, orderId: r.order_id, customerName: r.customer_name,
    services: r.services as any || [], totalAmount: Number(r.total_amount),
    paidAmount: Number(r.paid_amount), isPaid: r.is_paid, createdAt: r.created_at, branchId: r.branch_id,
  });

  const refreshAll = useCallback(async () => {
    const [bRes, cRes, eRes, oRes, sRes, iRes] = await Promise.all([
      supabase.from('branches').select('*').order('created_at'),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('services').select('*').order('created_at'),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    ]);
    const mappedBranches = (bRes.data || []).map(mapBranch);
    setBranches(mappedBranches);
    if (!currentBranch && mappedBranches.length > 0) setCurrentBranch(mappedBranches[0]);
    setCustomers((cRes.data || []).map(mapCustomer));
    setEmployees((eRes.data || []).map(mapEmployee));
    setOrders((oRes.data || []).map(mapOrder));
    setServices((sRes.data || []).map(mapService));
    setInvoices((iRes.data || []).map(mapInvoice));
    setLoading(false);
  }, [currentBranch]);

  useEffect(() => { refreshAll(); }, []);

  // CRUD helpers
  const addBranch = async (b: Omit<Branch, 'id'>) => {
    await supabase.from('branches').insert({ name: b.name, address: b.address, phone: b.phone, is_active: b.isActive });
    await refreshAll();
  };
  const updateBranch = async (id: string, b: Partial<Branch>) => {
    const update: any = {};
    if (b.name !== undefined) update.name = b.name;
    if (b.address !== undefined) update.address = b.address;
    if (b.phone !== undefined) update.phone = b.phone;
    if (b.isActive !== undefined) update.is_active = b.isActive;
    await supabase.from('branches').update(update).eq('id', id);
    await refreshAll();
  };
  const deleteBranch = async (id: string) => {
    await supabase.from('branches').delete().eq('id', id);
    await refreshAll();
  };

  const addCustomer = async (c: Omit<Customer, 'id' | 'totalVisits' | 'createdAt'>) => {
    await supabase.from('customers').insert({ name: c.name, phone: c.phone, email: c.email, car_type: c.carType, car_plate: c.carPlate });
    await refreshAll();
  };
  const updateCustomer = async (id: string, c: Partial<Customer>) => {
    const update: any = {};
    if (c.name !== undefined) update.name = c.name;
    if (c.phone !== undefined) update.phone = c.phone;
    if (c.email !== undefined) update.email = c.email;
    if (c.carType !== undefined) update.car_type = c.carType;
    if (c.carPlate !== undefined) update.car_plate = c.carPlate;
    await supabase.from('customers').update(update).eq('id', id);
    await refreshAll();
  };
  const deleteCustomer = async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
    await refreshAll();
  };

  const addEmployee = async (e: Omit<Employee, 'id' | 'hireDate'>) => {
    await supabase.from('employees').insert({ name: e.name, phone: e.phone, role: e.role, branch_id: e.branchId, is_active: e.isActive });
    await refreshAll();
  };
  const updateEmployee = async (id: string, e: Partial<Employee>) => {
    const update: any = {};
    if (e.name !== undefined) update.name = e.name;
    if (e.phone !== undefined) update.phone = e.phone;
    if (e.role !== undefined) update.role = e.role;
    if (e.isActive !== undefined) update.is_active = e.isActive;
    await supabase.from('employees').update(update).eq('id', id);
    await refreshAll();
  };
  const deleteEmployee = async (id: string) => {
    await supabase.from('employees').delete().eq('id', id);
    await refreshAll();
  };

  const addOrder = async (o: Omit<Order, 'id' | 'createdAt'>) => {
    await supabase.from('orders').insert({
      customer_id: o.customerId || null, customer_name: o.customerName,
      car_type: o.carType, car_plate: o.carPlate, services: o.services,
      total_price: o.totalPrice, status: o.status, employee_id: o.employeeId || null,
      employee_name: o.employeeName || null, branch_id: o.branchId, notes: o.notes || null,
    });
    await refreshAll();
  };
  const updateOrder = async (id: string, o: Partial<Order>) => {
    const update: any = {};
    if (o.status !== undefined) update.status = o.status;
    if (o.completedAt !== undefined) update.completed_at = o.completedAt;
    if (o.employeeId !== undefined) update.employee_id = o.employeeId;
    if (o.employeeName !== undefined) update.employee_name = o.employeeName;
    await supabase.from('orders').update(update).eq('id', id);
    await refreshAll();
  };
  const deleteOrder = async (id: string) => {
    await supabase.from('orders').delete().eq('id', id);
    await refreshAll();
  };

  const addService = async (s: Omit<Service, 'id'>) => {
    await supabase.from('services').insert({ name: s.name, price: s.price, duration: s.duration, description: s.description });
    await refreshAll();
  };
  const updateService = async (id: string, s: Partial<Service>) => {
    const update: any = {};
    if (s.name !== undefined) update.name = s.name;
    if (s.price !== undefined) update.price = s.price;
    if (s.duration !== undefined) update.duration = s.duration;
    if (s.description !== undefined) update.description = s.description;
    await supabase.from('services').update(update).eq('id', id);
    await refreshAll();
  };
  const deleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    await refreshAll();
  };

  const addInvoice = async (i: Omit<Invoice, 'id'>) => {
    await supabase.from('invoices').insert({
      order_id: i.orderId, customer_name: i.customerName,
      services: i.services as any, total_amount: i.totalAmount,
      paid_amount: i.paidAmount, is_paid: i.isPaid, branch_id: i.branchId,
    });
    await refreshAll();
  };

  return (
    <AppContext.Provider value={{
      branches, currentBranch, setCurrentBranch,
      customers, employees, orders, services, invoices,
      addBranch, updateBranch, deleteBranch,
      addCustomer, updateCustomer, deleteCustomer,
      addEmployee, updateEmployee, deleteEmployee,
      addOrder, updateOrder, deleteOrder,
      addService, updateService, deleteService,
      addInvoice, refreshAll, loading,
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
