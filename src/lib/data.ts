export type UserRole = "Admin" | "Guru" | "Siswa" | "Kurikulum" | "Kepsek";
export type UserStatus = "Aktif" | "Non-aktif";

export interface UserRecord {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  telepon?: string;
  kelas?: string;
  nip?: string;
  nis?: string;
  createdAt: string;
}

export interface GuruRecord { id: string; nama: string; nip: string; email: string; mapel: string; kelas: string; status: UserStatus; }
export interface SiswaRecord { id: string; nama: string; nis: string; kelas: string; jurusan: string; email: string; status: UserStatus; }
export interface KelasRecord { id: string; nama: string; tingkat: string; jurusan: string; wali: string; jumlah: number; }
export interface MapelRecord { id: string; kode: string; nama: string; kelompok: string; jam: number; guru: string; }
export interface MaterialRecord { id: string; judul: string; mapel: string; kelas: string; type: string; status: string; updated: string; }
export interface TaskRecord { id: string; judul: string; mapel: string; kelas: string; deadline: string; status: string; pengumpulan: number; total: number; }
export interface Announcement { id: string; judul: string; kategori: string; audience: string; tanggal: string; status: string; }
export interface GradeRecord { id: string; siswa: string; nis: string; kelas: string; mapel: string; tugas: number; uts: number; uas: number; akhir: number; predikat: string; }
export interface AttendanceRecord { id: string; siswaId: string; siswa: string; nis: string; kelas: string; tanggal: string; status: "Hadir" | "Izin" | "Alpa"; catatan: string; }
export interface ScheduleRecord { id: string; hari: string; jam: string; mapel: string; kelas: string; guru: string; }
export interface ReportRecord { id: string; judul: string; tanggal: string; format: "PDF" | "XLSX" | "CSV"; status: "Siap" | "Proses"; jenis: string; periode: string; }
export interface ActionRecord { id: string; title: string; detail: string; time: string; }

/**
 * Data awal aplikasi sengaja KOSONG.
 * Semua data operasional harus berasal dari MongoDB.
 */
export const seed = {
  users: [] as UserRecord[],
  guru: [] as GuruRecord[],
  siswa: [] as SiswaRecord[],
  kelas: [] as KelasRecord[],
  mapel: [] as MapelRecord[],
  material: [] as MaterialRecord[],
  tasks: [] as TaskRecord[],
  announcements: [] as Announcement[],
  grades: [] as GradeRecord[],
  attendance: [] as AttendanceRecord[],
  schedules: [] as ScheduleRecord[],
  reports: [] as ReportRecord[],
  actions: [] as ActionRecord[],
};

/** Jurusan resmi SMK Citra Negara yang digunakan pada form/validasi UI. */
export const MAJORS = [
  "DKV",
  "MPLB",
  "PPLG",
  "Perhotelan",
  "TJKT",
  "Pemasaran",
] as const;

export type Major = (typeof MAJORS)[number];
