import { MenuItem, Order, OrderItem, Role, TableInfo, Tenant, UserAccount } from '../types';
import { INITIAL_MENU, INITIAL_ORDERS, INITIAL_TABLES, INITIAL_TENANTS, INITIAL_USERS } from '../data/initialData';
import { soundService } from '../utils/audio';
import { db, testFirestoreConnection } from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs
} from 'firebase/firestore';

const STORAGE_KEY_USERS = 'fc_users_v1';
const STORAGE_KEY_TENANTS = 'fc_tenants_v1';
const STORAGE_KEY_MENU = 'fc_menu_v1';
const STORAGE_KEY_ORDERS = 'fc_orders_v1';
const STORAGE_KEY_CURRENT_USER = 'fc_current_user_v1';
const STORAGE_KEY_CUSTOMER_ORDERS = 'fc_customer_my_orders_v1';

// BroadcastChannel for cross-tab instant synchronization
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('foodcourt_realtime_sync');
  } catch {
    broadcastChannel = null;
  }
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: string;
  orderId?: string;
  tenantId?: string;
}

type Listener = () => void;

class FoodCourtStore {
  private users: UserAccount[] = [];
  private tenants: Tenant[] = [];
  private menu: MenuItem[] = [];
  private orders: Order[] = [];
  private tables: TableInfo[] = INITIAL_TABLES;
  private currentUser: UserAccount | null = null;
  private activeRole: Role = 'customer'; // Default can be customer or kasir
  private activeTenantId: string = 'tenant-1';
  private selectedTable: string = '04';
  private notifications: AppNotification[] = [];
  private listeners: Set<Listener> = new Set();
  private isConnectedToCloud: boolean = false;

  constructor() {
    this.loadFromStorage();
    this.setupSync();
    this.initFirestoreSync();
  }

  public getIsConnectedToCloud(): boolean {
    return this.isConnectedToCloud;
  }

  private async initFirestoreSync() {
    if (typeof window === 'undefined') return;

    try {
      // Test basic connectivity to Firestore
      testFirestoreConnection().then((connected) => {
        this.isConnectedToCloud = connected;
        this.notify();
      });

      // Realtime listener for Orders collection in Firestore
      const ordersCol = collection(db, 'orders');
      onSnapshot(
        ordersCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteOrders: Order[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Order;
              if (data && data.id) {
                remoteOrders.push(data);
              }
            });

            if (remoteOrders.length > 0) {
              // Merge remote orders with local orders (avoiding duplicate IDs)
              const remoteMap = new Map(remoteOrders.map((o) => [o.id, o]));
              const localOnly = this.orders.filter((o) => !remoteMap.has(o.id));
              this.orders = [...remoteOrders, ...localOnly];
              this.saveToStorage();
              this.notify();
            }
          } else if (this.orders.length > 0) {
            // Seed initial orders to cloud if Firestore is completely empty
            this.orders.forEach((ord) => {
              this.syncOrderToFirestore(ord);
            });
          }
        },
        (error) => {
          console.warn('Firestore real-time orders snapshot warning:', error.message);
        }
      );
    } catch (e) {
      console.warn('Firestore initialization notice:', e);
    }
  }

  private async syncOrderToFirestore(order: Order) {
    if (typeof window === 'undefined') return;
    try {
      const orderRef = doc(db, 'orders', order.id);
      await setDoc(orderRef, order, { merge: true });
    } catch (err) {
      console.warn('Firestore syncOrder error (using local offline backup):', err);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      this.users = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;

      const savedTenants = localStorage.getItem(STORAGE_KEY_TENANTS);
      this.tenants = savedTenants ? JSON.parse(savedTenants) : INITIAL_TENANTS;

      const savedMenu = localStorage.getItem(STORAGE_KEY_MENU);
      this.menu = savedMenu ? JSON.parse(savedMenu) : INITIAL_MENU;

      const savedOrders = localStorage.getItem(STORAGE_KEY_ORDERS);
      this.orders = savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS;

      const savedCurr = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedCurr) {
        this.currentUser = JSON.parse(savedCurr);
        if (this.currentUser) {
          this.activeRole = this.currentUser.role;
          if (this.currentUser.tenantId) {
            this.activeTenantId = this.currentUser.tenantId;
          }
        }
      } else {
        // Default to customer experience
        this.activeRole = 'customer';
      }
    } catch {
      this.users = INITIAL_USERS;
      this.tenants = INITIAL_TENANTS;
      this.menu = INITIAL_MENU;
      this.orders = INITIAL_ORDERS;
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(this.tenants));
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(this.menu));
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch {
      // Storage error handled
    }
  }

  private setupSync() {
    if (typeof window === 'undefined') return;

    // Cross-tab broadcast listener
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === 'SYNC_STATE') {
          this.loadFromStorage();
          if (data.notification) {
            this.notifications.unshift(data.notification);
            if (this.activeRole === 'tenant' && data.notification.tenantId === this.activeTenantId) {
              soundService.playKitchenChime();
            }
          }
          this.notify();
        }
      };
    }

    // Storage event fallback
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY_ORDERS || e.key === STORAGE_KEY_TENANTS) {
        this.loadFromStorage();
        this.notify();
      }
    });
  }

  private broadcast(notification?: AppNotification) {
    this.saveToStorage();
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'SYNC_STATE',
        timestamp: Date.now(),
        notification,
      });
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ===== AUTHENTICATION =====
  public login(username: string, password: string): { success: boolean; message?: string; user?: UserAccount } {
    const user = this.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim()
    );

    if (!user) {
      return { success: false, message: 'Username atau password salah!' };
    }

    this.currentUser = user;
    this.activeRole = user.role;
    if (user.tenantId) {
      this.activeTenantId = user.tenantId;
    }
    this.saveToStorage();
    soundService.playClick();
    this.notify();
    return { success: true, user };
  }

  public logout() {
    this.currentUser = null;
    this.activeRole = 'customer'; // Revert to customer self-service
    this.saveToStorage();
    soundService.playClick();
    this.notify();
  }

  public switchRoleDirectly(role: Role, tenantId?: string) {
    this.activeRole = role;
    if (role === 'customer') {
      this.currentUser = null;
    } else if (role === 'admin') {
      const admin = this.users.find((u) => u.role === 'admin');
      if (admin) this.currentUser = admin;
    } else if (role === 'kasir') {
      const kasir = this.users.find((u) => u.role === 'kasir');
      if (kasir) this.currentUser = kasir;
    } else if (role === 'tenant') {
      const tId = tenantId || this.activeTenantId || 'tenant-1';
      this.activeTenantId = tId;
      const tUser = this.users.find((u) => u.tenantId === tId) || this.users.find((u) => u.role === 'tenant');
      if (tUser) this.currentUser = tUser;
    }
    this.saveToStorage();
    soundService.playClick();
    this.notify();
  }

  // ===== GETTERS =====
  public getUsers(): UserAccount[] {
    return this.users;
  }

  public getTenants(): Tenant[] {
    return this.tenants;
  }

  public getTenant(id: string): Tenant | undefined {
    return this.tenants.find((t) => t.id === id);
  }

  public getMenu(): MenuItem[] {
    return this.menu;
  }

  public getMenuByTenant(tenantId: string): MenuItem[] {
    return this.menu.filter((m) => m.tenantId === tenantId);
  }

  public getOrders(): Order[] {
    return [...this.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTables(): TableInfo[] {
    return this.tables;
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public getActiveRole(): Role {
    return this.activeRole;
  }

  public getActiveTenantId(): string {
    return this.activeTenantId;
  }

  public getSelectedTable(): string {
    return this.selectedTable;
  }

  public setSelectedTable(table: string) {
    this.selectedTable = table;
    this.notify();
  }

  public getNotifications(): AppNotification[] {
    return this.notifications;
  }

  public dismissNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  // ===== ADMIN ACTIONS =====
  public addTenant(
    name: string,
    category: string,
    boothNumber: string,
    phone: string,
    commissionRate: number,
    username: string,
    password: string,
    bannerImage?: string
  ): Tenant {
    const tenantId = `tenant-${Date.now()}`;
    const newTenant: Tenant = {
      id: tenantId,
      name,
      category,
      boothNumber,
      bannerImage: bannerImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      logo: '🏪',
      rating: 5.0,
      phone,
      commissionRate,
      isOpen: true,
      username,
      password,
    };

    const newUser: UserAccount = {
      id: `user-${tenantId}`,
      username,
      password,
      name: `${name} (Staff)`,
      role: 'tenant',
      tenantId,
    };

    this.tenants.push(newTenant);
    this.users.push(newUser);

    // Add a default menu item for this tenant
    const sampleMenu: MenuItem = {
      id: `menu-${Date.now()}`,
      tenantId,
      tenantName: name,
      name: `Menu Spesial ${name}`,
      description: 'Menu andalan segar berkualitas disiapkan dengan bahan pilihan.',
      price: 25000,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      category: 'makanan',
      isAvailable: true,
      isBestSeller: true,
    };
    this.menu.push(sampleMenu);

    this.broadcast();
    this.notify();
    return newTenant;
  }

  public toggleTenantStatus(tenantId: string) {
    const tenant = this.tenants.find((t) => t.id === tenantId);
    if (tenant) {
      tenant.isOpen = !tenant.isOpen;
      this.broadcast();
      this.notify();
    }
  }

  // ===== TENANT & MENU ACTIONS =====
  public toggleMenuItemAvailability(menuId: string) {
    const item = this.menu.find((m) => m.id === menuId);
    if (item) {
      item.isAvailable = !item.isAvailable;
      this.broadcast();
      this.notify();
    }
  }

  public updateMenuItemPrice(menuId: string, newPrice: number) {
    const item = this.menu.find((m) => m.id === menuId);
    if (item && newPrice > 0) {
      item.price = newPrice;
      this.broadcast();
      this.notify();
    }
  }

  public addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `menu-${Date.now()}`,
    };
    this.menu.push(newItem);
    this.broadcast();
    this.notify();
    return newItem;
  }

  public deleteMenuItem(menuId: string) {
    this.menu = this.menu.filter((m) => m.id !== menuId);
    this.broadcast();
    this.notify();
  }

  // ===== ORDER ACTIONS =====
  public createOrder(
    tableNumber: string,
    customerName: string,
    items: OrderItem[],
    createdBy: 'customer' | 'tenant' | 'kasir'
  ): Order {
    const orderNumber = 100 + this.orders.length + 1;
    const orderId = `FC-${orderNumber}`;
    const totalAmount = items.reduce((acc, item) => acc + item.subtotal, 0);

    // Group items by tenant
    const tenantStatuses: Record<string, any> = {};
    items.forEach((item) => {
      if (!tenantStatuses[item.tenantId]) {
        tenantStatuses[item.tenantId] = {
          tenantId: item.tenantId,
          tenantName: item.tenantName,
          status: 'pending_payment',
          items: [],
          subtotal: 0,
        };
      }
      tenantStatuses[item.tenantId].items.push(item);
      tenantStatuses[item.tenantId].subtotal += item.subtotal;
    });

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      createdAt: new Date().toISOString(),
      tableNumber,
      customerName: customerName || `Pelanggan Meja ${tableNumber}`,
      items,
      totalAmount,
      paymentStatus: 'unpaid',
      overallStatus: 'unpaid',
      tenantStatuses,
      createdBy,
    };

    this.orders.unshift(newOrder);
    this.syncOrderToFirestore(newOrder);

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Pesanan Baru Masuk!',
      message: `Pesanan #${orderNumber} (${tableNumber ? `Meja ${tableNumber}` : 'Takeaway'}) menunggu pembayaran di Kasir.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      orderId,
    };
    this.notifications.unshift(notif);

    this.broadcast(notif);
    this.notify();
    return newOrder;
  }

  /**
   * Cashier receives payment:
   * Sets order to Paid, calculates change, triggers chime, updates tenant statuses to 'cooking'
   */
  public payOrder(
    orderId: string,
    paymentMethod: 'cash' | 'qris' | 'debit',
    amountPaid: number,
    cashierName?: string
  ): { success: boolean; order?: Order; message?: string } {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, message: 'Pesanan tidak ditemukan!' };
    }

    if (order.paymentStatus === 'paid') {
      return { success: false, message: 'Pesanan ini sudah dibayar sebelumnya.' };
    }

    const change = Math.max(0, amountPaid - order.totalAmount);
    order.paymentStatus = 'paid';
    order.overallStatus = 'cooking';
    order.paymentMethod = paymentMethod;
    order.amountPaid = amountPaid;
    order.change = change;
    order.paymentTime = new Date().toISOString();
    order.cashierName = cashierName || (this.currentUser?.name ?? 'Kasir Food Court');

    // Update all tenant statuses to cooking
    Object.keys(order.tenantStatuses).forEach((tId) => {
      order.tenantStatuses[tId].status = 'cooking';
    });

    // Play cashier success sound
    soundService.playCashierSuccess();

    // Broadcast chime notification to tenants
    const affectedTenants = Object.values(order.tenantStatuses).map((t) => t.tenantName).join(', ');
    const notif: AppNotification = {
      id: `notif-paid-${Date.now()}`,
      title: '🔔 Pembayaran Terkonfirmasi!',
      message: `Pesanan #${order.orderNumber} (Meja ${order.tableNumber}) LUNAS! Diteruskan ke tenant: ${affectedTenants}. Segera siapkan pesanan!`,
      type: 'success',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      orderId,
    };
    this.notifications.unshift(notif);

    // Play chime immediately if currently in tenant view
    if (this.activeRole === 'tenant') {
      soundService.playKitchenChime();
    }

    this.syncOrderToFirestore(order);
    this.broadcast(notif);
    this.notify();

    return { success: true, order };
  }

  /**
   * Tenant updates their portion of the order
   */
  public updateTenantOrderStatus(orderId: string, tenantId: string, newStatus: 'cooking' | 'ready' | 'completed') {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order || !order.tenantStatuses[tenantId]) return;

    order.tenantStatuses[tenantId].status = newStatus;

    // Check overall order status
    const allStatuses = Object.values(order.tenantStatuses).map((ts) => ts.status);
    if (allStatuses.every((s) => s === 'completed')) {
      order.overallStatus = 'completed';
    } else if (allStatuses.some((s) => s === 'ready')) {
      order.overallStatus = 'ready';
    } else if (allStatuses.some((s) => s === 'cooking')) {
      order.overallStatus = 'cooking';
    }

    const tenantName = order.tenantStatuses[tenantId].tenantName;
    const statusText = newStatus === 'cooking' ? 'Sedang Dimasak' : newStatus === 'ready' ? 'Siap Diambil di Booth!' : 'Selesai';
    
    const notif: AppNotification = {
      id: `notif-status-${Date.now()}`,
      title: `Status #${order.orderNumber}: ${tenantName}`,
      message: `Menu dari ${tenantName} untuk Meja ${order.tableNumber} kini berstatus: ${statusText}.`,
      type: newStatus === 'ready' ? 'success' : 'info',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      orderId,
      tenantId,
    };
    this.notifications.unshift(notif);

    this.syncOrderToFirestore(order);
    soundService.playClick();
    this.broadcast(notif);
    this.notify();
  }

  // ===== CUSTOMER DEVICE LOCAL PERSISTENCE =====
  /**
   * Save customer order ID to this specific device (localStorage)
   */
  public saveCustomerOrderToDevice(orderId: string) {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOMER_ORDERS);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(orderId)) {
        list.unshift(orderId);
        localStorage.setItem(STORAGE_KEY_CUSTOMER_ORDERS, JSON.stringify(list));
      }
    } catch {
      // Storage error ignored
    }
  }

  /**
   * Get all order IDs created by this device
   */
  public getCustomerDeviceOrderIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOMER_ORDERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get all full Order objects that belong to this customer device
   */
  public getCustomerDeviceOrders(): Order[] {
    const ids = this.getCustomerDeviceOrderIds();
    return this.orders.filter((o) => ids.includes(o.id));
  }

  public resetToSampleData() {
    this.users = INITIAL_USERS;
    this.tenants = INITIAL_TENANTS;
    this.menu = INITIAL_MENU;
    this.orders = INITIAL_ORDERS;
    this.currentUser = null;
    this.activeRole = 'customer';
    this.saveToStorage();
    this.notify();
  }
}

export const store = new FoodCourtStore();

// Global currency formatter
export const formatIDR = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};
