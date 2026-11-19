import {
  AccountStatus,
  CartItem,
  DiscountType,
  Gender,
  Order,
  OrderStatus,
  PaymentMethod,
  ShippingAddress,
  StockMovementType,
  UserRole,
} from './domain';

/**
 * Backend API DTO Contracts strictly aligned with SQL Server schema (database_dong_nhat.sql)
 * and REST API specification.
 *
 * UI-only helper fields in domain.ts (e.g., Category.iconName, Product.lastSoldAt,
 * Voucher.createdAt, CartItem.addedPrice, User.code) MUST NOT be sent to Backend write APIs.
 */

export interface TaiKhoanDto {
  id: string;
  hoTen: string;
  email: string;
  soDienThoai: string;
  vaiTro: UserRole;
  trangThai: AccountStatus;
  ngaySinh?: string | null;
  gioiTinh?: Gender | null;
  anhDaiDien?: string | null;
  ngayTao: string;
}

export interface LichSuKhoaTaiKhoanDto {
  id: string;
  taiKhoanId: string;
  trangThaiMoi: AccountStatus;
  lyDo: string;
  nguoiThucHien: string;
  thoiGian: string;
}

export interface DanhMucWriteDto {
  ten: string;
  moTa?: string | null;
  hinhAnh?: string | null;
  hienThi: boolean;
}

export interface SanPhamWriteDto {
  maSanPham?: string;
  ten: string;
  danhMucId: string;
  giaBan: number;
  moTa: string;
  hinhAnh?: string | null;
  soLuongTonKhoiTao?: number;
  nguongToiThieu?: number;
  hienThi?: boolean;
}

export interface ChiTietGioHangWriteDto {
  sanPhamId: string;
  soLuong: number;
}

export interface DonHangFlatAddressDto {
  tenNguoiNhan: string;
  soDienThoaiNhan: string;
  diaChiGiaoHang: string;
}

export interface DonHangDto extends DonHangFlatAddressDto {
  id: string;
  maDonHang: string;
  taiKhoanId: string;
  trangThai: OrderStatus;
  phuongThucThanhToan: PaymentMethod;
  maGiamGiaId?: string | null;
  tongTienHang: number;
  soTienGiam: number;
  tongThanhToan: number;
  ngayDat: string;
}

export interface DanhGiaWriteDto {
  donHangId: string;
  sanPhamId: string;
  soSao: number;
  noiDung: string;
  hinhAnh?: string | null; // dbo.DanhGia.HinhAnh nvarchar(500)
}

export interface BienDongKhoDto {
  id: string;
  sanPhamId: string;
  donHangId?: string | null;
  loaiBienDong: StockMovementType;
  soLuongThayDoi: number;
  tonTruoc: number;
  tonSau: number;
  lyDo: string;
  thoiGian: string;
}

export interface MaGiamGiaWriteDto {
  ma: string;
  moTa?: string | null;
  loaiGiam: DiscountType;
  giaTriGiam: number;
  giamToiDa?: number | null;
  donToiThieu: number;
  ngayBatDau: string; // ISO datetimeoffset(0)
  ngayKetThuc: string; // ISO datetimeoffset(0)
  gioiHanLuotDung: number;
  hienThi: boolean;
}

export interface BaoCaoTongQuanDto {
  tongDoanhThu: number;
  tongDonHang: number;
  tongKhachHangMoi: number;
  soSanPhamSapHetHang: number;
}

export interface DoanhThuDto {
  nhan: string;
  doanhThu: number;
  soDonHang: number;
}

export interface SanPhamBanChayDto {
  thuHang: number;
  sanPhamId: string;
  maSanPham: string;
  tenSanPham: string;
  soLuongBan: number;
  doanhThu: number;
}

export interface SanPhamTonLauDto {
  sanPhamId: string;
  maSanPham: string;
  tenSanPham: string;
  soLuongTon: number;
  giaTriTon: number;
  ngayBanGanNhat?: string | null;
  soNgayChuaBan: number;
}

/** Flatten ShippingAddress into SQL dbo.DonHang's 3 flat address columns. */
export function toDonHangFlatAddress(addr: ShippingAddress): DonHangFlatAddressDto {
  const parts = [addr.detailAddress, addr.ward, addr.district, addr.province].filter(Boolean);
  return {
    tenNguoiNhan: addr.recipientName,
    soDienThoaiNhan: addr.phone,
    diaChiGiaoHang: parts.join(', '),
  };
}

/** Map UI CartItem to Backend payload without client-only addedPrice. */
export function toChiTietGioHangPayload(item: CartItem): ChiTietGioHangWriteDto {
  return {
    sanPhamId: item.productId,
    soLuong: item.quantity,
  };
}

/** Map UI Order to Backend DonHangDto shape. */
export function toDonHangDto(order: Order): DonHangDto {
  return {
    id: order.id,
    maDonHang: order.code,
    taiKhoanId: order.userId,
    trangThai: order.status,
    phuongThucThanhToan: order.paymentMethod,
    maGiamGiaId: order.voucherId ?? null,
    tongTienHang: order.subtotal,
    soTienGiam: order.discountAmount,
    tongThanhToan: order.totalAmount,
    ngayDat: order.createdAt,
    ...toDonHangFlatAddress(order.shippingAddress),
  };
}
