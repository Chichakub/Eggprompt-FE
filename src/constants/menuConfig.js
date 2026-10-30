import { SUPER_ADMIN, FARM_ADMIN, FARM_STAFF, FINANCE_STAFF } from './roles';

const link = (label, to, icon) => ({ type: 'link', label, to, icon });
const group = (key, label, icon, children) => ({ type: 'group', key, label, icon, children });
const sub = (label, to) => ({ label, to });

const FARM_INFO = sub('ข้อมูลฟาร์ม', '/farm/info');
const HOUSES = sub('ข้อมูลโรงเรือน', '/farm/houses');
const FLOCKS = sub('ข้อมูลฝูงไก่', '/farm/flocks');

const FEED = sub('จัดการอาหาร', '/operations/feed');
const HEALTH = sub('ข้อมูลสุขภาพไก่', '/operations/health');
const EGGS = sub('จัดการผลผลิตไข่', '/operations/eggs');
const MAINTENANCE = sub('การบำรุงรักษา', '/operations/maintenance');

const SUPPLIES = sub('คลังยา อาหาร และวิตามิน', '/inventory/supplies');
const SUPPLIERS = sub('จัดการซัพพลายเออร์', '/inventory/suppliers');

const INCOME = sub('รายรับ', '/finance/income');
const EXPENSE = sub('รายจ่าย', '/finance/expense');
const COST = sub('ต้นทุน', '/finance/cost');
const FIN_REPORT = sub('รายงานทางการเงิน', '/finance/reports');

const dashboard = link('แดชบอร์ด', '/dashboard', 'LayoutDashboard');
const operations = group('operations', 'ดำเนินงานในฟาร์ม', 'ClipboardList', [
  FEED,
  HEALTH,
  EGGS,
  MAINTENANCE,
]);
const finance = group('finance', 'การเงิน', 'Wallet', [INCOME, EXPENSE, COST, FIN_REPORT]);
const users = link('จัดการผู้ใช้งาน', '/users', 'UserPlus');
const history = link('ประวัติการใช้งาน', '/audit-logs', 'History');


const SUPER_ADMIN_MENU = [
  group('farms', 'ฟาร์ม', 'Warehouse', [
    sub('ฟาร์มทั้งหมด', '/farms'),
    sub('ลงทะเบียนฟาร์มใหม่', '/farms/new'),
  ]),
  users,
  history,
];

const FARM_ADMIN_MENU = [
  dashboard,
  group('farm', 'จัดการฟาร์ม', 'Warehouse', [FARM_INFO, HOUSES, FLOCKS]),
  operations,
  group('inventory', 'จัดการคลังสินค้า', 'Package', [SUPPLIES, SUPPLIERS]),
  finance,
  users,
  history,
];

const FARM_STAFF_MENU = [
  group('farm', 'จัดการฟาร์ม', 'Warehouse', [HOUSES, FLOCKS]),
  operations,
  group('inventory', 'จัดการคลังสินค้า', 'Package', [SUPPLIES]),
];

const FINANCE_STAFF_MENU = [
  group('inventory', 'จัดการคลังสินค้า', 'Package', [SUPPLIES, SUPPLIERS]),
  finance,
];

export function getMenu(role) {
  switch (role) {
    case SUPER_ADMIN: return SUPER_ADMIN_MENU;
    case FARM_ADMIN: return FARM_ADMIN_MENU;
    case FARM_STAFF: return FARM_STAFF_MENU;
    case FINANCE_STAFF: return FINANCE_STAFF_MENU;
    default: return [];
  }
}