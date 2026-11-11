import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Megaphone,
  Settings2,
  ShieldCheck,
  UserCircle,
  Users,
  School,
  BookMarked,
  Calculator,
  CheckSquare2,
  LibraryBig,
  UserRoundCheck,
  FileText,
} from "lucide-react";

export type Role = "admin" | "guru" | "siswa" | "kurikulum" | "kepsek";
export type RoleLabel = "Administrator" | "Guru" | "Siswa" | "Kurikulum" | "Kepala Sekolah";

export const roleMeta: Record<Role, { label: RoleLabel; short: string; color: string; description: string }> = {
  admin: { label: "Administrator", short: "Admin", color: "emerald", description: "Kelola seluruh sistem EduCN, pengguna, keamanan, dan konfigurasi." },
  guru: { label: "Guru", short: "Guru", color: "cyan", description: "Kelola kelas, materi, tugas, kehadiran, dan penilaian siswa." },
  siswa: { label: "Siswa", short: "Siswa", color: "lime", description: "Akses pembelajaran, tugas, jadwal, nilai, dan pengumuman." },
  kurikulum: { label: "Kurikulum", short: "Kurikulum", color: "violet", description: "Kelola struktur akademik, mata pelajaran, nilai, dan laporan." },
  kepsek: { label: "Kepala Sekolah", short: "Kepsek", color: "amber", description: "Pantau ringkasan sekolah, guru, siswa, kelas, dan laporan." },
};

type Nav = { href: string; label: string; icon: typeof LayoutDashboard };

const common: Nav[] = [
  { href: "", label: "Beranda", icon: LayoutDashboard },
  { href: "profil", label: "Profil", icon: UserCircle },
];

export const roleNav: Record<Role, Nav[]> = {
  admin: [
    { href: "", label: "Beranda", icon: LayoutDashboard },
    { href: "pengguna", label: "Pengguna", icon: Users },
    { href: "guru", label: "Data Guru", icon: GraduationCap },
    { href: "siswa", label: "Data Siswa", icon: UserRoundCheck },
    { href: "kelas", label: "Kelas", icon: School },
    { href: "mapel", label: "Mata Pelajaran", icon: BookMarked },
    { href: "aktivitas", label: "Aktivitas", icon: Activity },
    { href: "pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "pengaturan", label: "Pengaturan", icon: Settings2 },
    { href: "bantuan", label: "Bantuan", icon: HelpCircle },
  ],
  guru: [
    { href: "", label: "Beranda", icon: LayoutDashboard },
    { href: "kelas", label: "Kelas Saya", icon: School },
    { href: "materi", label: "Materi", icon: LibraryBig },
    { href: "tugas", label: "Tugas", icon: ClipboardList },
    { href: "penilaian", label: "Penilaian", icon: ClipboardCheck },
    { href: "kehadiran", label: "Kehadiran", icon: CheckSquare2 },
    { href: "pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "bantuan", label: "Bantuan", icon: HelpCircle },
    { href: "pengaturan", label: "Pengaturan", icon: Settings2 },
    ...common.filter((n) => n.href),
  ],
  siswa: [
    { href: "", label: "Beranda", icon: LayoutDashboard },
    { href: "kelas", label: "Kelas Saya", icon: School },
    { href: "materi", label: "Materi", icon: BookOpen },
    { href: "tugas", label: "Tugas", icon: ClipboardList },
    { href: "nilai", label: "Nilai Saya", icon: BarChart3 },
    { href: "jadwal", label: "Jadwal", icon: CalendarDays },
    { href: "pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "bantuan", label: "Bantuan", icon: HelpCircle },
    { href: "pengaturan", label: "Pengaturan", icon: Settings2 },
    ...common.filter((n) => n.href),
  ],
  kurikulum: [
    { href: "", label: "Beranda", icon: LayoutDashboard },
    { href: "guru", label: "Guru", icon: GraduationCap },
    { href: "kelas", label: "Kelas", icon: School },
    { href: "siswa", label: "Siswa", icon: UserRoundCheck },
    { href: "mapel", label: "Mata Pelajaran", icon: BookMarked },
    { href: "nilai", label: "Generate Nilai", icon: Calculator },
    { href: "laporan", label: "Laporan", icon: FileBarChart },
    { href: "pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "bantuan", label: "Bantuan", icon: HelpCircle },
    { href: "pengaturan", label: "Pengaturan", icon: Settings2 },
    ...common.filter((n) => n.href),
  ],
  kepsek: [
    { href: "", label: "Beranda", icon: LayoutDashboard },
    { href: "guru", label: "Guru", icon: GraduationCap },
    { href: "kelas", label: "Kelas", icon: School },
    { href: "siswa", label: "Siswa", icon: UserRoundCheck },
    { href: "laporan", label: "Laporan", icon: FileBarChart },
    { href: "pengumuman", label: "Pengumuman", icon: Megaphone },
    { href: "aktivitas", label: "Aktivitas", icon: Activity },
    { href: "bantuan", label: "Bantuan", icon: HelpCircle },
    { href: "pengaturan", label: "Pengaturan", icon: Settings2 },
    ...common.filter((n) => n.href),
  ],
};

export const routeLabel = (role: Role, segment?: string) => {
  const found = roleNav[role].find((n) => n.href === (segment ?? ""));
  return found?.label ?? "Beranda";
};
