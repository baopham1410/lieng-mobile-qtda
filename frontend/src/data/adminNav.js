/**
 * Menu admin — khớp docs/roles-permissions.md
 */
export const adminNavGroups = [
  {
    groupKey: 'store',
    label: 'Cửa hàng',
    items: [
      {
        name: 'dashboard',
        label: 'Tổng quan',
        to: '/dashboard',
        phosphor: 'ph-duotone ph-chart-pie-slice',
        roles: ['admin', 'warehouse_staff'],
      },
    ],
  },
  {
    groupKey: 'goods',
    label: 'Hàng hóa',
    items: [
      {
        name: 'products',
        label: 'Sản phẩm',
        to: '/products',
        phosphor: 'ph-duotone ph-device-mobile',
        roles: ['admin', 'sales_staff', 'warehouse_staff'],
      },
      {
        name: 'categories',
        label: 'Danh mục',
        to: '/products/categories',
        phosphor: 'ph-duotone ph-squares-four',
        roles: ['admin', 'warehouse_staff'],
      },
      {
        name: 'stock-imports',
        label: 'Nhập kho',
        to: '/inventory/imports',
        phosphor: 'ph-duotone ph-package',
        roles: ['admin', 'warehouse_staff'],
      },
    ],
  },
  {
    groupKey: 'retail',
    label: 'Bán lẻ',
    items: [
      {
        name: 'pos',
        label: 'Quầy bán hàng',
        to: '/pos',
        phosphor: 'ph-duotone ph-shopping-cart',
        roles: ['admin', 'sales_staff'],
        isPos: true,
      },
      {
        name: 'orders',
        label: 'Đơn hàng',
        to: '/orders',
        phosphor: 'ph-duotone ph-receipt',
        roles: ['admin', 'sales_staff'],
      },
      {
        name: 'customers',
        label: 'Khách hàng',
        to: '/customers',
        phosphor: 'ph-duotone ph-users',
        roles: ['admin', 'sales_staff', 'warehouse_staff'],
      },
    ],
  },
  {
    groupKey: 'accounting',
    label: 'Kế toán',
    items: [
      {
        name: 'finance',
        label: 'Thu chi',
        to: '/finance',
        phosphor: 'ph-duotone ph-currency-circle-dollar',
        roles: ['admin'],
      },
      {
        name: 'reports',
        label: 'Báo cáo',
        to: '/reports',
        phosphor: 'ph-duotone ph-chart-bar',
        roles: ['admin', 'warehouse_staff'],
      },
      {
        name: 'statements',
        label: 'Sao kê',
        to: '/reports/statements',
        phosphor: 'ph-duotone ph-notebook',
        roles: ['admin'],
      },
    ],
  },
  {
    groupKey: 'service',
    label: 'Dịch vụ',
    items: [
      {
        name: 'warranty',
        label: 'Bảo hành',
        to: '/warranty',
        phosphor: 'ph-duotone ph-shield-check',
        roles: ['admin', 'sales_staff', 'warehouse_staff'],
      },
      {
        name: 'appraisal',
        label: 'Thẩm định',
        to: '/appraisal',
        phosphor: 'ph-duotone ph-scales',
        roles: ['admin', 'sales_staff'],
      },
      {
        name: 'consult',
        label: 'Tư vấn',
        to: '/consult',
        phosphor: 'ph-duotone ph-headset',
        roles: ['admin', 'sales_staff'],
      },
    ],
  },
  {
    groupKey: 'system',
    label: 'Hệ thống',
    items: [
      {
        name: 'users',
        label: 'Nhân viên',
        to: '/users',
        phosphor: 'ph-duotone ph-user-gear',
        roles: ['admin'],
      },
    ],
  },
]

export const pageMeta = {
  dashboard: { title: 'Tổng quan cửa hàng', subtitle: 'Doanh thu, tồn kho và hoạt động hôm nay' },
  products: { title: 'Sản phẩm', subtitle: 'Danh sách hàng đã nhập kho — xem tồn, giá và chỉnh sửa' },
  categories: { title: 'Danh mục sản phẩm', subtitle: 'Thêm và quản lý nhóm hàng', parent: { name: 'products', label: 'Sản phẩm', to: '/products' } },
  'product-edit': {
    title: 'Sửa sản phẩm',
    subtitle: 'Cập nhật thông tin sản phẩm và giá bán',
    parent: { name: 'products', label: 'Sản phẩm', to: '/products' },
  },
  'stock-imports': { title: 'Nhập kho', subtitle: 'Phiếu nhập hàng — thêm sản phẩm mới vào hệ thống' },
  'stock-import-create': {
    title: 'Tạo phiếu nhập',
    subtitle: 'Thêm sản phẩm mới, số lượng, IMEI và xác nhận nhập kho',
    parent: { name: 'stock-imports', to: '/inventory/imports' },
  },
  'stock-import-detail': {
    title: 'Chi tiết phiếu nhập',
    subtitle: 'Xem và chỉnh sửa phiếu nhập kho',
    parent: { name: 'stock-imports', to: '/inventory/imports' },
  },
  pos: { title: 'Quầy bán hàng', subtitle: 'Bán hàng và thanh toán tại quầy' },
  orders: { title: 'Đơn hàng', subtitle: 'Hóa đơn bán ra trong ngày' },
  customers: { title: 'Khách hàng', subtitle: 'Thông tin và lịch sử mua hàng' },
  finance: { title: 'Thu chi', subtitle: 'Sổ quỹ cửa hàng' },
  quan: { title: 'Quản lý Quán', subtitle: 'Quầy bán nhanh — thêm sản phẩm tại chỗ, ghi chi, tổng kết ngày' },
  'quan-statements': {
    title: 'Sao kê theo ngày',
    subtitle: 'Lưu trữ và in lại sao kê thu — chi theo từng ngày',
    parent: { name: 'reports', label: 'Báo cáo', to: '/reports' },
  },
  statements: {
    title: 'Sao kê theo ngày',
    subtitle: 'Lưu trữ và in lại sao kê thu — chi theo từng ngày',
    parent: { name: 'reports', label: 'Báo cáo', to: '/reports' },
  },
  'quan-costs': {
    title: 'Giá nhập & tiền lời',
    subtitle: 'Nhập giá vốn từng sản phẩm và tổng hợp lời theo kỳ',
  },
  'lao-listen': { title: 'Nghe tiếng Lào', subtitle: 'Nhận giọng nói Lào và dịch sang tiếng Việt' },
  reports: { title: 'Báo cáo', subtitle: 'Doanh thu và tồn kho theo kỳ' },
  warranty: { title: 'Bảo hành', subtitle: 'Tra cứu IMEI và phiếu sửa chữa' },
  appraisal: {
    title: 'Thẩm định máy',
    subtitle: 'AutoGrade — ảnh YOLO/OCR, khấu hao, FinalPrice',
  },
  consult: {
    title: 'Quầy tư vấn',
    subtitle: 'Tiếp nhận hotline — ghi KH, ghi chú, ghi âm cuộc gọi',
  },
  users: { title: 'Nhân viên', subtitle: 'Tạo và quản lý tài khoản đăng nhập' },
  profile: { title: 'Hồ sơ cá nhân', subtitle: 'Thông tin tài khoản và bảo mật' },
}
