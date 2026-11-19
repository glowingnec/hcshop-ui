import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AccountLockHistory,
  CartItem,
  Category,
  DiscountType,
  Gender,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  Review,
  ShippingAddress,
  StockHistory,
  User,
  UserRole,
  Voucher,
} from '../types/domain';
import {
  createPlaceholderImage,
  SEED_ACCOUNT_LOCK_HISTORIES,
  SEED_ADDRESSES,
  SEED_CATEGORIES,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_REVIEWS,
  SEED_STOCK_HISTORIES,
  SEED_USERS,
  SEED_VOUCHERS,
} from '../data/mockData';
import { isAddressInDeliveryZone } from '../data/vnLocations';
import { formatVND, ROLE_LABELS } from '../utils/formatters';

interface VoucherValidationResult {
  ok: boolean;
  voucher?: Voucher;
  discountAmount: number;
  message: string;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  accountLockHistories: AccountLockHistory[];
  categories: Category[];
  products: Product[];
  stockHistories: StockHistory[];
  vouchers: Voucher[];
  orders: Order[];
  reviews: Review[];
  addresses: ShippingAddress[];
  cart: CartItem[];
  wishlistProductIds: string[];
  searchQuery: string;
  selectedCategoryId: string;

  // Actions
  setSearchQuery: (q: string) => void;
  setSelectedCategoryId: (id: string) => void;
  switchDemoRole: (roleOrGuest: UserRole | 'GUEST') => void;
  resetDemoData: () => void;

  // Cart & Wishlist (UC-29..33)
  addToCart: (productId: string, quantity?: number) => { ok: boolean; message: string };
  updateCartQuantity: (
    productId: string,
    newQuantity: number
  ) => { ok: boolean; confirmRemove?: boolean; message: string };
  removeFromCart: (productId: string) => { ok: boolean; message: string };
  toggleWishlist: (productId: string) => { added: boolean; message: string };

  // Addresses, Vouchers & Atomic Checkout (UC-34..37, UC-40)
  addShippingAddress: (
    input: Omit<ShippingAddress, 'id' | 'userId'>
  ) => { ok: boolean; address?: ShippingAddress; message: string };
  updateShippingAddress: (
    id: string,
    input: Omit<ShippingAddress, 'id' | 'userId'>
  ) => { ok: boolean; message: string };
  deleteShippingAddress: (id: string) => { ok: boolean; message: string };
  setDefaultShippingAddress: (id: string) => { ok: boolean; message: string };
  validateVoucherCode: (code: string, subtotal: number) => VoucherValidationResult;
  placeOrder: (params: {
    addressId: string;
    paymentMethod: PaymentMethod;
    voucherCode?: string;
  }) => { ok: boolean; order?: Order; message: string };
  cancelCustomerOrder: (
    orderId: string,
    cancelReason: string
  ) => { ok: boolean; message: string };

  // Auth & Profile (UC-01..06)
  loginUser: (
    identifier: string,
    password: string
  ) => { ok: boolean; user?: User; message: string };
  registerUser: (input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => { ok: boolean; user?: User; message: string };
  logoutUser: () => void;
  lookupUserForRecovery: (
    identifier: string
  ) => {
    ok: boolean;
    user?: User;
    securityQuestion?: string;
    isLockedOut?: boolean;
    message: string;
  };
  resetPasswordBySecurityAnswer: (params: {
    userId: string;
    answer: string;
    newPassword: string;
    confirmPassword: string;
  }) => { ok: boolean; isLockedOut?: boolean; message: string };
  changePassword: (params: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => { ok: boolean; message: string };
  updateSecurityQuestion: (params: {
    currentPassword: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => { ok: boolean; message: string };
  updateProfile: (params: {
    fullName: string;
    phone: string;
    dob?: string;
    gender?: Gender;
    avatar?: string;
  }) => { ok: boolean; message: string };

  // Reviews (UC-53..56)
  submitReview: (
    productId: string,
    rating: number,
    comment: string,
    images?: string[],
    orderId?: string
  ) => { ok: boolean; message: string };
  deleteReview: (reviewId: string) => { ok: boolean; message: string };
  toggleReviewLike: (reviewId: string) => { ok: boolean; message: string };

  // Staff / Admin Order Processing
  staffConfirmOrRejectOrder: (
    orderId: string,
    action: 'CONFIRM' | 'REJECT',
    reasonOrNote?: string
  ) => { ok: boolean; message: string };
  staffAdvanceOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    note?: string
  ) => { ok: boolean; message: string };

  // Admin Category & Product Management
  createCategory: (input: {
    name: string;
    description: string;
    imageUrl?: string;
    isVisible?: boolean;
  }) => { ok: boolean; message: string };
  updateCategory: (
    id: string,
    input: { name: string; description: string; imageUrl?: string }
  ) => { ok: boolean; message: string };
  toggleCategoryVisibility: (id: string) => { ok: boolean; message: string };
  deleteCategory: (id: string) => { ok: boolean; message: string };

  createProduct: (input: {
    code: string;
    name: string;
    categoryId: string;
    price: number;
    description: string;
    imageUrl?: string;
    minStockThreshold: number;
    initialStock: number;
    isVisible?: boolean;
  }) => { ok: boolean; message: string };
  updateProduct: (
    id: string,
    input: {
      name: string;
      categoryId: string;
      price: number;
      description: string;
      imageUrl?: string;
    }
  ) => { ok: boolean; message: string };
  toggleProductVisibility: (id: string) => { ok: boolean; message: string };
  deleteProduct: (id: string) => { ok: boolean; message: string };

  // Admin Inventory Management
  importStock: (params: {
    productId: string;
    quantity: number;
    importPrice?: number;
    supplier?: string;
    note: string;
  }) => { ok: boolean; message: string };
  adjustStockDecrease: (params: {
    productId: string;
    quantityToSubtract: number;
    reason: string;
  }) => { ok: boolean; message: string };
  updateMinStockThreshold: (
    productId: string,
    threshold: number
  ) => { ok: boolean; message: string };

  // Admin Voucher Management
  createVoucher: (input: {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderValue: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    isActive?: boolean;
  }) => { ok: boolean; message: string };
  updateVoucher: (
    id: string,
    input: {
      code: string;
      description?: string;
      discountType: DiscountType;
      discountValue: number;
      maxDiscountAmount?: number;
      minOrderValue: number;
      startDate: string;
      endDate: string;
      usageLimit: number;
    }
  ) => { ok: boolean; message: string };
  toggleVoucherActive: (id: string) => { ok: boolean; message: string };
  deleteVoucher: (id: string) => { ok: boolean; message: string };

  // Staff / Admin Review Moderation
  replyToReview: (
    reviewId: string,
    replyContent: string
  ) => { ok: boolean; message: string };
  adminDeleteReview: (
    reviewId: string,
    reason: string
  ) => { ok: boolean; message: string };

  // Admin Account Management
  toggleAccountLock: (
    userId: string,
    lockReason?: string
  ) => { ok: boolean; message: string };
}

const STORAGE_KEY = 'hcshop_state_v7';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [accountLockHistories, setAccountLockHistories] = useState<AccountLockHistory[]>(
    SEED_ACCOUNT_LOCK_HISTORIES
  );
  const [currentUser, setCurrentUser] = useState<User | null>(SEED_USERS[2]);
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS);
  const [stockHistories, setStockHistories] = useState<StockHistory[]>(SEED_STOCK_HISTORIES);
  const [vouchers, setVouchers] = useState<Voucher[]>(SEED_VOUCHERS);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS);
  const [addresses, setAddresses] = useState<ShippingAddress[]>(SEED_ADDRESSES);
  const [cart, setCart] = useState<CartItem[]>([
    { productId: 'prd-1', quantity: 1, addedPrice: 2100000 },
    { productId: 'prd-2', quantity: 1, addedPrice: 1450000 },
  ]);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(['prd-2', 'prd-5']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.accountLockHistories) setAccountLockHistories(parsed.accountLockHistories);
        if (parsed.currentUser !== undefined) setCurrentUser(parsed.currentUser);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.stockHistories) setStockHistories(parsed.stockHistories);
        if (parsed.vouchers) setVouchers(parsed.vouchers);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.reviews) setReviews(parsed.reviews);
        if (parsed.addresses) setAddresses(parsed.addresses);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.wishlistProductIds) setWishlistProductIds(parsed.wishlistProductIds);
      }
    } catch {
      // Ignore invalid localStorage
    }
  }, []);

  // Save state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users,
          accountLockHistories,
          currentUser,
          categories,
          products,
          stockHistories,
          vouchers,
          orders,
          reviews,
          addresses,
          cart,
          wishlistProductIds,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [
    users,
    accountLockHistories,
    currentUser,
    categories,
    products,
    stockHistories,
    vouchers,
    orders,
    reviews,
    addresses,
    cart,
    wishlistProductIds,
  ]);

  const switchDemoRole = (roleOrGuest: UserRole | 'GUEST') => {
    if (roleOrGuest === 'GUEST') {
      setCurrentUser(null);
      return;
    }
    const found = users.find((u) => u.role === roleOrGuest && !u.isLocked);
    if (found) setCurrentUser(found);
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUsers(SEED_USERS);
    setAccountLockHistories(SEED_ACCOUNT_LOCK_HISTORIES);
    setCurrentUser(SEED_USERS[2]);
    setCategories(SEED_CATEGORIES);
    setProducts(SEED_PRODUCTS);
    setStockHistories(SEED_STOCK_HISTORIES);
    setVouchers(SEED_VOUCHERS);
    setOrders(SEED_ORDERS);
    setReviews(SEED_REVIEWS);
    setAddresses(SEED_ADDRESSES);
    setCart([
      { productId: 'prd-1', quantity: 1, addedPrice: 2100000 },
      { productId: 'prd-2', quantity: 1, addedPrice: 1450000 },
    ]);
    setWishlistProductIds(['prd-2', 'prd-5']);
  };

  // UC-30: Thêm vào giỏ hàng
  const addToCart = (productId: string, quantity = 1) => {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      return { ok: false, message: 'Số lượng không hợp lệ.' };
    }
    const product = products.find((p) => p.id === productId);
    if (!product || !product.isVisible || product.isDeleted) {
      return { ok: false, message: 'Sản phẩm không khả dụng.' };
    }
    if (product.stock <= 0) {
      return { ok: false, message: 'Sản phẩm đã hết hàng.' };
    }
    const existing = cart.find((c) => c.productId === productId);
    const currentQty = existing ? existing.quantity : 0;
    const targetQty = currentQty + quantity;

    if (targetQty > product.stock) {
      setCart((prev) => {
        const others = prev.filter((c) => c.productId !== productId);
        return [...others, { productId, quantity: product.stock, addedPrice: product.price }];
      });
      return {
        ok: true,
        message: `Số lượng vượt tồn kho. Đã điều chỉnh về tối đa (${product.stock}).`,
      };
    }

    setCart((prev) => {
      const others = prev.filter((c) => c.productId !== productId);
      return [...others, { productId, quantity: targetQty, addedPrice: product.price }];
    });
    return { ok: true, message: `Đã thêm ${quantity} x ${product.name} vào giỏ.` };
  };

  // UC-31: Chỉnh sửa số lượng trong giỏ hàng
  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (Number.isNaN(newQuantity) || !Number.isInteger(newQuantity) || newQuantity < 0) {
      return { ok: false, message: 'Số lượng không hợp lệ.' };
    }
    if (newQuantity === 0) {
      return {
        ok: false,
        confirmRemove: true,
        message: 'Số lượng bằng 0 — vui lòng xác nhận xóa sản phẩm khỏi giỏ.',
      };
    }
    const product = products.find((p) => p.id === productId);
    if (!product || !product.isVisible || product.isDeleted || product.stock <= 0) {
      return { ok: false, message: 'Sản phẩm hiện không còn khả dụng.' };
    }
    if (newQuantity > product.stock) {
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: product.stock } : item
        )
      );
      return {
        ok: true,
        message: `Số lượng vượt tồn kho. Đã đặt về mức tối đa còn lại (${product.stock}).`,
      };
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
    return { ok: true, message: 'Đã cập nhật số lượng.' };
  };

  // UC-32: Xóa sản phẩm khỏi giỏ hàng
  const removeFromCart = (productId: string) => {
    const exists = cart.some((c) => c.productId === productId);
    if (!exists) {
      return { ok: false, message: 'Sản phẩm không còn trong giỏ hàng.' };
    }
    setCart((prev) => prev.filter((c) => c.productId !== productId));
    return { ok: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng.' };
  };

  // UC-33: Yêu thích
  const toggleWishlist = (productId: string) => {
    const exists = wishlistProductIds.includes(productId);
    if (exists) {
      setWishlistProductIds((prev) => prev.filter((id) => id !== productId));
      return { added: false, message: 'Đã bỏ lưu sản phẩm.' };
    } else {
      setWishlistProductIds((prev) => [...prev, productId]);
      return { added: true, message: 'Đã lưu sản phẩm vào yêu thích.' };
    }
  };

  // UC-07 & UC-34 3a: Thêm địa chỉ nhận hàng mới
  const addShippingAddress = (input: Omit<ShippingAddress, 'id' | 'userId'>) => {
    if (!currentUser) {
      return { ok: false, message: 'Vui lòng đăng nhập.' };
    }
    if (
      !input.recipientName.trim() ||
      !input.phone.trim() ||
      !input.province.trim() ||
      !input.district.trim() ||
      !input.ward.trim() ||
      !input.detailAddress.trim()
    ) {
      return { ok: false, message: 'Vui lòng điền đầy đủ thông tin địa chỉ bắt buộc.' };
    }

    const userAddresses = addresses.filter((a) => a.userId === currentUser.id);
    if (userAddresses.length >= 10) {
      return { ok: false, message: 'Đã đạt giới hạn số địa chỉ tối đa (10 địa chỉ).' };
    }

    const shouldBeDefault = input.isDefault || userAddresses.length === 0;
    const newAddr: ShippingAddress = {
      ...input,
      id: `addr-${Date.now()}`,
      userId: currentUser.id,
      isDefault: shouldBeDefault,
    };

    setAddresses((prev) => {
      const updated = shouldBeDefault
        ? prev.map((a) => (a.userId === currentUser.id ? { ...a, isDefault: false } : a))
        : prev;
      return [...updated, newAddr];
    });

    return { ok: true, address: newAddr, message: 'Đã thêm địa chỉ nhận hàng mới.' };
  };

  // UC-35: Thẩm định 5 điều kiện Mã giảm giá
  const validateVoucherCode = (code: string, subtotal: number): VoucherValidationResult => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { ok: false, discountAmount: 0, message: 'Vui lòng nhập mã giảm giá.' };
    }

    const voucher = vouchers.find(
      (v) => !v.isDeleted && v.code.toUpperCase() === normalized
    );
    // 1. Mã tồn tại & đang bật (2a)
    if (!voucher || !voucher.isActive || voucher.isDeleted) {
      return { ok: false, discountAmount: 0, message: 'Mã giảm giá không hợp lệ hoặc đã ngừng áp dụng.' };
    }

    // 2. Thời hạn hiệu lực (2b)
    const now = Date.now();
    const start = new Date(voucher.startDate).getTime();
    const end = new Date(voucher.endDate).getTime();
    if (now < start) {
      return { ok: false, discountAmount: 0, message: 'Mã giảm giá chưa đến thời gian áp dụng.' };
    }
    if (now > end) {
      return { ok: false, discountAmount: 0, message: 'Mã giảm giá đã hết hạn sử dụng.' };
    }

    // 3. Số lượt còn lại (2c)
    if (voucher.usedCount >= voucher.usageLimit) {
      return { ok: false, discountAmount: 0, message: 'Mã giảm giá đã hết lượt sử dụng.' };
    }

    // 4. Giá trị đơn tối thiểu (2d)
    if (subtotal < voucher.minOrderValue) {
      return {
        ok: false,
        discountAmount: 0,
        message: `Đơn hàng chưa đạt giá trị tối thiểu ${formatVND(voucher.minOrderValue)}.`,
      };
    }

    // 5. Tính mức giảm (Phần trăm có trần tối đa hoặc cố định)
    let discountAmount = 0;
    if (voucher.discountType === 'PhanTram') {
      discountAmount = Math.round((subtotal * voucher.discountValue) / 100);
      if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
        discountAmount = voucher.maxDiscountAmount;
      }
    } else {
      discountAmount = voucher.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      ok: true,
      voucher,
      discountAmount,
      message: `Áp dụng mã ${voucher.code} thành công (-${formatVND(discountAmount)}).`,
    };
  };

  // UC-37 & UC-40: Đặt hàng nguyên tử (Atomic Checkout)
  const placeOrder = ({
    addressId,
    paymentMethod,
    voucherCode,
  }: {
    addressId: string;
    paymentMethod: PaymentMethod;
    voucherCode?: string;
  }) => {
    if (!currentUser) {
      return { ok: false, message: 'Vui lòng đăng nhập trước khi đặt hàng.' };
    }

    const selectedAddress = addresses.find(
      (a) => a.id === addressId && a.userId === currentUser.id
    );
    if (!selectedAddress) {
      return { ok: false, message: 'Vui lòng chọn địa chỉ nhận hàng.' };
    }
    if (!isAddressInDeliveryZone(selectedAddress.province, selectedAddress.district)) {
      return {
        ok: false,
        message: 'Địa chỉ nằm ngoài khu vực giao hàng hỗ trợ. Vui lòng chọn địa chỉ khác.',
      };
    }

    // Lọc các sản phẩm khả dụng trong giỏ
    const validCartItems = cart.filter((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return p && p.isVisible && !p.isDeleted && p.stock > 0;
    });

    if (validCartItems.length === 0) {
      return { ok: false, message: 'Giỏ hàng không có sản phẩm khả dụng để đặt.' };
    }

    // Kiểm tra tồn kho nguyên tử (UC-37 2a)
    for (const item of validCartItems) {
      const p = products.find((prod) => prod.id === item.productId);
      if (!p || p.stock < item.quantity) {
        return {
          ok: false,
          message: `Sản phẩm "${p?.name || item.productId}" không đủ tồn kho (chỉ còn ${
            p?.stock || 0
          }). Giao dịch đã được Rollback.`,
        };
      }
    }

    const subtotal = validCartItems.reduce((sum, item) => {
      const p = products.find((prod) => prod.id === item.productId)!;
      return sum + p.price * item.quantity;
    }, 0);

    // Kiểm tra giới hạn COD (UC-36 1a)
    if (paymentMethod === 'KhiNhanHang' && subtotal > 20000000) {
      return {
        ok: false,
        message: 'Thanh toán khi nhận hàng (COD) chỉ áp dụng cho đơn từ 20.000.000đ trở xuống.',
      };
    }

    // Kiểm tra lại mã giảm giá (UC-37 2c)
    let discountAmount = 0;
    let appliedVoucher: Voucher | undefined;
    if (voucherCode) {
      const vRes = validateVoucherCode(voucherCode, subtotal);
      if (!vRes.ok) {
        return { ok: false, message: `Mã giảm giá không còn hợp lệ: ${vRes.message}` };
      }
      discountAmount = vRes.discountAmount;
      appliedVoucher = vRes.voucher;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const nowIso = new Date().toISOString();
    const orderCode = `ORD-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      code: orderCode,
      userId: currentUser.id,
      customerName: currentUser.fullName,
      status: 'ChoXacNhan',
      items: validCartItems.map((item) => {
        const p = products.find((prod) => prod.id === item.productId)!;
        return {
          productId: p.id,
          productName: p.name,
          productImage: p.imageUrl,
          quantity: item.quantity,
          priceAtOrder: p.price,
        };
      }),
      shippingAddress: selectedAddress,
      paymentMethod,
      voucherId: appliedVoucher?.id,
      voucherCode: appliedVoucher?.code,
      discountAmount,
      subtotal,
      totalAmount,
      isPaid: paymentMethod !== 'KhiNhanHang',
      timeline: [
        {
          status: 'ChoXacNhan',
          timestamp: nowIso,
          note: 'Khách hàng đặt đơn thành công — Chờ xác nhận',
          actorName: currentUser.fullName,
        },
      ],
      createdAt: nowIso,
    };

    // 1. Trừ tồn kho & Tạo lịch sử biến động kho (StockHistories)
    const newHistories: StockHistory[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        const ordered = validCartItems.find((c) => c.productId === p.id);
        if (!ordered) return p;
        const nextStock = p.stock - ordered.quantity;
        newHistories.push({
          id: `sh-${Date.now()}-${p.id}`,
          productId: p.id,
          orderId: newOrder.id,
          orderCode,
          type: 'XuatBan',
          quantityChange: -ordered.quantity,
          stockBefore: p.stock,
          stockAfter: nextStock,
          reasonOrNote: `Xuất bán theo đơn hàng #${orderCode}`,
          actorName: 'Hệ thống (Atomic Checkout)',
          createdAt: nowIso,
        });
        return {
          ...p,
          stock: nextStock,
          lastSoldAt: nowIso,
        };
      })
    );

    setStockHistories((prev) => [...newHistories, ...prev]);

    // 2. Trừ lượt mã giảm giá (nếu có)
    if (appliedVoucher) {
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === appliedVoucher.id ? { ...v, usedCount: v.usedCount + 1 } : v
        )
      );
    }

    // 3. Lưu đơn hàng & Làm trống các sản phẩm đã đặt khỏi giỏ
    setOrders((prev) => [newOrder, ...prev]);
    const orderedIds = new Set(validCartItems.map((i) => i.productId));
    setCart((prev) => prev.filter((i) => !orderedIds.has(i.productId)));

    return {
      ok: true,
      order: newOrder,
      message: `Đặt hàng thành công! Mã đơn hàng: #${orderCode}`,
    };
  };

  // UC-53 & UC-54: Đánh giá sản phẩm (UQ_DanhGia_DonHang_SanPham: 1 đánh giá / (DonHang, SanPham))
  const BANNED_REVIEW_PATTERNS = [
    /\b(lừa đảo|lua dao|đồ rác|do rac|vô học|vo hoc|đm|dm|vcl|cc|cứt|cut)\b/i,
    /(https?:\/\/|www\.)\S+/i,
  ];

  const submitReview = (
    productId: string,
    rating: number,
    comment: string,
    images?: string[],
    orderId?: string
  ) => {
    if (!currentUser) {
      return { ok: false, message: 'Vui lòng đăng nhập để đánh giá sản phẩm.' };
    }
    if (rating < 1 || rating > 5) {
      return { ok: false, message: 'Vui lòng chọn số sao từ 1 đến 5.' };
    }
    const trimmed = comment.trim();
    if (!trimmed) {
      return { ok: false, message: 'Vui lòng nhập nội dung nhận xét.' };
    }
    if (trimmed.length > 2000) {
      return { ok: false, message: 'Nội dung nhận xét không vượt quá 2000 ký tự.' };
    }
    // UC-53 4b: Kiểm duyệt từ ngữ cấm / liên kết quảng cáo spam
    if (BANNED_REVIEW_PATTERNS.some((rx) => rx.test(trimmed))) {
      return {
        ok: false,
        message:
          'Nội dung đánh giá chứa từ ngữ không phù hợp hoặc đường dẫn spam. Vui lòng chỉnh sửa lại.',
      };
    }

    const cleanImages = images && images.length > 0 ? images : undefined;

    // Tất cả đơn hàng đã hoàn thành có chứa sản phẩm này của khách hàng
    const completedOrders = orders.filter(
      (o) =>
        o.userId === currentUser.id &&
        o.status === 'HoanThanh' &&
        o.items.some((item) => item.productId === productId)
    );

    // Xác định cặp (orderId, productId) đích theo UQ_DanhGia_DonHang_SanPham
    let targetOrderId = orderId;
    if (targetOrderId) {
      const validOrder = completedOrders.find((o) => o.id === targetOrderId);
      if (!validOrder) {
        return {
          ok: false,
          message:
            'Chỉ đơn hàng đã hoàn thành có chứa sản phẩm này mới được phép gửi đánh giá.',
        };
      }
    } else {
      // Nếu không truyền orderId cụ thể: ưu tiên đơn hoàn thành chưa đánh giá; nếu tất cả đã đánh giá thì sửa đơn gần nhất
      const unreviewedOrder = completedOrders.find(
        (o) =>
          !reviews.some(
            (r) =>
              r.orderId === o.id &&
              r.productId === productId &&
              r.userId === currentUser.id
          )
      );
      targetOrderId = unreviewedOrder?.id || completedOrders[0]?.id;
    }

    const existing = targetOrderId
      ? reviews.find(
          (r) =>
            r.orderId === targetOrderId &&
            r.productId === productId &&
            r.userId === currentUser.id
        )
      : reviews.find((r) => r.productId === productId && r.userId === currentUser.id);

    if (existing) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                rating,
                comment: trimmed,
                images: images !== undefined ? cleanImages : r.images,
                isEdited: true,
              }
            : r
        )
      );
      return { ok: true, message: 'Đã cập nhật đánh giá của bạn.' };
    }

    if (!targetOrderId) {
      return {
        ok: false,
        message: 'Chỉ khách hàng đã mua và hoàn thành đơn hàng mới có thể đánh giá sản phẩm này.',
      };
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      productId,
      orderId: targetOrderId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userAvatar: currentUser.avatar,
      rating,
      comment: trimmed,
      images: cleanImages,
      isEdited: false,
      likedByUserIds: [],
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);
    return { ok: true, message: 'Cảm ơn bạn đã gửi đánh giá sản phẩm!' };
  };

  const deleteReview = (reviewId: string) => {
    if (!currentUser) {
      return { ok: false, message: 'Vui lòng đăng nhập.' };
    }
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) {
      return { ok: false, message: 'Đánh giá không còn tồn tại.' };
    }
    if (currentUser.role !== 'QuanLy' && target.userId !== currentUser.id) {
      return { ok: false, message: 'Bạn chỉ có thể xóa đánh giá của chính mình.' };
    }
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    return { ok: true, message: 'Đã xóa đánh giá.' };
  };

  const toggleReviewLike = (reviewId: string) => {
    if (!currentUser) {
      return { ok: false, message: 'Vui lòng đăng nhập để thích đánh giá.' };
    }
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) {
      return { ok: false, message: 'Đánh giá không tồn tại.' };
    }
    if (target.userId === currentUser.id) {
      return { ok: false, message: 'Bạn không thể tự thích đánh giá của chính mình.' };
    }

    const alreadyLiked = target.likedByUserIds.includes(currentUser.id);
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        const nextLikes = alreadyLiked
          ? r.likedByUserIds.filter((id) => id !== currentUser.id)
          : [...r.likedByUserIds, currentUser.id];
        return { ...r, likedByUserIds: nextLikes };
      })
    );

    return {
      ok: true,
      message: alreadyLiked ? 'Đã bỏ thích đánh giá.' : 'Đã đánh dấu đánh giá là hữu ích.',
    };
  };

  // UC-07: Cập nhật / Xóa / Đặt mặc định địa chỉ nhận hàng
  const updateShippingAddress = (
    id: string,
    input: Omit<ShippingAddress, 'id' | 'userId'>
  ) => {
    if (!currentUser) return { ok: false, message: 'Vui lòng đăng nhập.' };
    if (
      !input.recipientName.trim() ||
      !input.phone.trim() ||
      !input.province.trim() ||
      !input.district.trim() ||
      !input.ward.trim() ||
      !input.detailAddress.trim()
    ) {
      return { ok: false, message: 'Vui lòng điền đầy đủ thông tin địa chỉ bắt buộc.' };
    }

    setAddresses((prev) =>
      prev.map((a) => {
        if (a.userId !== currentUser.id) return a;
        if (a.id === id) {
          return { ...a, ...input, id, userId: currentUser.id };
        }
        return input.isDefault ? { ...a, isDefault: false } : a;
      })
    );

    return { ok: true, message: 'Đã cập nhật địa chỉ nhận hàng.' };
  };

  const deleteShippingAddress = (id: string) => {
    if (!currentUser) return { ok: false, message: 'Vui lòng đăng nhập.' };
    const target = addresses.find((a) => a.id === id && a.userId === currentUser.id);
    if (!target) return { ok: false, message: 'Địa chỉ không tồn tại.' };

    setAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== id);
      if (target.isDefault) {
        const firstUserAddrIdx = remaining.findIndex((a) => a.userId === currentUser.id);
        if (firstUserAddrIdx !== -1) {
          remaining[firstUserAddrIdx] = {
            ...remaining[firstUserAddrIdx],
            isDefault: true,
          };
        }
      }
      return [...remaining];
    });

    return { ok: true, message: 'Đã xóa địa chỉ khỏi sổ địa chỉ.' };
  };

  const setDefaultShippingAddress = (id: string) => {
    if (!currentUser) return { ok: false, message: 'Vui lòng đăng nhập.' };
    setAddresses((prev) =>
      prev.map((a) =>
        a.userId === currentUser.id ? { ...a, isDefault: a.id === id } : a
      )
    );
    return { ok: true, message: 'Đã đặt làm địa chỉ nhận hàng mặc định.' };
  };

  // UC-41: Khách hàng hủy đơn hàng (Atomic Rollback: hoàn tồn kho + StockHistory + hoàn lượt Voucher)
  const cancelCustomerOrder = (orderId: string, cancelReason: string) => {
    if (!currentUser) return { ok: false, message: 'Vui lòng đăng nhập.' };
    const order = orders.find((o) => o.id === orderId && o.userId === currentUser.id);
    if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng.' };

    if (order.status !== 'ChoXacNhan' && order.status !== 'DaXacNhan') {
      return {
        ok: false,
        message:
          'Chỉ có thể hủy đơn hàng khi đang ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận".',
      };
    }

    const reason = cancelReason.trim();
    if (!reason) {
      return { ok: false, message: 'Vui lòng chọn hoặc nhập lý do hủy đơn hàng.' };
    }

    const nowIso = new Date().toISOString();

    // 1. Hoàn lại tồn kho & Ghi lịch sử kho HoanDon
    const restoreLogs: StockHistory[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const nextStock = p.stock + item.quantity;
        restoreLogs.push({
          id: `sh-cancel-${Date.now()}-${p.id}`,
          productId: p.id,
          orderId: order.id,
          orderCode: order.code,
          type: 'HoanDon',
          quantityChange: item.quantity,
          stockBefore: p.stock,
          stockAfter: nextStock,
          reasonOrNote: `Hoàn kho do KH hủy đơn #${order.code}: ${reason}`,
          actorName: currentUser.fullName,
          createdAt: nowIso,
        });
        return { ...p, stock: nextStock };
      })
    );
    setStockHistories((prev) => [...restoreLogs, ...prev]);

    // 2. Hoàn lại lượt sử dụng Voucher (nếu có)
    if (order.voucherCode) {
      setVouchers((prev) =>
        prev.map((v) =>
          v.code.toUpperCase() === order.voucherCode?.toUpperCase()
            ? { ...v, usedCount: Math.max(0, v.usedCount - 1) }
            : v
        )
      );
    }

    // 3. Cập nhật trạng thái đơn sang DaHuy
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'DaHuy',
              cancelReason: reason,
              timeline: [
                ...o.timeline,
                {
                  status: 'DaHuy',
                  timestamp: nowIso,
                  note: `Khách hàng hủy đơn — Lý do: ${reason}`,
                  actorName: currentUser.fullName,
                },
              ],
            }
          : o
      )
    );

    return {
      ok: true,
      message: `Đã hủy đơn hàng #${order.code} và hoàn trả tồn kho thành công.`,
    };
  };

  // UC-02: Đăng nhập (chống Account Enumeration + khóa tạm thời 5 lần sai liên tiếp)
  const GENERIC_LOGIN_ERROR = 'Email, số điện thoại hoặc mật khẩu không chính xác.';

  const loginUser = (identifier: string, password: string) => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) {
      return { ok: false, message: 'Vui lòng nhập đầy đủ Email/SĐT và mật khẩu.' };
    }

    const user = users.find(
      (u) => u.email.toLowerCase() === cleanId || u.phone === identifier.trim()
    );

    // CRIT-01: Thông báo chung nhất quán để chống dò tài khoản (Account Enumeration)
    if (!user) {
      return { ok: false, message: GENERIC_LOGIN_ERROR };
    }

    // Kiểm tra khóa bởi Admin (UC-02 3b / UC-10)
    if (user.isLocked) {
      return {
        ok: false,
        message: `Tài khoản đã bị khóa bởi Quản trị viên. Lý do: ${
          user.lockReason || 'Vi phạm chính sách hệ thống'
        }.`,
      };
    }

    // Kiểm tra khóa tạm thời do sai mật khẩu 5 lần (UC-02 3a)
    if (user.lockoutUntil) {
      const unlockTime = new Date(user.lockoutUntil);
      if (unlockTime > new Date()) {
        const minutesLeft = Math.max(
          1,
          Math.ceil((unlockTime.getTime() - Date.now()) / 60000)
        );
        return {
          ok: false,
          message: `Tài khoản đang bị tạm khóa do nhập sai mật khẩu 5 lần liên tiếp. Vui lòng thử lại sau ${minutesLeft} phút hoặc dùng Quên mật khẩu.`,
        };
      }
    }

    if (user.passwordHash !== password) {
      const nextAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLockout = nextAttempts >= 5;
      const lockoutIso = shouldLockout
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : undefined;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                failedLoginAttempts: nextAttempts,
                lockoutUntil: lockoutIso,
              }
            : u
        )
      );

      if (shouldLockout) {
        return {
          ok: false,
          message:
            'Nhập sai mật khẩu 5 lần liên tiếp. Tài khoản tạm khóa 15 phút để bảo vệ an toàn.',
        };
      }

      // Không tiết lộ tài khoản tồn tại hay số lần sai khi chưa chạm ngưỡng khóa
      return {
        ok: false,
        message: GENERIC_LOGIN_ERROR,
      };
    }

    // Đăng nhập thành công -> reset bộ đếm sai
    const updatedUser: User = {
      ...user,
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    return {
      ok: true,
      user: updatedUser,
      message: `Chào mừng ${updatedUser.fullName} quay trở lại HCShop!`,
    };
  };

  // UC-01: Đăng ký tài khoản Khách hàng mới
  const registerUser = (input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => {
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();
    const securityQuestion = input.securityQuestion.trim();
    const securityAnswer = input.securityAnswer.trim();

    if (!fullName || !email || !phone || !input.password) {
      return { ok: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { ok: false, message: 'Định dạng Email không hợp lệ.' };
    }

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        ok: false,
        message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.',
      };
    }

    if (users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, message: 'Email này đã được sử dụng bởi tài khoản khác.' };
    }

    if (users.some((u) => u.phone === phone)) {
      return {
        ok: false,
        message: 'Số điện thoại này đã được đăng ký trên hệ thống.',
      };
    }

    if (input.password.length < 6) {
      return {
        ok: false,
        message: 'Mật khẩu phải có tối thiểu 6 ký tự.',
      };
    }

    if (input.password !== input.confirmPassword) {
      return { ok: false, message: 'Mật khẩu xác nhận không khớp.' };
    }

    if (!securityQuestion || !securityAnswer) {
      return {
        ok: false,
        message: 'Vui lòng chọn câu hỏi bảo mật và nhập câu trả lời bảo mật.',
      };
    }
    if (securityAnswer.length < 2) {
      return {
        ok: false,
        message: 'Câu trả lời bảo mật phải có tối thiểu 2 ký tự.',
      };
    }

    const nextIndex = users.filter((u) => u.role === 'KhachHang').length + 1;
    const newUser: User = {
      id: `usr-cust-${Date.now()}`,
      code: `KH${String(nextIndex).padStart(2, '0')}`,
      fullName,
      email,
      phone,
      passwordHash: input.password,
      role: 'KhachHang',
      isLocked: false,
      securityQuestion,
      securityAnswerHash: securityAnswer,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    return {
      ok: true,
      user: newUser,
      message: 'Đăng ký tài khoản thành công.',
    };
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  // UC-03: Quên mật khẩu qua Câu hỏi bảo mật (CRIT-02: khóa tạm 15 phút sau 5 lần trả lời sai)
  const lookupUserForRecovery = (identifier: string) => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      return { ok: false, message: 'Vui lòng nhập Email hoặc Số điện thoại của bạn.' };
    }
    const user = users.find(
      (u) => u.email.toLowerCase() === clean || u.phone === identifier.trim()
    );
    if (!user) {
      return {
        ok: false,
        message: 'Không tìm thấy tài khoản khớp với thông tin đã nhập.',
      };
    }
    if (user.isLocked) {
      return {
        ok: false,
        message: 'Tài khoản này đã bị khóa, không thể khôi phục mật khẩu.',
      };
    }
    if (user.recoveryLockoutUntil) {
      const unlockTime = new Date(user.recoveryLockoutUntil);
      if (unlockTime > new Date()) {
        const minutesLeft = Math.max(
          1,
          Math.ceil((unlockTime.getTime() - Date.now()) / 60000)
        );
        return {
          ok: false,
          isLockedOut: true,
          message: `Tính năng khôi phục mật khẩu đang bị tạm khóa do nhập sai câu trả lời bảo mật 5 lần liên tiếp. Vui lòng thử lại sau ${minutesLeft} phút.`,
        };
      }
    }
    if (!user.securityQuestion || !user.securityAnswerHash) {
      return {
        ok: false,
        message:
          'Tài khoản này chưa thiết lập Câu hỏi bảo mật. Vui lòng liên hệ bộ phận hỗ trợ.',
      };
    }
    return {
      ok: true,
      user,
      securityQuestion: user.securityQuestion,
      message: 'Đã xác thực thông tin tài khoản.',
    };
  };

  const resetPasswordBySecurityAnswer = (params: {
    userId: string;
    answer: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const user = users.find((u) => u.id === params.userId);
    if (!user || !user.securityAnswerHash) {
      return { ok: false, message: 'Yêu cầu khôi phục không hợp lệ.' };
    }

    // Kiểm tra khóa tạm thời khôi phục mật khẩu (UC-03 5a)
    if (user.recoveryLockoutUntil) {
      const unlockTime = new Date(user.recoveryLockoutUntil);
      if (unlockTime > new Date()) {
        const minutesLeft = Math.max(
          1,
          Math.ceil((unlockTime.getTime() - Date.now()) / 60000)
        );
        return {
          ok: false,
          isLockedOut: true,
          message: `Bạn đã trả lời sai quá 5 lần. Chức năng khôi phục tạm khóa thêm ${minutesLeft} phút.`,
        };
      }
    }

    if (
      params.answer.trim().toLowerCase() !==
      user.securityAnswerHash.trim().toLowerCase()
    ) {
      const currentAttempts =
        user.recoveryLockoutUntil && new Date(user.recoveryLockoutUntil) <= new Date()
          ? 0
          : user.failedRecoveryAttempts || 0;
      const nextAttempts = currentAttempts + 1;
      const shouldLockout = nextAttempts >= 5;
      const lockoutIso = shouldLockout
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : undefined;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                failedRecoveryAttempts: nextAttempts,
                recoveryLockoutUntil: lockoutIso,
              }
            : u
        )
      );

      if (shouldLockout) {
        return {
          ok: false,
          isLockedOut: true,
          message:
            'Trả lời sai câu hỏi bảo mật 5 lần liên tiếp. Chức năng khôi phục mật khẩu tạm khóa 15 phút để bảo vệ tài khoản.',
        };
      }

      return {
        ok: false,
        message: `Câu trả lời bảo mật không chính xác (${nextAttempts}/5 lần thử). Còn ${
          5 - nextAttempts
        } lần trước khi tạm khóa khôi phục.`,
      };
    }
    if (params.newPassword.length < 6) {
      return { ok: false, message: 'Mật khẩu mới phải có từ 6 ký tự trở lên.' };
    }
    if (params.newPassword !== params.confirmPassword) {
      return { ok: false, message: 'Xác nhận mật khẩu mới không khớp.' };
    }

    const updated: User = {
      ...user,
      passwordHash: params.newPassword,
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
      failedRecoveryAttempts: 0,
      recoveryLockoutUntil: undefined,
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    setCurrentUser(updated);

    return {
      ok: true,
      message: 'Đặt lại mật khẩu thành công.',
    };
  };

  // UC-04: Đổi mật khẩu
  const changePassword = (params: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (!currentUser) return { ok: false, message: 'Vui lòng đăng nhập.' };
    if (currentUser.passwordHash !== params.currentPassword) {
      return { ok: false, message: 'Mật khẩu hiện tại không chính xác.' };
    }
    if (params.newPassword.length < 6) {
      return { ok: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' };
    }
    if (params.newPassword === params.currentPassword) {
      return {
        ok: false,
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      };
    }
    if (params.newPassword !== params.confirmPassword) {
      return { ok: false, message: 'Mật khẩu xác nhận không khớp.' };
    }

    const updated: User = { ...currentUser, passwordHash: params.newPassword };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    return { ok: true, message: 'Đã cập nhật mật khẩu mới.' };
  };

  // UC-05: Thiết lập / Cập nhật Câu hỏi bảo mật
  const updateSecurityQuestion = (params: {
    currentPassword: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => {
    if (!currentUser) return { ok: false, message: 'Vui lòng đăng nhập.' };
    if (currentUser.passwordHash !== params.currentPassword) {
      return { ok: false, message: 'Mật khẩu xác nhận không chính xác.' };
    }
    if (!params.securityQuestion.trim() || !params.securityAnswer.trim()) {
      return { ok: false, message: 'Vui lòng nhập đầy đủ câu hỏi và câu trả lời bảo mật.' };
    }
    if (params.securityAnswer.trim().length < 2) {
      return { ok: false, message: 'Câu trả lời bảo mật phải có tối thiểu 2 ký tự.' };
    }

    const updated: User = {
      ...currentUser,
      securityQuestion: params.securityQuestion.trim(),
      securityAnswerHash: params.securityAnswer.trim(),
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    return { ok: true, message: 'Đã lưu thiết lập câu hỏi bảo mật.' };
  };

  // UC-06: Cập nhật thông tin cá nhân
  const updateProfile = (params: {
    fullName: string;
    phone: string;
    dob?: string;
    gender?: Gender;
    avatar?: string;
  }) => {
    if (!currentUser) return { ok: false, message: 'Vui lòng đăng nhập.' };
    const fullName = params.fullName.trim();
    const phone = params.phone.trim();
    if (!fullName || !phone) {
      return { ok: false, message: 'Họ tên và Số điện thoại không được để trống.' };
    }
    if (!/^0\d{9}$/.test(phone)) {
      return { ok: false, message: 'Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0.' };
    }
    if (users.some((u) => u.id !== currentUser.id && u.phone === phone)) {
      return { ok: false, message: 'Số điện thoại này đã thuộc về tài khoản khác.' };
    }

    const updated: User = {
      ...currentUser,
      fullName,
      phone,
      dob: params.dob || currentUser.dob,
      gender: params.gender || currentUser.gender,
      avatar: params.avatar !== undefined ? params.avatar || undefined : currentUser.avatar,
    };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    return { ok: true, message: 'Đã lưu thông tin hồ sơ cá nhân.' };
  };

  // Staff / Admin: Xác nhận hoặc Hủy/Từ chối đơn hàng (ChoXacNhan hoặc DaXacNhan theo UC-41)
  const staffConfirmOrRejectOrder = (
    orderId: string,
    action: 'CONFIRM' | 'REJECT',
    reasonOrNote?: string
  ) => {
    if (!currentUser || currentUser.role !== 'NhanVien') {
      return {
        ok: false,
        message: 'Chỉ Nhân viên mới có quyền xác nhận hoặc từ chối đơn hàng.',
      };
    }
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng.' };

    const nowIso = new Date().toISOString();
    const actorLabel = `${currentUser.fullName} (${ROLE_LABELS[currentUser.role]})`;

    if (action === 'CONFIRM') {
      if (order.status !== 'ChoXacNhan') {
        return { ok: false, message: 'Chỉ đơn hàng đang "Chờ xác nhận" mới có thể xác nhận.' };
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'DaXacNhan',
                timeline: [
                  ...o.timeline,
                  {
                    status: 'DaXacNhan',
                    timestamp: nowIso,
                    note: reasonOrNote?.trim() || 'Đã xác nhận đơn hàng và chuyển kho chuẩn bị',
                    actorName: actorLabel,
                  },
                ],
              }
            : o
        )
      );
      return { ok: true, message: `Đã xác nhận đơn hàng #${order.code}.` };
    }

    // REJECT / CANCEL: áp dụng cho cả ChoXacNhan và DaXacNhan (UC-41)
    if (order.status !== 'ChoXacNhan' && order.status !== 'DaXacNhan') {
      return {
        ok: false,
        message: 'Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận".',
      };
    }

    const reason = reasonOrNote?.trim() || '';
    if (!reason) {
      return { ok: false, message: 'Vui lòng nhập lý do hủy / từ chối đơn hàng.' };
    }

    const restoreLogs: StockHistory[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        const item = order.items.find((i) => i.productId === p.id);
        if (!item) return p;
        const nextStock = p.stock + item.quantity;
        restoreLogs.push({
          id: `sh-reject-${Date.now()}-${p.id}`,
          productId: p.id,
          orderId: order.id,
          orderCode: order.code,
          type: 'HoanDon',
          quantityChange: item.quantity,
          stockBefore: p.stock,
          stockAfter: nextStock,
          reasonOrNote: `Hoàn kho do hủy đơn #${order.code}: ${reason}`,
          actorName: currentUser.fullName,
          createdAt: nowIso,
        });
        return { ...p, stock: nextStock };
      })
    );
    setStockHistories((prev) => [...restoreLogs, ...prev]);

    if (order.voucherCode) {
      setVouchers((prev) =>
        prev.map((v) =>
          v.code.toUpperCase() === order.voucherCode?.toUpperCase()
            ? { ...v, usedCount: Math.max(0, v.usedCount - 1) }
            : v
        )
      );
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'DaHuy',
              cancelReason: reason,
              timeline: [
                ...o.timeline,
                {
                  status: 'DaHuy',
                  timestamp: nowIso,
                  note: `Cửa hàng hủy đơn — Lý do: ${reason}`,
                  actorName: actorLabel,
                },
              ],
            }
          : o
      )
    );

    return { ok: true, message: `Đã hủy đơn #${order.code} và hoàn trả tồn kho.` };
  };

  // Staff only (CRIT-03): Cập nhật trạng thái đơn hàng tuần tự (DaXacNhan -> DangChuanBi -> DangGiao -> HoanThanh)
  const staffAdvanceOrderStatus = (
    orderId: string,
    nextStatus: OrderStatus,
    note?: string
  ) => {
    if (!currentUser || currentUser.role !== 'NhanVien') {
      return {
        ok: false,
        message: 'Chỉ Nhân viên mới có quyền cập nhật trạng thái đơn hàng.',
      };
    }
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng.' };

    const validTransitions: Partial<Record<OrderStatus, OrderStatus>> = {
      DaXacNhan: 'DangChuanBi',
      DangChuanBi: 'DangGiao',
      DangGiao: 'HoanThanh',
    };

    if (validTransitions[order.status] !== nextStatus) {
      return {
        ok: false,
        message: 'Trạng thái đơn hàng phải được cập nhật tuần tự theo từng bước quy trình.',
      };
    }

    const defaultNotes: Partial<Record<OrderStatus, string>> = {
      DangChuanBi: 'Đang đóng gói sản phẩm và bàn giao đơn vị vận chuyển',
      DangGiao: 'Đơn hàng đang trên đường giao đến địa chỉ người nhận',
      HoanThanh: 'Giao hàng thành công — Đơn hàng hoàn tất',
    };

    const nowIso = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: nextStatus,
              isPaid: nextStatus === 'HoanThanh' ? true : o.isPaid,
              timeline: [
                ...o.timeline,
                {
                  status: nextStatus,
                  timestamp: nowIso,
                  note: note?.trim() || defaultNotes[nextStatus] || 'Cập nhật trạng thái',
                  actorName: `${currentUser.fullName} (${ROLE_LABELS[currentUser.role]})`,
                },
              ],
            }
          : o
      )
    );

    return { ok: true, message: `Đã chuyển đơn #${order.code} sang bước tiếp theo.` };
  };

  // Admin: Quản lý Danh mục
  const createCategory = (input: {
    name: string;
    description: string;
    imageUrl?: string;
    isVisible?: boolean;
  }) => {
    const name = input.name.trim();
    const description = input.description.trim();
    if (!name) return { ok: false, message: 'Vui lòng nhập tên danh mục.' };
    if (
      categories.some(
        (c) => !c.isDeleted && c.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return { ok: false, message: 'Tên danh mục này đã tồn tại.' };
    }

    const num = String(categories.length + 1).padStart(2, '0');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      description: description || `Danh mục sản phẩm ${name}`,
      imageUrl: input.imageUrl?.trim() || createPlaceholderImage(num),
      iconName: num,
      isVisible: input.isVisible !== undefined ? input.isVisible : true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    setCategories((prev) => [...prev, newCat]);
    return { ok: true, message: `Đã tạo danh mục "${name}".` };
  };

  const updateCategory = (
    id: string,
    input: { name: string; description: string; imageUrl?: string }
  ) => {
    const name = input.name.trim();
    const description = input.description.trim();
    if (!name) return { ok: false, message: 'Tên danh mục không được để trống.' };
    if (
      categories.some(
        (c) =>
          c.id !== id &&
          !c.isDeleted &&
          c.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return { ok: false, message: 'Tên danh mục đã trùng với một danh mục khác.' };
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              name,
              description,
              imageUrl: input.imageUrl ? input.imageUrl : c.imageUrl,
            }
          : c
      )
    );
    return { ok: true, message: 'Đã cập nhật thông tin danh mục.' };
  };

  const toggleCategoryVisibility = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return { ok: false, message: 'Danh mục không tồn tại.' };
    const nextVisible = !target.isVisible;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isVisible: nextVisible } : c))
    );
    return {
      ok: true,
      message: nextVisible
        ? `Đã hiển thị lại danh mục "${target.name}".`
        : `Đã tạm ẩn danh mục "${target.name}" khỏi cửa hàng.`,
    };
  };

  const deleteCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return { ok: false, message: 'Danh mục không tồn tại.' };

    const activeProductsInCat = products.filter(
      (p) => !p.isDeleted && p.categoryId === id
    );
    if (activeProductsInCat.length > 0) {
      return {
        ok: false,
        message: `Không thể xóa danh mục đang chứa ${activeProductsInCat.length} sản phẩm. Hãy chuyển sang chế độ "Tạm ẩn".`,
      };
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isDeleted: true, isVisible: false } : c))
    );
    return { ok: true, message: `Đã xóa danh mục "${target.name}".` };
  };

  // Admin: Quản lý Sản phẩm
  const createProduct = (input: {
    code: string;
    name: string;
    categoryId: string;
    price: number;
    description: string;
    imageUrl?: string;
    minStockThreshold: number;
    initialStock: number;
    isVisible?: boolean;
  }) => {
    const code = input.code.trim().toUpperCase();
    const name = input.name.trim();
    const description = input.description.trim();
    if (!code || !name || !input.categoryId) {
      return { ok: false, message: 'Vui lòng điền mã SKU, tên sản phẩm và chọn danh mục.' };
    }
    if (!description) {
      return { ok: false, message: 'Vui lòng nhập mô tả sản phẩm.' };
    }
    if (input.price <= 0) {
      return { ok: false, message: 'Giá bán sản phẩm phải lớn hơn 0.' };
    }
    if (products.some((p) => !p.isDeleted && p.code.toUpperCase() === code)) {
      return { ok: false, message: 'Mã SKU này đã tồn tại trên hệ thống.' };
    }
    // UC-20 4b: Không cho phép trùng tên sản phẩm trong cùng danh mục
    if (
      products.some(
        (p) =>
          !p.isDeleted &&
          p.categoryId === input.categoryId &&
          p.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return {
        ok: false,
        message: 'Tên sản phẩm này đã tồn tại trong cùng danh mục. Vui lòng dùng tên khác.',
      };
    }

    const num = String(products.length + 1).padStart(2, '0');
    const nowIso = new Date().toISOString();
    const initialStock = Math.max(0, Math.floor(input.initialStock || 0));
    const parsedThreshold = Number.isFinite(input.minStockThreshold)
      ? Math.max(0, Math.floor(input.minStockThreshold))
      : 0;

    const newProduct: Product = {
      id: `prd-${Date.now()}`,
      code,
      name,
      categoryId: input.categoryId,
      price: input.price,
      description,
      imageUrl: input.imageUrl?.trim() || createPlaceholderImage(num),
      stock: initialStock,
      minStockThreshold: parsedThreshold,
      isVisible: input.isVisible !== undefined ? input.isVisible : true,
      isDeleted: false,
      createdAt: nowIso,
    };

    setProducts((prev) => [newProduct, ...prev]);

    if (initialStock > 0) {
      setStockHistories((prev) => [
        {
          id: `sh-init-${Date.now()}`,
          productId: newProduct.id,
          type: 'NhapTang',
          quantityChange: initialStock,
          stockBefore: 0,
          stockAfter: initialStock,
          reasonOrNote: 'Khởi tạo tồn kho ban đầu khi tạo sản phẩm mới',
          actorName: currentUser?.fullName || 'Admin',
          createdAt: nowIso,
        },
        ...prev,
      ]);
    }

    return { ok: true, message: `Đã thêm sản phẩm "${name}" (${code}).` };
  };

  const updateProduct = (
    id: string,
    input: {
      name: string;
      categoryId: string;
      price: number;
      description: string;
      imageUrl?: string;
    }
  ) => {
    const name = input.name.trim();
    const description = input.description.trim();
    if (!name || !input.categoryId) {
      return { ok: false, message: 'Tên sản phẩm và danh mục không được để trống.' };
    }
    if (!description) {
      return { ok: false, message: 'Vui lòng nhập mô tả sản phẩm.' };
    }
    if (input.price <= 0) {
      return { ok: false, message: 'Giá bán phải lớn hơn 0.' };
    }
    if (
      products.some(
        (p) =>
          p.id !== id &&
          !p.isDeleted &&
          p.categoryId === input.categoryId &&
          p.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      return {
        ok: false,
        message: 'Tên sản phẩm này đã tồn tại trong cùng danh mục.',
      };
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              name,
              categoryId: input.categoryId,
              price: input.price,
              description,
              imageUrl: input.imageUrl ? input.imageUrl : p.imageUrl,
            }
          : p
      )
    );

    return { ok: true, message: 'Đã cập nhật thông tin sản phẩm.' };
  };

  const toggleProductVisibility = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return { ok: false, message: 'Không tìm thấy sản phẩm.' };
    const nextVisible = !target.isVisible;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isVisible: nextVisible } : p))
    );
    return {
      ok: true,
      message: nextVisible
        ? `Đã mở bán lại "${target.name}" trên cửa hàng.`
        : `Đã tạm ẩn "${target.name}". Sản phẩm trong giỏ khách hàng sẽ được đánh dấu ngừng kinh doanh.`,
    };
  };

  const deleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return { ok: false, message: 'Không tìm thấy sản phẩm.' };

    const hasOrderHistory = orders.some((o) =>
      o.items.some((item) => item.productId === id)
    );
    if (hasOrderHistory) {
      return {
        ok: false,
        message: `Sản phẩm "${target.name}" đã phát sinh trong đơn hàng. Vui lòng sử dụng tính năng "Tạm ẩn" để bảo toàn lịch sử đối soát.`,
      };
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isDeleted: true, isVisible: false } : p))
    );
    return { ok: true, message: `Đã xóa sản phẩm "${target.name}".` };
  };

  // Admin: Quản lý Tồn kho & Sổ cái biến động (StockHistories)
  const importStock = (params: {
    productId: string;
    quantity: number;
    importPrice?: number;
    supplier?: string;
    note: string;
  }) => {
    const product = products.find((p) => p.id === params.productId && !p.isDeleted);
    if (!product) return { ok: false, message: 'Vui lòng chọn sản phẩm hợp lệ.' };
    const qty = Math.floor(params.quantity);
    if (!qty || qty <= 0) {
      return { ok: false, message: 'Số lượng nhập kho phải là số nguyên dương.' };
    }
    if (params.importPrice !== undefined && params.importPrice < 0) {
      return { ok: false, message: 'Đơn giá nhập không hợp lệ.' };
    }
    const reasonNote = params.note.trim();
    if (!reasonNote) {
      return { ok: false, message: 'Vui lòng nhập lý do / ghi chú phiếu nhập kho.' };
    }

    const nowIso = new Date().toISOString();
    const nextStock = product.stock + qty;

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: nextStock } : p))
    );

    const newLog: StockHistory = {
      id: `sh-imp-${Date.now()}`,
      productId: product.id,
      type: 'NhapTang',
      quantityChange: qty,
      stockBefore: product.stock,
      stockAfter: nextStock,
      supplier: params.supplier?.trim() || undefined,
      importPrice:
        params.importPrice !== undefined && params.importPrice > 0
          ? params.importPrice
          : undefined,
      reasonOrNote: reasonNote,
      actorName: currentUser?.fullName || 'Admin',
      createdAt: nowIso,
    };

    setStockHistories((prev) => [newLog, ...prev]);

    return {
      ok: true,
      message: `Đã nhập kho +${qty} sản phẩm "${product.name}". Tồn mới: ${nextStock}.`,
    };
  };

  const adjustStockDecrease = (params: {
    productId: string;
    quantityToSubtract: number;
    reason: string;
  }) => {
    const product = products.find((p) => p.id === params.productId && !p.isDeleted);
    if (!product) return { ok: false, message: 'Vui lòng chọn sản phẩm hợp lệ.' };
    const qty = Math.floor(params.quantityToSubtract);
    if (!qty || qty <= 0) {
      return { ok: false, message: 'Số lượng xuất giảm phải lớn hơn 0.' };
    }
    if (qty > product.stock) {
      return {
        ok: false,
        message: `Số lượng xuất giảm (${qty}) không được vượt quá tồn kho hiện tại (${product.stock}).`,
      };
    }
    const reason = params.reason.trim();
    if (!reason) {
      return { ok: false, message: 'Bắt buộc nhập lý do điều chỉnh giảm tồn kho.' };
    }

    const nowIso = new Date().toISOString();
    const nextStock = product.stock - qty;

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: nextStock } : p))
    );

    const newLog: StockHistory = {
      id: `sh-adj-${Date.now()}`,
      productId: product.id,
      type: 'DieuChinhGiam',
      quantityChange: -qty,
      stockBefore: product.stock,
      stockAfter: nextStock,
      reasonOrNote: reason,
      actorName: currentUser?.fullName || 'Admin',
      createdAt: nowIso,
    };

    setStockHistories((prev) => [newLog, ...prev]);

    return {
      ok: true,
      message: `Đã điều chỉnh giảm -${qty} sản phẩm "${product.name}". Tồn còn: ${nextStock}.`,
    };
  };

  const updateMinStockThreshold = (productId: string, threshold: number) => {
    const val = Math.floor(threshold);
    if (Number.isNaN(val) || val < 0) {
      return { ok: false, message: 'Ngưỡng cảnh báo tồn tối thiểu phải từ 0 trở lên.' };
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, minStockThreshold: val } : p))
    );
    return { ok: true, message: 'Đã cập nhật ngưỡng cảnh báo tồn tối thiểu.' };
  };

  // Admin: Quản lý Mã giảm giá
  const createVoucher = (input: {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount?: number;
    minOrderValue: number;
    startDate: string;
    endDate: string;
    usageLimit: number;
    isActive?: boolean;
  }) => {
    const code = input.code.trim().toUpperCase();
    const description = (input.description || '').trim();
    if (!code) {
      return { ok: false, message: 'Vui lòng nhập mã giảm giá.' };
    }
    if (!/^[A-Z0-9_-]{3,50}$/.test(code)) {
      return {
        ok: false,
        message: 'Mã giảm giá chỉ gồm chữ in hoa, chữ số, gạch ngang/dưới (3–50 ký tự, không dấu cách).',
      };
    }
    if (vouchers.some((v) => !v.isDeleted && v.code.toUpperCase() === code)) {
      return { ok: false, message: 'Mã giảm giá này đã tồn tại trên hệ thống.' };
    }
    if (input.discountValue <= 0) {
      return { ok: false, message: 'Giá trị giảm phải lớn hơn 0.' };
    }
    if (input.discountType === 'PhanTram' && input.discountValue > 100) {
      return { ok: false, message: 'Mức giảm theo phần trăm không được vượt quá 100%.' };
    }
    if (input.usageLimit <= 0) {
      return { ok: false, message: 'Giới hạn lượt sử dụng phải lớn hơn 0.' };
    }
    if (new Date(input.endDate) <= new Date(input.startDate)) {
      return { ok: false, message: 'Ngày kết thúc phải sau ngày bắt đầu.' };
    }

    const newVoucher: Voucher = {
      id: `vch-${Date.now()}`,
      code,
      description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      maxDiscountAmount:
        input.discountType === 'PhanTram' &&
        input.maxDiscountAmount &&
        input.maxDiscountAmount > 0
          ? input.maxDiscountAmount
          : undefined,
      minOrderValue: Math.max(0, input.minOrderValue || 0),
      startDate: new Date(input.startDate).toISOString(),
      endDate: new Date(input.endDate).toISOString(),
      usageLimit: Math.floor(input.usageLimit),
      usedCount: 0,
      isActive: input.isActive !== undefined ? input.isActive : true,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    setVouchers((prev) => [newVoucher, ...prev]);
    return { ok: true, message: `Đã tạo mã giảm giá "${code}".` };
  };

  const updateVoucher = (
    id: string,
    input: {
      code: string;
      description?: string;
      discountType: DiscountType;
      discountValue: number;
      maxDiscountAmount?: number;
      minOrderValue: number;
      startDate: string;
      endDate: string;
      usageLimit: number;
    }
  ) => {
    const target = vouchers.find((v) => v.id === id);
    if (!target) return { ok: false, message: 'Không tìm thấy mã giảm giá.' };

    if (input.usageLimit < target.usedCount) {
      return {
        ok: false,
        message: `Tổng lượt sử dụng không được nhỏ hơn số lượt đã dùng (${target.usedCount}).`,
      };
    }
    if (new Date(input.endDate) <= new Date(input.startDate)) {
      return { ok: false, message: 'Ngày kết thúc phải sau ngày bắt đầu.' };
    }

    // UC-49 4b: Khi mã đã được dùng, khóa code, loại giảm, mức giảm, mức giảm tối đa và đơn tối thiểu
    const isAlreadyUsed = target.usedCount > 0;
    const nextCode = isAlreadyUsed ? target.code : input.code.trim().toUpperCase();
    const nextType = isAlreadyUsed ? target.discountType : input.discountType;
    const nextValue = isAlreadyUsed ? target.discountValue : input.discountValue;
    const nextMaxDiscount = isAlreadyUsed
      ? target.maxDiscountAmount
      : nextType === 'PhanTram' && input.maxDiscountAmount && input.maxDiscountAmount > 0
        ? input.maxDiscountAmount
        : undefined;
    const nextMinOrder = isAlreadyUsed
      ? target.minOrderValue
      : Math.max(0, input.minOrderValue || 0);

    setVouchers((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              code: nextCode,
              description:
                input.description !== undefined ? input.description.trim() : v.description,
              discountType: nextType,
              discountValue: nextValue,
              maxDiscountAmount: nextMaxDiscount,
              minOrderValue: nextMinOrder,
              startDate: new Date(input.startDate).toISOString(),
              endDate: new Date(input.endDate).toISOString(),
              usageLimit: Math.floor(input.usageLimit),
            }
          : v
      )
    );

    return {
      ok: true,
      message: isAlreadyUsed
        ? `Đã cập nhật mã "${target.code}" (giữ nguyên mã, loại giảm và điều kiện giá trị gốc do đã có đơn áp dụng).`
        : `Đã cập nhật mã giảm giá "${nextCode}".`,
    };
  };

  const toggleVoucherActive = (id: string) => {
    const target = vouchers.find((v) => v.id === id);
    if (!target) return { ok: false, message: 'Không tìm thấy mã giảm giá.' };
    const nextActive = !target.isActive;
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isActive: nextActive } : v))
    );
    return {
      ok: true,
      message: nextActive
        ? `Đã kích hoạt lại mã "${target.code}".`
        : `Đã tạm ngừng áp dụng mã "${target.code}".`,
    };
  };

  const deleteVoucher = (id: string) => {
    const target = vouchers.find((v) => v.id === id);
    if (!target) return { ok: false, message: 'Không tìm thấy mã giảm giá.' };

    const usedInOrders =
      target.usedCount > 0 ||
      orders.some((o) => o.voucherCode?.toUpperCase() === target.code.toUpperCase());

    if (usedInOrders) {
      setVouchers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: false } : v))
      );
      return {
        ok: true,
        message: `Mã "${target.code}" đã phát sinh đơn hàng nên được chuyển sang trạng thái "Ngừng áp dụng" để bảo toàn dữ liệu.`,
      };
    }

    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isDeleted: true, isActive: false } : v))
    );
    return { ok: true, message: `Đã xóa mã giảm giá "${target.code}".` };
  };

  // Staff / Admin: Phản hồi & Kiểm duyệt Đánh giá
  const replyToReview = (reviewId: string, replyContent: string) => {
    const content = replyContent.trim();
    if (!content) {
      return { ok: false, message: 'Vui lòng nhập nội dung phản hồi.' };
    }
    const nowIso = new Date().toISOString();
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              storeReply: content,
              storeReplyAt: nowIso,
              storeReplyBy: currentUser
                ? `${currentUser.fullName} (${ROLE_LABELS[currentUser.role]})`
                : 'HCShop Support',
            }
          : r
      )
    );
    return { ok: true, message: 'Đã gửi phản hồi của cửa hàng.' };
  };

  const adminDeleteReview = (reviewId: string, reason: string) => {
    if (!currentUser || currentUser.role !== 'QuanLy') {
      return { ok: false, message: 'Chỉ Quản lý mới có quyền gỡ bỏ đánh giá.' };
    }
    if (!reason.trim()) {
      return { ok: false, message: 'Vui lòng nhập lý do gỡ bỏ đánh giá.' };
    }
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    return { ok: true, message: 'Đã gỡ bỏ đánh giá vi phạm.' };
  };

  // Admin: Quản lý Tài khoản & Khóa / Mở khóa (UC-10 2a: chỉ khóa tài khoản Khách hàng)
  const toggleAccountLock = (userId: string, lockReason?: string) => {
    if (!currentUser || currentUser.role !== 'QuanLy') {
      return { ok: false, message: 'Chỉ Quản lý mới có quyền khóa/mở khóa tài khoản.' };
    }
    if (currentUser.id === userId) {
      return {
        ok: false,
        message: 'Không thể tự khóa tài khoản Quản trị viên đang đăng nhập.',
      };
    }
    const target = users.find((u) => u.id === userId);
    if (!target) return { ok: false, message: 'Không tìm thấy tài khoản.' };

    if (target.role !== 'KhachHang') {
      return {
        ok: false,
        message: 'Theo quy định UC-10, không được khóa hoặc mở khóa tài khoản Nhân viên và Quản lý.',
      };
    }

    const nowIso = new Date().toISOString();

    if (!target.isLocked) {
      const reason = lockReason?.trim() || '';
      if (!reason) {
        return { ok: false, message: 'Vui lòng nhập lý do khóa tài khoản.' };
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isLocked: true, lockReason: reason } : u
        )
      );
      setAccountLockHistories((prev) => [
        {
          id: `alh-${Date.now()}`,
          userId,
          newStatus: 'BiKhoa',
          reason,
          actorName: currentUser.fullName,
          createdAt: nowIso,
        },
        ...prev,
      ]);
      return { ok: true, message: `Đã khóa tài khoản "${target.fullName}".` };
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isLocked: false,
                lockReason: undefined,
                failedLoginAttempts: 0,
                lockoutUntil: undefined,
              }
            : u
        )
      );
      setAccountLockHistories((prev) => [
        {
          id: `alh-${Date.now()}`,
          userId,
          newStatus: 'HoatDong',
          reason: lockReason?.trim() || 'Quản lý mở khóa tài khoản',
          actorName: currentUser.fullName,
          createdAt: nowIso,
        },
        ...prev,
      ]);
      return { ok: true, message: `Đã mở khóa tài khoản "${target.fullName}".` };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        accountLockHistories,
        categories,
        products,
        stockHistories,
        vouchers,
        orders,
        reviews,
        addresses,
        cart,
        wishlistProductIds,
        searchQuery,
        selectedCategoryId,
        setSearchQuery,
        setSelectedCategoryId,
        switchDemoRole,
        resetDemoData,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        toggleWishlist,
        addShippingAddress,
        updateShippingAddress,
        deleteShippingAddress,
        setDefaultShippingAddress,
        validateVoucherCode,
        placeOrder,
        cancelCustomerOrder,
        loginUser,
        registerUser,
        logoutUser,
        lookupUserForRecovery,
        resetPasswordBySecurityAnswer,
        changePassword,
        updateSecurityQuestion,
        updateProfile,
        submitReview,
        deleteReview,
        toggleReviewLike,
        staffConfirmOrRejectOrder,
        staffAdvanceOrderStatus,
        createCategory,
        updateCategory,
        toggleCategoryVisibility,
        deleteCategory,
        createProduct,
        updateProduct,
        toggleProductVisibility,
        deleteProduct,
        importStock,
        adjustStockDecrease,
        updateMinStockThreshold,
        createVoucher,
        updateVoucher,
        toggleVoucherActive,
        deleteVoucher,
        replyToReview,
        adminDeleteReview,
        toggleAccountLock,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
