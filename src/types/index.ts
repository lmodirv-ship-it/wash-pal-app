export type OrderStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  carType: string;
  carPlate: string;
  totalVisits: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  branchId: string;
  isActive: boolean;
  hireDate: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  carType: string;
  carPlate: string;
  services: string[];
  totalPrice: number;
  status: OrderStatus;
  employeeId?: string;
  employeeName?: string;
  branchId: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  customerName: string;
  services: { name: string; price: number }[];
  totalAmount: number;
  paidAmount: number;
  isPaid: boolean;
  createdAt: string;
  branchId: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface DailyStats {
  date: string;
  revenue: number;
  ordersCount: number;
  newCustomers: number;
}
