import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Branch, Customer, Employee, Order, Service, Invoice, Shop } from '@/types';

interface AppContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranch: (b: Branch) => void;
  customers: Customer[];
  employees: Employee[];
  orders: Order[];
  services: Service[];
  invoices: Invoice[];
  shops: Shop[];
  addBranch: (b: Omit<Branch, 'id'>) => Promise<void>;
  updateBranch: (id: string, b: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id' | 'totalVisits' | 'createdAt' | 'reference'>) => Promise<void>;
  updateCustomer: (id: string, c: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addEmployee: (e: Omit<Employee, 'id' | 'hireDate' | 'reference'>) => Promise<void>;
  updateEmployee: (id: string, e: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addOrder: (o: Omit<Order, 'id' | 'createdAt' | 'reference'>) => Promise<void>;
  updateOrder: (id: string, o: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addService: (s: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, s: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addInvoice: (i: Omit<Invoice, 'id'>) => Promise<void>;
  addShop: (s: Omit<Shop, 'id' | 'createdAt' | 'reference' | 'remainingPoints'>) => Promise<void>;
  updateShop: (id: string, s: Partial<Shop>) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;
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
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  const mapBranch = (r: any): Branch => ({ id: r.id, name: r.name, address: r.address, phone: r.phone, isActive: r.is_active });
  const mapCustomer = (r: any): Customer => ({
    id: r.id, reference: r.reference, name: r.name, phone: r.phone, email: r.email,
    carType: r.car_type, carPlate: r.car_plate, role: r.role || 'customer',
    totalVisits: r.total_visits, createdAt: r.created_at,
  });
  const mapEmployee = (r: any): Employee => ({
    id: r.id, reference: r.reference, name: r.name, phone: r.phone, role: r.role,
    roleType: r.role_type || 'employee', branchId: r.branch_id, isActive: r.is_active, hireDate: r.hire_date,
  });
  const mapOrder = (r: any): Order => ({
    id: r.id, reference: r.reference, customerId: r.customer_id || '', customerName: r.customer_name,
    carType: r.car_type, carPlate: r.car_plate, services: r.services || [],
    totalPrice: Number(r.total_price), status: r.status, employeeId: r.employee_id,
    employeeName: r.employee_name, branchId: r.branch_id, notes: r.notes,
    createdAt: r.created_at, completedAt: r.completed_at,
  });
  const mapService = (r: any): Service => ({
    id: r.id, reference: r.reference, name: r.name, price: Number(r.price), duration: r.duration, description: r.description || '',
    isActive: r.is_active !== false,
    category: (r.category as any) || 'standard',
    startingFrom: r.starting_from === true,
  });
  const mapInvoice = (r: any): Invoice => ({
    id: r.id, orderId: r.order_id, customerName: r.customer_name,
    services: r.services as any || [], totalAmount: Number(r.total_amount),
    paidAmount: Number(r.paid_amount), isPaid: r.is_paid, createdAt: r.created_at, branchId: r.branch_id,
  });
  const mapShop = (r: any): Shop => ({
    id: r.id, reference: r.reference, name: r.name, ownerName: r.owner_name,
    address: r.address, city: r.city, phone: r.phone, email: r.email,
    registrationDate: r.registration_date, packageName: r.package_name,
    totalPoints: r.total_points, usedPoints: r.used_points,
    remainingPoints: r.remaining_points, expiryDate: r.expiry_date,
    isActive: r.is_active, notes: r.notes, createdAt: r.created_at,
  });

  const refreshAll = useCallback(async () => {
    const [bRes, cRes, eRes, oRes, sRes, iRes, shRes] = await Promise.all([
      supabase.from('branches').select('*').order('created_at'),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('services').select('*').order('created_at'),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
    ]);
    const mappedBranches = (bRes.data || []).map(mapBranch);
    setBranches(mappedBranches);
    if (!currentBranch && mappedBranches.length > 0) setCurrentBranch(mappedBranches[0]);
    setCustomers((cRes.data || []).map(mapCustomer));
    setEmployees((eRes.data || []).map(mapEmployee));
    setOrders((oRes.data || []).map(mapOrder));
    setServices((sRes.data || []).map(mapService));
    setInvoices((iRes.data || []).map(mapInvoice));
    setShops((shRes.data || []).map(mapShop));
    setLoading(false);
  }, [currentBranch]);

  useEffect(() => { refreshAll(); }, []);

  // Branch CRUD
  const addBranch = async (b: Omit<Branch, 'id'>) => {
    await supabase.from('branches').insert({ name: b.name, address: b.address, phone: b.phone, is_active: b.isActive });
    await refreshAll();
  };
  const updateBranch = async (id: string, b: Partial<Branch>) => {
    const u: any = {};
    if (b.name !== undefined) u.name = b.name;
    if (b.address !== undefined) u.address = b.address;
    if (b.phone !== undefined) u.phone = b.phone;
    if (b.isActive !== undefined) u.is_active = b.isActive;
    await supabase.from('branches').update(u).eq('id', id);
    await refreshAll();
  };
  const deleteBranch = async (id: string) => { await supabase.from('branches').delete().eq('id', id); await refreshAll(); };

  // Customer CRUD
  const addCustomer = async (c: Omit<Customer, 'id' | 'totalVisits' | 'createdAt' | 'reference'>) => {
    await supabase.from('customers').insert({ name: c.name, phone: c.phone, email: c.email, car_type: c.carType, car_plate: c.carPlate, role: c.role || 'customer' });
    await refreshAll();
  };
  const updateCustomer = async (id: string, c: Partial<Customer>) => {
    const u: any = {};
    if (c.name !== undefined) u.name = c.name;
    if (c.phone !== undefined) u.phone = c.phone;
    if (c.email !== undefined) u.email = c.email;
    if (c.carType !== undefined) u.car_type = c.carType;
    if (c.carPlate !== undefined) u.car_plate = c.carPlate;
    if (c.role !== undefined) u.role = c.role;
    await supabase.from('customers').update(u).eq('id', id);
    await refreshAll();
  };
  const deleteCustomer = async (id: string) => { await supabase.from('customers').delete().eq('id', id); await refreshAll(); };

  // Employee CRUD
  const addEmployee = async (e: Omit<Employee, 'id' | 'hireDate' | 'reference'>) => {
    await supabase.from('employees').insert({ name: e.name, phone: e.phone, role: e.role, role_type: e.roleType || 'employee', branch_id: e.branchId, is_active: e.isActive });
    await refreshAll();
  };
  const updateEmployee = async (id: string, e: Partial<Employee>) => {
    const u: any = {};
    if (e.name !== undefined) u.name = e.name;
    if (e.phone !== undefined) u.phone = e.phone;
    if (e.role !== undefined) u.role = e.role;
    if (e.roleType !== undefined) u.role_type = e.roleType;
    if (e.isActive !== undefined) u.is_active = e.isActive;
    await supabase.from('employees').update(u).eq('id', id);
    await refreshAll();
  };
  const deleteEmployee = async (id: string) => { await supabase.from('employees').delete().eq('id', id); await refreshAll(); };

  // Order CRUD
  const addOrder = async (o: Omit<Order, 'id' | 'createdAt' | 'reference'>) => {
    await supabase.from('orders').insert({
      customer_id: o.customerId || null, customer_name: o.customerName,
      car_type: o.carType, car_plate: o.carPlate, services: o.services,
      total_price: o.totalPrice, status: o.status, employee_id: o.employeeId || null,
      employee_name: o.employeeName || null, branch_id: o.branchId, notes: o.notes || null,
    });
    await refreshAll();
  };
  const updateOrder = async (id: string, o: Partial<Order>) => {
    const u: any = {};
    if (o.status !== undefined) u.status = o.status;
    if (o.completedAt !== undefined) u.completed_at = o.completedAt;
    if (o.employeeId !== undefined) u.employee_id = o.employeeId;
    if (o.employeeName !== undefined) u.employee_name = o.employeeName;
    if (o.totalPrice !== undefined) u.total_price = o.totalPrice;
    if (o.carType !== undefined) u.car_type = o.carType;
    if (o.notes !== undefined) u.notes = o.notes;
    await supabase.from('orders').update(u).eq('id', id);
    await refreshAll();
  };
  const deleteOrder = async (id: string) => { await supabase.from('orders').delete().eq('id', id); await refreshAll(); };

  // Service CRUD
  const addService = async (s: Omit<Service, 'id'>) => {
    await supabase.from('services').insert({
      name: s.name, price: s.price, duration: s.duration, description: s.description,
      is_active: s.isActive ?? true,
      category: s.category || 'standard',
      starting_from: s.startingFrom ?? false,
    } as any);
    await refreshAll();
  };
  const updateService = async (id: string, s: Partial<Service>) => {
    const u: any = {};
    if (s.name !== undefined) u.name = s.name;
    if (s.price !== undefined) u.price = s.price;
    if (s.duration !== undefined) u.duration = s.duration;
    if (s.description !== undefined) u.description = s.description;
    if (s.isActive !== undefined) u.is_active = s.isActive;
    if (s.category !== undefined) u.category = s.category;
    if (s.startingFrom !== undefined) u.starting_from = s.startingFrom;
    await supabase.from('services').update(u).eq('id', id);
    await refreshAll();
  };
  const deleteService = async (id: string) => { await supabase.from('services').delete().eq('id', id); await refreshAll(); };

  // Invoice
  const addInvoice = async (i: Omit<Invoice, 'id'>) => {
    await supabase.from('invoices').insert({
      order_id: i.orderId, customer_name: i.customerName,
      services: i.services as any, total_amount: i.totalAmount,
      paid_amount: i.paidAmount, is_paid: i.isPaid, branch_id: i.branchId,
    });
    await refreshAll();
  };

  // Shop CRUD
  const addShop = async (s: Omit<Shop, 'id' | 'createdAt' | 'reference' | 'remainingPoints'>) => {
    await supabase.from('shops').insert({
      name: s.name, owner_name: s.ownerName, address: s.address, city: s.city,
      phone: s.phone, email: s.email || null, package_name: s.packageName,
      total_points: s.totalPoints, used_points: s.usedPoints,
      expiry_date: s.expiryDate, is_active: s.isActive, notes: s.notes || null,
    });
    await refreshAll();
  };
  const updateShop = async (id: string, s: Partial<Shop>) => {
    const u: any = {};
    if (s.name !== undefined) u.name = s.name;
    if (s.ownerName !== undefined) u.owner_name = s.ownerName;
    if (s.address !== undefined) u.address = s.address;
    if (s.city !== undefined) u.city = s.city;
    if (s.phone !== undefined) u.phone = s.phone;
    if (s.email !== undefined) u.email = s.email;
    if (s.packageName !== undefined) u.package_name = s.packageName;
    if (s.totalPoints !== undefined) u.total_points = s.totalPoints;
    if (s.usedPoints !== undefined) u.used_points = s.usedPoints;
    if (s.expiryDate !== undefined) u.expiry_date = s.expiryDate;
    if (s.isActive !== undefined) u.is_active = s.isActive;
    if (s.notes !== undefined) u.notes = s.notes;
    await supabase.from('shops').update(u).eq('id', id);
    await refreshAll();
  };
  const deleteShop = async (id: string) => { await supabase.from('shops').delete().eq('id', id); await refreshAll(); };

  return (
    <AppContext.Provider value={{
      branches, currentBranch, setCurrentBranch,
      customers, employees, orders, services, invoices, shops,
      addBranch, updateBranch, deleteBranch,
      addCustomer, updateCustomer, deleteCustomer,
      addEmployee, updateEmployee, deleteEmployee,
      addOrder, updateOrder, deleteOrder,
      addService, updateService, deleteService,
      addInvoice,
      addShop, updateShop, deleteShop,
      refreshAll, loading,
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
