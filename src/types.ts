export type Role = 'admin' | 'kasir' | 'tenant' | 'customer';

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Plaintext for demo food court simulation
  name: string;
  role: Role;
  tenantId?: string; // If role is tenant
}

export interface Tenant {
  id: string;
  name: string;
  category: string;
  boothNumber: string;
  bannerImage: string;
  logo: string;
  rating: number;
  phone: string;
  commissionRate: number; // e.g. 10%
  isOpen: boolean;
  username: string;
  password: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'makanan' | 'minuman' | 'snack';
  isAvailable: boolean;
  isBestSeller?: boolean;
  spicyLevelAvailable?: boolean;
  options?: MenuItemOption[];
}

export interface SelectedOption {
  optionId: string;
  name: string;
  price: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  tenantId: string;
  tenantName: string;
  notes?: string;
  spicyLevel?: number;
  selectedOptions?: SelectedOption[];
  subtotal: number;
}

export type OrderStatus = 'unpaid' | 'paid' | 'cooking' | 'ready' | 'completed' | 'cancelled';

export interface TenantOrderStatus {
  tenantId: string;
  tenantName: string;
  status: 'pending_payment' | 'cooking' | 'ready' | 'completed';
  items: OrderItem[];
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string; // e.g. FC-101
  orderNumber: number;
  createdAt: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid';
  overallStatus: OrderStatus;
  paymentMethod?: 'cash' | 'qris' | 'debit';
  paymentTime?: string;
  amountPaid?: number;
  change?: number;
  cashierName?: string;
  tenantStatuses: Record<string, TenantOrderStatus>; // Key: tenantId
  createdBy: 'customer' | 'tenant' | 'kasir';
}

export interface TableInfo {
  number: string;
  qrCodeUrl?: string;
}
