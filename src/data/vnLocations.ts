export interface VnDistrict {
  name: string;
  wards: string[];
  inDeliveryZone: boolean;
}

export interface VnProvince {
  name: string;
  districts: VnDistrict[];
}

export const VN_LOCATIONS: VnProvince[] = [
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Đa Kao', 'Phường Nguyễn Thái Bình'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận 3',
        wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 4', 'Phường 11'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận 7',
        wards: ['Phường Tân Phong', 'Phường Tân Phú', 'Phường Phú Mỹ', 'Phường Bình Thuận'],
        inDeliveryZone: true,
      },
      {
        name: 'TP. Thủ Đức',
        wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường Linh Trung', 'Phường Hiệp Bình Chánh'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Bình Thạnh',
        wards: ['Phường 1', 'Phường 14', 'Phường 22', 'Phường 25'],
        inDeliveryZone: true,
      },
    ],
  },
  {
    name: 'Hà Nội',
    districts: [
      {
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Hàng Bạc', 'Phường Hàng Bài', 'Phường Tràng Tiền', 'Phường Cửa Nam'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Nghĩa Tân', 'Phường Trung Hòa'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Ô Chợ Dừa', 'Phường Quang Trung'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Điện Biên', 'Phường Kim Mã', 'Phường Ngọc Khánh', 'Phường Liễu Giai'],
        inDeliveryZone: true,
      },
    ],
  },
  {
    name: 'Đà Nẵng',
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu 1', 'Phường Thạch Thang', 'Phường Phước Ninh', 'Phường Hòa Thuận Đông'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường Phước Mỹ', 'Phường Mân Thái'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường Thanh Khê Đông', 'Phường Vĩnh Trung', 'Phường Xuân Hà'],
        inDeliveryZone: true,
      },
    ],
  },
  {
    name: 'Hải Phòng',
    districts: [
      {
        name: 'Quận Hồng Bàng',
        wards: ['Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Ngô Quyền',
        wards: ['Phường Cầu Đất', 'Phường Lạch Tray', 'Phường Máy Tơ'],
        inDeliveryZone: true,
      },
      {
        name: 'Huyện đảo Bạch Long Vĩ',
        wards: ['Thị trấn Bạch Long Vĩ'],
        inDeliveryZone: false,
      },
    ],
  },
  {
    name: 'Cần Thơ',
    districts: [
      {
        name: 'Quận Ninh Kiều',
        wards: ['Phường Tân An', 'Phường An Hòa', 'Phường Xuân Khánh', 'Phường Cái Khế'],
        inDeliveryZone: true,
      },
      {
        name: 'Quận Bình Thủy',
        wards: ['Phường Bình Thủy', 'Phường Trà An', 'Phường An Thới'],
        inDeliveryZone: true,
      },
    ],
  },
  {
    name: 'Khánh Hòa',
    districts: [
      {
        name: 'TP. Nha Trang',
        wards: ['Phường Lộc Thọ', 'Phường Phước Tiến', 'Phường Vĩnh Hải'],
        inDeliveryZone: true,
      },
      {
        name: 'Huyện đảo Trường Sa',
        wards: ['Thị trấn Trường Sa', 'Xã Song Tử Tây', 'Xã Sinh Tồn'],
        inDeliveryZone: false,
      },
    ],
  },
  {
    name: 'Bà Rịa - Vũng Tàu',
    districts: [
      {
        name: 'TP. Vũng Tàu',
        wards: ['Phường 1', 'Phường 2', 'Phường Thắng Tam'],
        inDeliveryZone: true,
      },
      {
        name: 'Huyện Côn Đảo',
        wards: ['Khu dân cư số 1', 'Khu dân cư số 5', 'Khu dân cư số 7'],
        inDeliveryZone: false,
      },
    ],
  },
];

export function getDistrictsByProvince(provinceName: string): VnDistrict[] {
  const found = VN_LOCATIONS.find((p) => p.name === provinceName);
  return found ? found.districts : [];
}

export function getWardsByDistrict(provinceName: string, districtName: string): string[] {
  const districts = getDistrictsByProvince(provinceName);
  const found = districts.find((d) => d.name === districtName);
  return found ? found.wards : [];
}

/**
 * Simulates Backend delivery zone validation in POST /api/dat-hang/chon-dia-chi (UC-34 3b).
 * Evaluates dynamically from Province + District instead of a stored client flag.
 */
export function isAddressInDeliveryZone(province: string, district: string): boolean {
  const normalizedDistrict = district.trim().toLowerCase();
  if (
    normalizedDistrict.includes('trường sa') ||
    normalizedDistrict.includes('bạch long vĩ') ||
    normalizedDistrict.includes('côn đảo') ||
    normalizedDistrict.includes('hải đảo')
  ) {
    return false;
  }
  const prov = VN_LOCATIONS.find((p) => p.name === province);
  if (!prov) return true;
  const dist = prov.districts.find((d) => d.name === district);
  if (!dist) return true;
  return dist.inDeliveryZone;
}
