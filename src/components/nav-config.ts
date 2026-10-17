import {
  LayoutDashboard,
  ListFilter,
  Plus,
  PackageOpen,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Utama",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Ringkasan statistik & grafik penjualan",
      },
      {
        title: "Semua Transaksi",
        href: "/transactions",
        icon: ListFilter,
        description: "Kelola seluruh data pembelian & penjualan",
      },
      {
        title: "Tambah Akun",
        href: "/transactions/new",
        icon: Plus,
        description: "Catat pembelian akun baru",
      },
      {
        title: "Stok Belum Laku",
        href: "/stock",
        icon: PackageOpen,
        description: "Akun yang belum terjual",
      },
      {
        title: "Laporan",
        href: "/reports",
        icon: FileText,
        description: "Laporan & export CSV/Excel",
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        title: "Pengaturan",
        href: "/settings",
        icon: Settings,
        description: "Koneksi Google Sheets & akun",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

export function findNavItem(pathname: string): NavItem | undefined {
  const matches = NAV_ITEMS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length);
  return matches[0];
}
