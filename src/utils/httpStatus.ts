export type HttpErrorCode = 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 423 | 429 | 500;

export interface HttpErrorDescriptor {
  status: HttpErrorCode;
  title: string;
  message: string;
  actionLabel: string;
  actionType: 'LOGIN' | 'HOME' | 'RELOAD' | 'RETRY';
}

export interface ApiActionResult<T = undefined> {
  ok: boolean;
  message: string;
  statusCode?: number;
  data?: T;
}

/**
 * Standardized HTTP status code mapping for real API integration (CRIT-05).
 * Covers: 401 (Session Expired / Locked Mid-Session UC-10), 403 (Forbidden),
 * 404 (Deleted Record UC-14/21/49/56/57), 409 (Race Condition UC-37/41/43),
 * 422 (Validation), 423/429 (Account Lockout / Rate Limit UC-02/03), 500 (Server Error).
 */
export function mapHttpStatusToFeedback(
  status: number,
  serverMessage?: string
): HttpErrorDescriptor {
  switch (status) {
    case 401:
      return {
        status: 401,
        title: 'Phiên đăng nhập đã hết hạn',
        message:
          serverMessage ||
          'Phiên làm việc không còn hiệu lực hoặc tài khoản đã bị khóa. Vui lòng đăng nhập lại.',
        actionLabel: 'Đăng nhập lại',
        actionType: 'LOGIN',
      };
    case 403:
      return {
        status: 403,
        title: 'Không có quyền truy cập',
        message:
          serverMessage ||
          'Tài khoản hiện tại không đủ quyền để thực hiện thao tác hoặc xem tài nguyên này.',
        actionLabel: 'Quay về trang chủ',
        actionType: 'HOME',
      };
    case 404:
      return {
        status: 404,
        title: 'Không tìm thấy dữ liệu',
        message:
          serverMessage ||
          'Bản ghi yêu cầu không tồn tại hoặc đã bị xóa trước đó. Vui lòng tải lại danh sách.',
        actionLabel: 'Tải lại dữ liệu',
        actionType: 'RELOAD',
      };
    case 409:
      return {
        status: 409,
        title: 'Dữ liệu vừa được cập nhật',
        message:
          serverMessage ||
          'Trạng thái đơn hàng, tồn kho hoặc mã giảm giá đã thay đổi bởi một giao dịch khác. Vui lòng tải lại để cập nhật mới nhất.',
        actionLabel: 'Tải lại dữ liệu',
        actionType: 'RELOAD',
      };
    case 413:
    case 415:
      return {
        status: status === 413 ? 413 : 415,
        title: 'Tệp tải lên không hợp lệ',
        message:
          serverMessage ||
          'Hình ảnh vượt quá dung lượng 5MB hoặc sai định dạng (.JPG, .JPEG, .PNG, .WEBP).',
        actionLabel: 'Thử lại',
        actionType: 'RETRY',
      };
    case 422:
    case 400:
      return {
        status: status === 422 ? 422 : 400,
        title: 'Dữ liệu không hợp lệ',
        message:
          serverMessage ||
          'Vui lòng kiểm tra lại các trường thông tin bắt buộc và thử lại.',
        actionLabel: 'Thử lại',
        actionType: 'RETRY',
      };
    case 423:
    case 429:
      return {
        status: status === 423 ? 423 : 429,
        title: 'Tạm khóa do quá nhiều lần thử',
        message:
          serverMessage ||
          'Bạn đã thử quá số lần cho phép. Vui lòng chờ 15 phút rồi thử lại.',
        actionLabel: 'Quay về trang chủ',
        actionType: 'HOME',
      };
    default:
      return {
        status: 500,
        title: 'Lỗi kết nối máy chủ',
        message:
          serverMessage ||
          'Hệ thống đang gặp sự cố tạm thời. Vui lòng kiểm tra kết nối mạng và thử lại.',
        actionLabel: 'Thử lại',
        actionType: 'RETRY',
      };
  }
}

/**
 * Lightweight fetch wrapper / HTTP interceptor ready for real Backend API integration.
 */
export async function apiFetchWithInterceptor<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  onAuthExpired?: () => void
): Promise<ApiActionResult<T>> {
  try {
    const response = await fetch(input, init);
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : null;

    if (!response.ok) {
      if (response.status === 401 && onAuthExpired) {
        onAuthExpired();
      }
      const mapped = mapHttpStatusToFeedback(response.status, payload?.message);
      return {
        ok: false,
        statusCode: response.status,
        message: mapped.message,
      };
    }

    return {
      ok: true,
      statusCode: response.status,
      message: payload?.message || 'Thành công.',
      data: payload as T,
    };
  } catch {
    const mapped = mapHttpStatusToFeedback(500);
    return {
      ok: false,
      statusCode: 500,
      message: mapped.message,
    };
  }
}
