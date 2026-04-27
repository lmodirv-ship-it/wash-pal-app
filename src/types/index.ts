export type OrderStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'employee' | 'customer';

export type ServiceCategory = 'standard' | 'vip' | 'extra' | 'packs' | 'motor' | 'premium';

export interface Service {
  id: string;
  reference?: string;
  name: string;
  nameAr?: string;
  nameFr?: string;
  nameEn?: string;
  price: number;
  duration: number;
  description: string;
  descriptionAr?: string;
  descriptionFr?: string;
  descriptionEn?: string;
  isActive: boolean;
  category: ServiceCategory;
  startingFrom: boolean;
  shopId?: string;
}

export interface Customer {
  id: string;
  reference?: string;
  name: string;
  phone: string;
  email?: string;
  carType: string;
  carPlate: string;
  role: string;
  totalVisits: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  reference?: string;
  name: string;
  phone: string;
  role: string;
  roleType: string;
  branchId: string;
  isActive: boolean;
  hireDate: string;
}

export interface Order {
  id: string;
  reference?: string;
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
  startAt?: string;
  expectedEndAt?: string;
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

// Tenant shop (multi-tenant SaaS)
export interface Shop {
  id: string;
  name: string;
  ownerId: string;
  createdBy: string;
  createdAt: string;
}

// B2B partner subscription (formerly "shops")
export interface B2BPartner {
  id: string;
  reference?: string;
  name: string;
  ownerName: string;
  address: string;
  city: string;
  phone: string;
  email?: string;
  registrationDate: string;
  packageName: string;
  totalPoints: number;
  usedPoints: number;
  remainingPoints: number;
  expiryDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  shopId?: string;
}

export interface DailyStats {
  date: string;
  revenue: number;
  ordersCount: number;
  newCustomers: number;
}
