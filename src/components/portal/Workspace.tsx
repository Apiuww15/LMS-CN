"use client";

import Link from "next/link";
import { FormEvent, ReactElement, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowUpRight, BarChart3, Bell, BookOpen, BookMarked, CalendarDays, CheckCircle2,
  CheckSquare2, ChevronDown, CircleAlert, Clock3, Download, FileBarChart, GraduationCap, HardDrive,
  Info, LayoutDashboard, Megaphone, MoreHorizontal, Pencil, Plus, RefreshCcw, Search, Server, ShieldCheck,
  Sparkles, Trash2, UserCircle2, Users, X, School, ClipboardList, Calculator, Eye, Filter, LockKeyhole,
  Settings2, MessageCircle, Trophy, Target, ClipboardCheck, LibraryBig, UserRoundCheck, FileText, UploadCloud, FileCheck
} from "lucide-react";
import { GradeRecord, MAJORS, seed, UserRecord } from "@/lib/data";
import { Role, roleMeta, roleNav } from "@/lib/portal";
import { fetchCollection, loadCollection, logAction, saveCollection, uid, resetCollection } from "@/lib/store";
import Modal from "./Modal";
import * as XLSX from "xlsx";

const roleNames: Record<Role, string> = { admin: "Administrator", guru: "Guru", siswa: "Siswa", kurikulum: "Kurikulum", kepsek: "Kepala Sekolah" };

const roleAccent: Record<Role, { soft: string; icon: string; gradient: string }> = {
  admin: { soft: "mint", icon: "text-[#006c49]", gradient: "from-[#063d2b] via-[#006c49] to-[#0e7662]" },
  guru: { soft: "cyan", icon: "text-[#007b87]", gradient: "from-[#083a42] via-[#0c7780] to-[#11a9a8]" },
  siswa: { soft: "lime", icon: "text-[#5b7700]", gradient: "from-[#284200] via-[#608a00] to-[#93ad1d]" },
  kurikulum: { soft: "violet", icon: "text-[#6551a8]", gradient: "from-[#2b1e55] via-[#6e56b9] to-[#8e77df]" },
  kepsek: { soft: "amber", icon: "text-[#9a6100]", gradient: "from-[#4b3104] via-[#9a6708] to-[#c29324]" },
};

function toast(message: string) { window.dispatchEvent(new CustomEvent("educn-toast", { detail: message })); }

export default function Workspace({ role, segment }: { role: Role; segment: string }) {
  if (!segment) return <Dashboard role={role} />;
  const allowed = roleNav[role].some((item) => item.href === segment);
  if (!allowed) return <NotFound role={role} />;
  const Page = routePages[segment];
  if (!Page) return <NotFound role={role} />;
  return <Page role={role} />;
}

function Dashboard({ role }: { role: Role }) {
  const accent = roleAccent[role];
  const [displayName, setDisplayName] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async (response) => response.ok ? await response.json() as { user?: { nama?: string } } : null)
      .then((data) => { if (active && data?.user?.nama) setDisplayName(data.user.nama); })
      .catch(() => { if (active) setDisplayName(""); });
    return () => { active = false; };
  }, []);
  const summary = useLiveSummary();
  const counts = summary?.counts;
  const isLoading = !summary;

  const cards = role === "admin"
    ? [
        { label: "Total Pengguna", value: counts?.users ?? 0, helper: `${counts?.activeUsers ?? 0} akun aktif`, icon: Users },
        { label: "Siswa Aktif", value: counts?.activeSiswa ?? 0, helper: "Data dari MongoDB", icon: GraduationCap },
        { label: "Guru Aktif", value: counts?.activeGuru ?? 0, helper: "Data dari MongoDB", icon: UserCircle2 },
        { label: "Status Server", value: isLoading ? "..." : "ONLINE", helper: summary?.generatedAt ? `Sinkron ${new Date(summary.generatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "", icon: Server },
      ]
    : role === "guru"
      ? [
          { label: "Kelas Saya", value: counts?.kelas ?? 0, helper: "Belum ada data" , icon: School },
          { label: "Siswa", value: counts?.siswa ?? 0, helper: "Data terdaftar" , icon: Users },
          { label: "Tugas", value: counts?.tasks ?? 0, helper: "Tersimpan di MongoDB" , icon: ClipboardList },
          { label: "Nilai", value: counts?.grades ?? 0, helper: "Belum ada nilai jika masih 0" , icon: Trophy },
        ]
      : role === "siswa"
        ? [
            { label: "Kelas", value: counts?.kelas ?? 0, helper: "Data kelas tersedia", icon: School },
            { label: "Materi", value: counts?.material ?? 0, helper: "Belum ada materi", icon: BookOpen },
            { label: "Tugas", value: counts?.tasks ?? 0, helper: "Belum ada tugas", icon: ClipboardList },
            { label: "Nilai", value: counts?.grades ?? 0, helper: "Belum ada nilai", icon: Trophy },
          ]
        : role === "kurikulum"
          ? [
              { label: "Total Guru", value: counts?.guru ?? 0, helper: `${counts?.activeGuru ?? 0} aktif`, icon: GraduationCap },
              { label: "Total Kelas", value: counts?.kelas ?? 0, helper: "Data rombel", icon: School },
              { label: "Mata Pelajaran", value: counts?.mapel ?? 0, helper: "Data kurikulum", icon: BookMarked },
              { label: "Nilai", value: counts?.grades ?? 0, helper: summary?.metrics.avgGrade ? `Rata-rata ${summary.metrics.avgGrade}` : "Belum ada nilai", icon: Calculator },
            ]
          : [
              { label: "Total Siswa", value: counts?.siswa ?? 0, helper: `${counts?.activeSiswa ?? 0} aktif`, icon: GraduationCap },
              { label: "Total Guru", value: counts?.guru ?? 0, helper: `${counts?.activeGuru ?? 0} aktif`, icon: Users },
              { label: "Total Kelas", value: counts?.kelas ?? 0, helper: "Data rombel", icon: School },
              { label: "Nilai", value: counts?.grades ?? 0, helper: summary?.metrics.avgGrade ? `Rata-rata ${summary.metrics.avgGrade}` : "Belum ada nilai", icon: CheckSquare2 },
            ];

  return <div className="space-y-6 fade-up">
    <section className={`hero-banner bg-gradient-to-br ${accent.gradient}`}>
      <div className="hero-grid" />
      <div className="hero-content">
        <p className="hero-kicker">Dashboard {roleMeta[role].label}</p>
        <h2>Selamat datang, {displayName || roleMeta[role].label} 👋</h2>
        <p>{roleMeta[role].description}</p>
        <div className="hero-actions">
          <Link href={`/${role}/profil`} className="hero-btn">Lihat Profil <ArrowUpRight/></Link>
          <button onClick={() => window.location.reload()} className="hero-btn ghost"><RefreshCcw/> Segarkan Data</button>
        </div>
      </div>
      <div className="hero-art"><div className="hero-orb a"/><div className="hero-orb b"/><div className="hero-orb c"/><Sparkles/></div>
    </section>

    <section className="stat-grid">{cards.map((c) => <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} helper={c.helper} />)}</section>
    <LiveRoleBody role={role} summary={summary} />
  </div>;
}

function StatCard({ icon: Icon, label, value, helper }: { icon: any; label: string; value: string | number; helper: string }) {
  return <div className="glass-card-strong stat-card"><span className="stat-icon"><Icon/></span><div className="min-w-0"><p className="eyebrow">{label}</p><p className="stat-value">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p><p className="stat-helper">{helper}</p></div><ArrowUpRight className="stat-arrow"/></div>;
}

type SummaryResponse = {
  ok: boolean;
  generatedAt: string;
  role: Role;
  counts: Record<string, number> & { activeUsers: number; activeGuru: number; activeSiswa: number };
  metrics: { avgGrade: number };
};

function useLiveSummary() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  useEffect(() => {
    let active = true;
    let running = false;

    const read = async () => {
      if (!active || running) return;
      running = true;

      try {
        const response = await fetch("/api/summary", {
          cache: "no-store",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) return;

        const data = (await response.json()) as SummaryResponse;

        if (active && data.ok) {
          setSummary(data);
        }
      } catch {
        // Pertahankan data terakhir saat koneksi sesaat gagal.
      } finally {
        running = false;
      }
    };

    void read();
    const timer = window.setInterval(read, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return summary;
}

function LiveRoleBody({ role, summary }: { role: Role; summary: SummaryResponse | null }) {
  const [actions, setActions] = useState<any[]>([]);
  const [majors, setMajors] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    let running = false;

    const read = async () => {
      if (!active || running) return;
      running = true;

      try {
        if (role === "admin" || role === "kepsek") {
          const actionResponse = await fetch("/api/data/actions", {
            cache: "no-store",
            credentials: "include",
            headers: { Accept: "application/json", "Cache-Control": "no-cache" },
          });

          if (actionResponse.ok) {
            const actionJson = (await actionResponse.json()) as { data?: any[] };
            if (active) {
              setActions(Array.isArray(actionJson.data) ? actionJson.data.slice(0, 6) : []);
            }
          }
        }

        const siswaResponse = await fetch("/api/data/siswa", {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json", "Cache-Control": "no-cache" },
        });

        if (siswaResponse.ok) {
          const siswaJson = (await siswaResponse.json()) as { data?: any[] };
          const map: Record<string, number> = {};

          for (const item of Array.isArray(siswaJson.data) ? siswaJson.data : []) {
            const jurusan = typeof item?.jurusan === "string" ? item.jurusan.trim() : "";
            if (!jurusan) continue;
            map[jurusan] = (map[jurusan] || 0) + 1;
          }

          if (active) setMajors(map);
        }
      } catch {
        // Kegagalan polling sesaat tidak menghapus data terakhir.
      } finally {
        running = false;
      }
    };

    void read();
    const timer = window.setInterval(read, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [role]);

  return <>
    <section className="dashboard-grid-2">
      <Card title="Aktivitas Terbaru" subtitle="Diambil langsung dari MongoDB.">
        {actions.length === 0 ? <EmptyStateText text="Belum ada aktivitas tersimpan." /> : <div className="activity-list">{actions.map((item) => <div className="activity-row" key={item.id}><span className="activity-symbol success"><Activity/></span><div><b>{item.title}</b><small>{item.time || "Baru saja"}</small></div></div>)}</div>}
      </Card>
      <Card title="Ringkasan Data" subtitle="Angka berubah mengikuti database.">
        <div className="metric-grid">
          <Metric label="Pengumuman" value={String(summary?.counts.announcements ?? 0)} icon={Megaphone}/>
          <Metric label="Materi" value={String(summary?.counts.material ?? 0)} icon={BookOpen}/>
          <Metric label="Tugas" value={String(summary?.counts.tasks ?? 0)} icon={ClipboardList}/>
          <Metric label="Nilai" value={String(summary?.counts.grades ?? 0)} icon={Calculator}/>
        </div>
      </Card>
    </section>
    <section className="dashboard-grid-2">
      <Card title={role === "siswa" ? "Jurusan Saya" : role === "guru" ? "Jurusan Siswa di Kelas Saya" : "Sebaran Jurusan"} subtitle={role === "siswa" ? "Berdasarkan profil akun siswa yang sedang login." : role === "guru" ? "Berdasarkan siswa pada kelas yang ditugaskan kepada Anda." : "Berdasarkan data siswa yang tersimpan."}>
        <div className="simple-metrics">{MAJORS.map((major) => <div key={major}><span>{major}</span><b>{majors[major] ?? 0}</b></div>)}</div>
      </Card>
      <Card title="Status Data" subtitle="Tidak ada data contoh bawaan.">
        <div className="insight-strip compact"><div><p className="eyebrow">MongoDB Live</p><h3>{((role === "admin" || role === "kurikulum" || role === "kepsek") ? (summary?.counts.users ?? 0) : ((summary?.counts.kelas ?? 0) + (summary?.counts.material ?? 0) + (summary?.counts.tasks ?? 0) + (summary?.counts.grades ?? 0))) === 0 ? "Belum ada data untuk akun ini" : "Data akun berhasil dimuat"}</h3><p>Informasi yang ditampilkan mengikuti hak akses dan akun yang sedang login.</p></div><div className="insight-badge"><CheckCircle2/><span>Sinkron otomatis setiap 5 detik</span></div></div>
      </Card>
    </section>
  </>;
}

function EmptyStateText({ text }: { text: string }) { return <div className="empty-state"><Info/><b>Belum ada data</b><span>{text}</span></div>; }

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <div className={`glass-card-strong card ${className}`}><div className="card-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div><MoreHorizontal className="muted-icon"/></div>{children}</div>;
}

function QuickActions({ items }: { items: [string,string,any][] }) { return <div className="quick-grid">{items.map(([href, label, Icon]) => <Link className="quick-item" href={href} key={href}><span><Icon/></span><b>{label}</b><ArrowUpRight/></Link>)}</div>; }
function MiniBarChart({ values, labels }: { values: number[]; labels: string[] }) { const max = Math.max(...values); return <div className="bar-chart">{values.map((v, i) => <div className="bar-col" key={labels[i]}><div className={`bar ${v === max ? "peak" : ""}`} style={{ height: `${Math.max(15, (v / max) * 100)}%` }} /><span>{labels[i]}</span></div>)}</div>; }
function MiniProgress({ label, percent }: { label: string; percent: number }) { return <div className="mini-progress"><div><span>{label}</span><b>{percent}%</b></div><div className="progress"><span style={{width: `${percent}%`}}/></div></div>; }
function ScheduleItems({ items }: { items: string[][] }) { return <div className="schedule-list">{items.map(([time, title, meta]) => <div className="schedule-item" key={`${time}-${title}`}><span className="time-pill"><Clock3/></span><div><b>{title}</b><small>{time} · {meta}</small></div></div>)}</div>; }
function Timeline({ title, time }: { title: string; time: string }) { return <div className="timeline-item"><span/><div><b>{title}</b><small>{time}</small></div></div>; }
function Notice({ title, time }: { title: string; time: string }) { return <div className="notice-card"><Megaphone/><div><b>{title}</b><small>{time}</small></div></div>; }
function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: any }) { return <div className="metric-box"><span><Icon/></span><div><b>{value}</b><small>{label}</small></div></div>; }
function CheckItem({ title, percent }: { title: string; percent: number }) { return <div className="check-item"><div><b>{title}</b><span>{percent}%</span></div><div className="progress"><span style={{width:`${percent}%`}}/></div></div>; }
function DocumentItem({ title, type }: { title: string; type: string }) { return <button className="document-row" onClick={() => toast(`${title} dibuka`)}><span className="document-icon"><FileBarChart/></span><div><b>{title}</b><small>Dokumen {type}</small></div><Download/></button>; }

const typeConfig: Record<string, { title: string; description: string; key: keyof typeof seed; columns: string[]; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean }> = {
  pengguna: { title: "Manajemen Pengguna", description: "Kelola akun dan hak akses seluruh pengguna EduCN.", key: "users", columns: ["Nama","Email","Peran","Status","Aksi"], canCreate: true, canEdit: true, canDelete: true },
  guru: { title: "Data Guru", description: "Kelola data tenaga pendidik dan penempatan mengajar.", key: "guru", columns: ["Nama","NIP","Mata Pelajaran","Kelas","Status","Aksi"], canCreate: true, canEdit: true, canDelete: true },
  siswa: { title: "Data Siswa", description: "Kelola data peserta didik, jurusan, dan kelas.", key: "siswa", columns: ["Nama","NIS","Kelas","Jurusan","Status","Aksi"], canCreate: true, canEdit: true, canDelete: true },
  kelas: { title: "Data Kelas", description: "Kelola rombongan belajar, wali kelas, dan kapasitas siswa.", key: "kelas", columns: ["Kelas","Tingkat","Jurusan","Wali Kelas","Jumlah","Aksi"], canCreate: true, canEdit: true, canDelete: true },
  mapel: { title: "Mata Pelajaran", description: "Kelola struktur mata pelajaran, jam, dan guru pengampu.", key: "mapel", columns: ["Kode","Mata Pelajaran","Kelompok","Jam","Guru","Aksi"], canCreate: true, canEdit: true, canDelete: true },
};

function CrudPage({ role, type }: { role: Role; type: keyof typeof typeConfig }) {
  const cfg = typeConfig[type];
  const [rows, setRows] = useCollection(cfg.key);
  const [q, setQ] = useState(""); const [status, setStatus] = useState("Semua"); const [modal, setModal] = useState(false); const [view, setView] = useState<any>(null); const [editing, setEditing] = useState<any>(null); const [importOpen, setImportOpen] = useState(false);
  const canMutate = role === "admin";
  const filtered = useMemo(() => (rows as any[]).filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).filter((r) => status === "Semua" || r.status === status), [rows, q, status]);
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;

    const next = editing
      ? (rows as any[]).map((x) =>
          x.id === editing.id
            ? { ...x, ...data, ...normalizeType(type, data) }
            : x,
        )
      : [
          ...(rows as any[]),
          { id: uid(type.slice(0, 2)), ...normalizeType(type, data) },
        ];

    try {
      const saved = await saveCollection(cfg.key, next as any);
      setRows(saved as any);

      await logAction(
        `${editing ? "Mengubah" : "Menambahkan"} data ${cfg.title}`,
        editing?.nama || data.nama || data.judul || "",
      );

      toast(`${editing ? "Perubahan disimpan" : "Data berhasil ditambahkan"}`);
      setModal(false);
      setEditing(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data ke MongoDB.";
      toast(message);
    }
  };
  const remove = async (id: string) => { if (!confirm("Hapus data ini?")) return; const next=(rows as any[]).filter((x)=>x.id!==id); try { const saved = await saveCollection(cfg.key,next as any); setRows(saved as any); await logAction(`Menghapus data ${cfg.title}`); toast("Data berhasil dihapus"); } catch (error) { console.error(error); toast("Gagal menghapus dari MongoDB"); } };
  return <div className="space-y-5 fade-up"><PageHeader title={cfg.title} description={cfg.description} action={canMutate ? <div className="page-actions">{(type === "pengguna" || type === "siswa" || type === "guru") && <button className="secondary-btn" onClick={()=>setImportOpen(true)}><UploadCloud/> Import Excel</button>}<button className="primary-btn" onClick={()=>{setEditing(null);setModal(true)}}><Plus/> Tambah Data</button></div> : undefined}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari data..." value={q} onChange={(e)=>setQ(e.target.value)}/></div><select className="select" value={status} onChange={(e)=>setStatus(e.target.value)}><option>Semua</option><option>Aktif</option><option>Non-aktif</option></select><button className="secondary-btn" onClick={()=>{ const csv = toCsv(filtered as any[]); downloadText(csv, `${type}-educn.csv`, "text/csv"); toast("Data berhasil diekspor"); }}><Download/> Export</button></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr>{cfg.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{filtered.length===0?<tr><td colSpan={cfg.columns.length}><EmptyState/></td></tr>:filtered.map((row:any)=><tr key={row.id}><td><div className="cell-main"><span className="avatar">{initials(row.nama || row.nama)}</span><div><b>{row.nama || row.nama}</b><small>{row.email || row.nip || row.nis || row.kode}</small></div></div></td>{type==="pengguna" && <><td>{row.email}</td><td><span className="badge blue">{row.role}</span></td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="guru" && <><td>{row.nip}</td><td>{row.mapel}</td><td>{row.kelas}</td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="siswa" && <><td>{row.nis}</td><td>{row.kelas}</td><td>{row.jurusan}</td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="kelas" && <><td>{row.tingkat}</td><td>{row.jurusan}</td><td>{row.wali}</td><td>{row.jumlah}</td></>}{type==="mapel" && <><td>{row.nama}</td><td>{row.kelompok}</td><td>{row.jam} JP</td><td>{row.guru}</td></>}<td><div className="row-actions"><button className="table-action" onClick={()=>setView(row)} title="Lihat"><Eye/></button>{canMutate&&<button className="table-action" onClick={()=>{setEditing(row);setModal(true)}} title="Edit"><Pencil/></button>}{canMutate&&<button className="table-action danger" onClick={()=>remove(row.id)} title="Hapus"><Trash2/></button>}</div></td></tr>)}</tbody></table></div><div className="table-footer">Menampilkan <b>{filtered.length}</b> dari <b>{(rows as any[]).length}</b> data</div></div>
    <Modal open={modal} onClose={()=>{setModal(false);setEditing(null)}} title={editing ? `Edit ${cfg.title}` : `Tambah ${cfg.title}`} description="Lengkapi data dengan benar sebelum menyimpan."><CrudForm type={type} initial={editing} onSubmit={save} onCancel={() => { setModal(false); setEditing(null); }}/></Modal>
    <Modal open={!!view} onClose={()=>setView(null)} title="Detail Data" description="Informasi lengkap item yang dipilih."><DetailCard data={view}/></Modal>
    {(type === "pengguna" || type === "siswa" || type === "guru") && <ExcelImportModal type={type} open={importOpen} onClose={()=>setImportOpen(false)} onImported={async()=>{ const refreshed = await fetchCollection(cfg.key); setRows(refreshed as any); setImportOpen(false); }}/>}
  </div>;
}

function ExcelImportModal({ type, open, onClose, onImported }: { type: "pengguna" | "guru" | "siswa"; open: boolean; onClose: () => void; onImported: () => Promise<void> }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const title = type === "pengguna" ? "Impor Akun Pengguna" : type === "siswa" ? "Impor Data Siswa" : "Impor Data Guru";
  const headers = type === "pengguna"
    ? ["Nama", "Email", "Password", "Peran", "NIP", "Mata Pelajaran", "NIS", "Kelas", "Jurusan", "Status"]
    : type === "siswa"
      ? ["NIS", "Nama", "Email", "Password", "Kelas", "Jurusan", "Status"]
      : ["NIP", "Nama", "Email", "Password", "Mata Pelajaran", "Kelas", "Status"];
  const normalizeHeader = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const getValue = (row: Record<string, unknown>, aliases: string[]) => {
    const key = Object.keys(row).find((item) => aliases.includes(normalizeHeader(item)));
    return key ? String(row[key] ?? "").trim() : "";
  };
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(16, h.length + 5) }));
    XLSX.utils.book_append_sheet(wb, ws, type === "pengguna" ? "Akun Pengguna" : type === "siswa" ? "Data Siswa" : "Data Guru");
    const guide = type === "pengguna"
      ? [["Kolom", "Keterangan"], ["Nama", "Nama lengkap pengguna"], ["Email", "Email login yang unik"], ["Password", "Minimal 8 karakter"], ["Peran", "Admin / Guru / Siswa / Kurikulum / Kepsek"], ["NIP", "Wajib jika peran Guru"], ["Mata Pelajaran", "Wajib jika peran Guru"], ["NIS", "Wajib jika peran Siswa"], ["Kelas", "Wajib untuk Guru dan Siswa"], ["Jurusan", "Wajib jika peran Siswa; DKV / MPLB / PPLG / PERHOTELAN / TJKT / PEMASARAN"], ["Status", "Aktif atau Non-aktif; default Aktif"]]
      : type === "siswa"
        ? [["Kolom", "Keterangan"], ["NIS", "Wajib dan harus unik"], ["Nama", "Nama lengkap siswa"], ["Email", "Email login, harus unik"], ["Password", "Minimal 8 karakter untuk akun baru"], ["Kelas", "Contoh: X PPLG 1"], ["Jurusan", "DKV / MPLB / PPLG / PERHOTELAN / TJKT / PEMASARAN"], ["Status", "Aktif atau Non-aktif; jika kosong otomatis Aktif"]]
        : [["Kolom", "Keterangan"], ["NIP", "Wajib dan harus unik"], ["Nama", "Nama lengkap guru"], ["Email", "Email login, harus unik"], ["Password", "Minimal 8 karakter untuk akun baru"], ["Mata Pelajaran", "Mata pelajaran yang diampu"], ["Kelas", "Kelas yang diajar; boleh lebih dari satu dipisahkan koma"], ["Status", "Aktif atau Non-aktif; jika kosong otomatis Aktif"]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(guide), "Petunjuk");
    XLSX.writeFile(wb, type === "pengguna" ? "Template-Impor-Pengguna-EduCN.xlsx" : type === "siswa" ? "Template-Impor-Siswa-EduCN.xlsx" : "Template-Impor-Guru-EduCN.xlsx");
  };
  const readFile = async (file?: File) => {
    setError(""); setParsed([]);
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) { setError("Gunakan file Excel .xlsx atau .xls."); return; }
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "", raw: false });
      if (!raw.length) { setError("Sheet pertama belum berisi data."); return; }
      const mapped = raw.map((row) => type === "pengguna" ? ({
        nama: getValue(row, ["nama", "namalengkap"]), email: getValue(row, ["email", "emailaktif"]), password: getValue(row, ["password", "katasandi"]),
        role: getValue(row, ["peran", "role"]), nip: getValue(row, ["nip", "nomorindukpegawai"]), mapel: getValue(row, ["matapelajaran", "mapel"]),
        nis: getValue(row, ["nis", "nomorinduksiswa"]), kelas: getValue(row, ["kelas", "rombel"]), jurusan: getValue(row, ["jurusan", "programkeahlian"]), status: getValue(row, ["status"]) || "Aktif",
      }) : ({
        ...(type === "siswa" ? { nis: getValue(row, ["nis", "nomorinduksiswa"]) } : { nip: getValue(row, ["nip", "nomorindukpegawai"]) }),
        nama: getValue(row, ["nama", "namalengkap", "namasiswa", "namaguru"]), email: getValue(row, ["email", "emailaktif"]), password: getValue(row, ["password", "katasandi"]),
        kelas: getValue(row, ["kelas", "rombel"]), ...(type === "siswa" ? { jurusan: getValue(row, ["jurusan", "programkeahlian"]) } : { mapel: getValue(row, ["matapelajaran", "mapel"]) }), status: getValue(row, ["status"]) || "Aktif",
      })).filter((row) => Object.values(row).some((value) => String(value).trim()));
      if (!mapped.length) { setError("Tidak ada baris data yang bisa dibaca."); return; }
      if (mapped.length > 1000) { setError("Maksimal 1.000 baris per sekali impor."); return; }
      setFileName(file.name); setParsed(mapped);
    } catch { setError("File Excel tidak dapat dibaca. Pastikan file tidak rusak dan formatnya benar."); }
  };
  const submit = async () => {
    if (!parsed.length || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/data/import", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ collection: type, rows: parsed }) });
      const result = await response.json() as { error?: string; imported?: number };
      if (!response.ok) throw new Error(result.error || "Impor gagal disimpan.");
      toast(`${result.imported ?? parsed.length} ${type === "pengguna" ? "akun pengguna" : type === "siswa" ? "siswa" : "guru"} berhasil diimpor.`);
      await onImported(); setParsed([]); setFileName("");
    } catch (e) { setError(e instanceof Error ? e.message : "Impor gagal. Periksa kembali file Excel."); }
    finally { setBusy(false); }
  };
  return <Modal open={open} onClose={()=>{if(!busy){setParsed([]);setFileName("");setError("");onClose();}}} title={title} description="Impor data secara massal dengan proses yang jelas, aman, dan mudah diperiksa.">
    <div className="excel-import-body excel-import-v2">
      <section className="excel-import-hero">
        <div className="excel-hero-copy"><span className="excel-eyebrow"><Sparkles size={13}/> IMPORT CENTER · EDUCN</span><h3>Tambah banyak data,<br/><em>lebih cepat dan rapi.</em></h3><p>{type === "pengguna" ? "Masukkan akun dari berbagai peran dalam satu file Excel. Profil Guru dan Siswa akan dipasangkan otomatis." : `Masukkan banyak data ${type === "guru" ? "guru" : "siswa"} sekaligus tanpa mengisi formulir satu per satu.`}</p></div>
        <div className="excel-hero-art"><div className="excel-art-sheet"><FileCheck size={32}/><b>.XLSX</b><span>EDUCN DATA</span></div><span className="excel-art-orbit orbit-one"/><span className="excel-art-orbit orbit-two"/></div>
      </section>
      <div className="excel-import-steps"><div className="excel-step active"><span>01</span><div><b>Siapkan template</b><small>Unduh format resmi</small></div></div><div className="excel-step"><span>02</span><div><b>Unggah Excel</b><small>Pilih file .xlsx / .xls</small></div></div><div className="excel-step"><span>03</span><div><b>Periksa & impor</b><small>Validasi sebelum simpan</small></div></div></div>
      <div className="excel-template-card"><div className="excel-template-icon"><FileCheck size={22}/></div><div className="excel-template-copy"><b>Mulai dari template EduCN</b><p>Kolom sudah disesuaikan dengan data yang dibutuhkan sistem.</p></div><button type="button" className="secondary-btn" onClick={downloadTemplate}><Download size={16}/> Unduh template</button></div>
      <label className={`excel-dropzone excel-dropzone-v2 ${fileName ? "has-file" : ""}`}><input type="file" accept=".xlsx,.xls" onChange={(e)=>void readFile(e.target.files?.[0])}/><span className="excel-upload-icon"><UploadCloud size={27}/></span><b>{fileName || "Pilih file Excel untuk diunggah"}</b><span>{fileName ? "File terpilih · klik untuk mengganti file" : "Klik area ini untuk memilih file dari perangkat"}</span><small><b>XLSX</b><b>XLS</b><i>Maksimal 1.000 baris</i></small></label>
      {error && <div className="excel-error"><CircleAlert/>{error}</div>}
      {parsed.length > 0 && <div className="excel-preview excel-preview-v2"><div className="excel-preview-head"><div><b><CheckCircle2 size={16}/> File berhasil dibaca</b><span>{parsed.length} baris data siap diperiksa · password disembunyikan</span></div><span className="badge green">Terbaca</span></div><div className="excel-preview-list">{parsed.slice(0,6).map((row,index)=><div className="excel-preview-row" key={`${row.email}-${index}`}><span className="excel-row-number">{String(index+1).padStart(2,"0")}</span><div><b>{row.nama || "Nama belum diisi"}</b><small>{type === "pengguna" ? `${row.role || "Peran belum diisi"} · ${row.email}` : `${type === "siswa" ? row.nis : row.nip} · ${row.email} · ${row.kelas}`}</small></div><span className="badge blue">{row.status}</span></div>)}</div>{parsed.length>6&&<small className="excel-more">+ {parsed.length-6} baris lainnya</small>}</div>}
      <div className="excel-import-foot"><div><ShieldCheck size={17}/><span>Data akan divalidasi sebelum disimpan ke database.</span></div><div className="form-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={onClose}>Batal</button><button type="button" className="primary-btn" disabled={!parsed.length||busy} onClick={()=>void submit()}>{busy?<RefreshCcw className="animate-spin"/>:<UploadCloud/>}{busy?"Mengimpor...":`Impor ${parsed.length} Data`}</button></div></div>
    </div>
  </Modal>;
}

function CrudForm({ type, initial, onSubmit, onCancel }: { type: keyof typeof typeConfig; initial: any; onSubmit: (e: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const i=initial||{};
  const [selectedRole, setSelectedRole] = useState(String(i.role || "Siswa"));
  const input=(name:string,label:string,placeholder:string, value?:string, required=false)=><label className="field"><span>{label}</span><input className="input" name={name} defaultValue={value ?? i[name] ?? ""} placeholder={placeholder} required={required}/></label>;
  return <form onSubmit={onSubmit} className="form-grid">
    {type === "pengguna" && <>{input("nama","Nama Lengkap","Nama pengguna",undefined,true)} {input("email","Email","nama@sekolah.sch.id",undefined,true)} <label className="field"><span>Peran</span><select name="role" className="input" value={selectedRole} onChange={(e)=>setSelectedRole(e.target.value)}><option>Admin</option><option>Guru</option><option>Siswa</option><option>Kurikulum</option><option>Kepsek</option></select></label>
      {selectedRole === "Guru" && <>{input("nip","NIP","Nomor Induk Pegawai",undefined,true)} {input("mapel","Mata Pelajaran","Mata pelajaran yang diampu",undefined,true)} {input("kelas","Kelas","Contoh: X PPLG 1, XI PPLG 1")}</>}
      {selectedRole === "Siswa" && <>{input("nis","NIS","Nomor Induk Siswa",undefined,true)} {input("kelas","Kelas","Contoh: XI PPLG 1",undefined,true)} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||"DKV"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label></>}
      <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label><label className="field"><span>Kata Sandi {initial ? "(opsional)" : "(wajib)"}</span><input className="input" name="password" type="password" required={!initial} autoComplete="new-password" placeholder={initial?"Kosongkan jika tidak diubah":"Buat kata sandi akun"}/></label> {input("telepon","Telepon","08xxxxxxxxxx")}</>}
    {type === "guru" && <>{input("nama","Nama Guru","Nama lengkap")} {input("nip","NIP","NIP guru")} {input("email","Email","guru@educn.id")} <label className="field"><span>Kata Sandi {initial ? "(opsional)" : "(wajib)"}</span><input className="input" name="password" type="password" required={!initial} autoComplete="new-password" placeholder={initial ? "Kosongkan jika tidak diubah" : "Buat kata sandi akun guru"}/></label> {input("mapel","Mata Pelajaran","Contoh: Matematika")} {input("kelas","Kelas","Contoh: X PPLG 1, XI PPLG 1")} <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label></>}
    {type === "siswa" && <>{input("nama","Nama Siswa","Nama lengkap")} {input("nis","NIS","Nomor induk siswa")} {input("kelas","Kelas","Contoh: XI PPLG 1")} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||"DKV"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label> {input("email","Email","siswa@sekolah.sch.id")} <label className="field"><span>Kata Sandi {initial ? "(opsional)" : "(wajib)"}</span><input className="input" name="password" type="password" required={!initial} autoComplete="new-password" placeholder={initial ? "Kosongkan jika tidak diubah" : "Buat kata sandi akun siswa"}/></label> <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label></>}
    {type === "kelas" && <>{input("nama","Nama Kelas","Contoh: X PPLG 1")} {input("tingkat","Tingkat","X / XI / XII")} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||"DKV"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label> {input("wali","Wali Kelas","Nama guru")} {input("jumlah","Jumlah Siswa","0")}</>}
    {type === "mapel" && <>{input("kode","Kode","MTK-X")} {input("nama","Mata Pelajaran","Nama mata pelajaran")} {input("kelompok","Kelompok","Umum / Kejuruan")} {input("jam","Jam Pelajaran","4")} {input("guru","Guru Pengampu","Nama guru")}</>}
    <div className="form-actions"><button type="button" className="secondary-btn" onClick={onCancel}>Batal</button><button className="primary-btn"><CheckCircle2/> Simpan Data</button></div>
  </form>;
}

function normalizeType(type: keyof typeof typeConfig, data: any) {
  if (type === "kelas") return { ...data, jumlah: Number(data.jumlah || 0) };
  if (type === "mapel") return { ...data, jam: Number(data.jam || 0) };
  if (type === "pengguna") {
    const role = String(data.role || "Siswa");
    return {
      ...data,
      password: String(data.password || ""),
      nip: role === "Guru" ? String(data.nip || "").trim() : "",
      mapel: role === "Guru" ? String(data.mapel || "").trim() : "",
      nis: role === "Siswa" ? String(data.nis || "").trim() : "",
      kelas: ["Guru", "Siswa"].includes(role) ? String(data.kelas || "").trim() : "",
      jurusan: role === "Siswa" ? String(data.jurusan || "") : "",
    };
  }
  return data;
}
function useCollection<K extends keyof typeof seed>(key: K) {
  const [value, setValue] = useState<(typeof seed)[K]>(() => loadCollection(key));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    let running = false;

    const read = async () => {
      if (!active || running) return;
      running = true;

      try {
        const v = await fetchCollection(key);
        if (active) {
          setValue(v);
          setHydrated(true);
        }
      } catch {
        // A temporary API/network failure must not spam the console.
        // Keep the last known value and retry on the next interval.
        if (active) setHydrated(true);
      } finally {
        running = false;
      }
    };

    void read();
    const timer = window.setInterval(read, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [key]);

  return [
    value,
    (v: (typeof seed)[K]) => setValue(v),
    hydrated,
  ] as const;
}
function initials(name:string){ return name.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase(); }
function DetailCard({data}:{data:any}){ if(!data)return <EmptyState/>; return <div className="detail-grid">{Object.entries(data).filter(([k])=>k!=="id").map(([k,v])=><div className="detail-box" key={k}><small>{k.replace(/[A-Z]/g,m=>` ${m}`).toUpperCase()}</small><b>{String(v)}</b></div>)}</div>; }
function EmptyState(){return <div className="empty-state"><Search/><b>Data tidak ditemukan</b><span>Coba ubah kata kunci atau filter.</span></div>;}
function PageHeader({title,description,action}:{title:string;description:string;action?:ReactNode}){return <section className="page-header"><div><p className="eyebrow">EduCN Workspace</p><h2>{title}</h2><p>{description}</p></div>{action}</section>;}
function MetricTableCard({title,items}:{title:string;items:[string,string][]}){return <Card title={title}><div className="simple-metrics">{items.map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div></Card>;}

function ActivitiesPage({role}:{role:Role}){
  const [rows,setRows]=useCollection("actions" as any);
  const [q,setQ]=useState("");
  const filtered=(rows as any[]).filter(x=>`${x.title||""} ${x.detail||""}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="space-y-5 fade-up">
    <PageHeader title="Aktivitas & Audit Log" description="Pantau aktivitas yang benar-benar tercatat di MongoDB." action={<button className="secondary-btn" onClick={()=>{downloadText(toCsv(filtered),"aktivitas-educn.csv","text/csv");toast("Audit log diekspor")}}><Download/> Export Log</button>}/>
    <div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari aktivitas..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary-btn" onClick={()=>setQ("")}><RefreshCcw/> Reset</button></div>
    <div className="activity-page-grid">
      <Card title="Aktivitas Terbaru" subtitle={`${filtered.length} aktivitas dari database`}>
        {filtered.length===0 ? <EmptyStateText text="Belum ada aktivitas. Aktivitas akan muncul setelah ada tindakan nyata di sistem."/> : <div className="activity-large-list">{filtered.map((x:any)=><div className="activity-large" key={x.id}><span className="activity-symbol success"><Activity/></span><div><b>{x.title}</b><p>{x.detail || "Perubahan sistem"} · {x.time || ""}</p></div></div>)}</div>}
      </Card>
      <Card title="Status Keamanan" subtitle="Tanpa angka buatan.">
        <div className="security-card"><ShieldCheck/><div><b>{filtered.length===0?"Belum ada aktivitas keamanan":"Aktivitas tercatat"}</b><p>Informasi keamanan ditampilkan berdasarkan event yang tersimpan.</p></div></div>
        <div className="security-kpi"><span>Total event</span><b>{filtered.length}</b></div>
        <div className="security-kpi"><span>Periode</span><b>Realtime</b></div>
      </Card>
    </div>
  </div>;
}


function AnnouncementPage({role}:{role:Role}){ const can = role==="admin"||role==="guru"||role==="kurikulum"; const [rows,setRows]=useCollection("announcements"); const [open,setOpen]=useState(false); const [q,setQ]=useState(""); const filtered=(rows as any[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())); const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());const next=[{id:uid("ann"),judul:String(d.judul),kategori:String(d.kategori),audience:String(d.audience),tanggal:new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}),status:"Terbit"},...(rows as any[])];try{const saved=await saveCollection("announcements",next as any);setRows(saved as any);await logAction("Membuat pengumuman",String(d.judul));toast("Pengumuman diterbitkan");setOpen(false)}catch(error){console.error(error);toast("Gagal menyimpan pengumuman ke MongoDB")}}; return <div className="space-y-5 fade-up"><PageHeader title="Pengumuman" description="Sampaikan informasi penting kepada warga EduCN." action={can?<button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Buat Pengumuman</button>:undefined}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari pengumuman..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"pengumuman.csv","text/csv")}><Download/> Export</button></div><div className="announcement-grid">{filtered.map((x:any)=><article className="announcement-card" key={x.id}><div className="announcement-top"><span className="badge blue">{x.kategori}</span><span>{x.tanggal}</span></div><h3>{x.judul}</h3><p>Ditujukan untuk <b>{x.audience}</b> · Status {x.status}</p><div className="announcement-actions"><button className="secondary-btn" onClick={()=>toast(`Pengumuman "${x.judul}" dibuka`)}><Eye/> Lihat</button>{can&&<button className="table-action danger" onClick={async()=>{const next=(rows as any[]).filter((r)=>r.id!==x.id);try{const saved=await saveCollection("announcements",next as any);setRows(saved as any);await logAction("Menghapus pengumuman",x.judul);toast("Pengumuman dihapus")}catch(error){console.error(error);toast("Gagal menghapus pengumuman dari MongoDB")}}}><Trash2/></button>}</div></article>)}</div><Modal open={open} onClose={()=>setOpen(false)} title="Buat Pengumuman" description="Tulis informasi yang akan ditampilkan di sistem."><form className="form-grid" onSubmit={save}><label className="field full"><span>Judul</span><input className="input" name="judul" required placeholder="Judul pengumuman"/></label><label className="field"><span>Kategori</span><select className="input" name="kategori"><option>Akademik</option><option>Sistem</option><option>Internal</option><option>Kegiatan</option></select></label><label className="field"><span>Target</span><select className="input" name="audience"><option>Semua</option><option>Guru</option><option>Siswa</option><option>Kepala Sekolah</option></select></label><label className="field full"><span>Isi Pengumuman</span><textarea className="input min-h-32" name="isi" placeholder="Tulis isi pengumuman..."/></label><div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>Batal</button><button className="primary-btn"><Megaphone/> Terbitkan</button></div></form></Modal></div>; }

function MaterialPage({role}:{role:Role}){
  const can=role==="guru"||role==="admin";
  const [rows,setRows]=useCollection("material");
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState<any|null>(null);
  const [saving,setSaving]=useState(false);
  const filtered=(rows as any[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
  const save=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); if(saving)return; setSaving(true);
    const form=e.currentTarget; const d=new FormData(form);
    try{
      const id=uid("mat");
      const file=d.get("file");
      let uploaded:any=null;
      if(file instanceof File && file.size>0){
        const uploadForm=new FormData(); uploadForm.append("file",file); uploadForm.append("purpose","material"); uploadForm.append("recordId",id);
        const response=await fetch("/api/files",{method:"POST",body:uploadForm,credentials:"include"});
        uploaded=await response.json(); if(!response.ok)throw new Error(uploaded.error||"Upload file gagal");
      }
      const item={id,judul:String(d.get("judul")||""),mapel:String(d.get("mapel")||""),kelas:String(d.get("kelas")||""),type:uploaded?.fileName?.split(".").pop()?.toUpperCase()||String(d.get("type")||"Materi"),deskripsi:String(d.get("deskripsi")||""),fileId:uploaded?.fileId||"",fileName:uploaded?.fileName||"",fileSize:uploaded?.size||0,status:"Terbit",updated:new Date().toLocaleString("id-ID"),createdAt:new Date().toISOString()};
      const saved=await saveCollection("material",[item,...(rows as any[])] as any); setRows(saved as any); await logAction("Mengunggah materi",item.judul); toast("Materi dan lampiran berhasil disimpan"); setOpen(false); form.reset();
    }catch(error){console.error(error);toast(error instanceof Error?error.message:"Gagal menyimpan materi");}
    finally{setSaving(false);}
  };
  const removeMaterial=async(item:any)=>{
    if(!window.confirm(`Hapus materi "${item.judul}" beserta lampirannya?`))return;
    try{
      const response=await fetch(`/api/data/material?id=${encodeURIComponent(String(item.id))}`,{method:"DELETE",credentials:"include"});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Gagal menghapus materi");
      setRows((rows as any[]).filter((row:any)=>row.id!==item.id) as any);
      if(selected?.id===item.id)setSelected(null);
      await logAction("Menghapus materi",item.judul);toast("Materi dan lampiran berhasil dihapus");
    }catch(error){console.error(error);toast(error instanceof Error?error.message:"Gagal menghapus materi");}
  };
  const download=(id:string)=>window.open(`/api/files?id=${encodeURIComponent(id)}`,"_blank","noopener,noreferrer");
  return <div className="space-y-5 fade-up">
    <PageHeader title="Materi Pembelajaran" description={role==="siswa"?"Materi yang dibagikan guru untuk kelas kamu. Buka materi atau unduh lampirannya.":"Kelola materi digital, modul, video, dan bahan ajar."} action={can?<button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Tambah Materi</button>:undefined}/>
    <div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari materi..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"materi.csv","text/csv")}><Download/> Export</button></div>
    {filtered.length===0?<div className="glass-card-strong p-8 text-center text-slate-500">Belum ada materi yang dibagikan untuk kelas/akun ini.</div>:<div className="material-grid">{filtered.map((m:any)=><article className="material-card" key={m.id}><div className="material-thumb"><BookOpen/><span>{m.type||"Materi"}</span></div><div className="material-body"><div className="flex gap-2"><span className="badge green">{m.status||"Terbit"}</span><span className="badge gray">{m.kelas}</span></div><h3>{m.judul}</h3><p>{m.mapel}</p><div className="material-foot"><small>{m.fileName?`Lampiran: ${m.fileName}`:`Diperbarui ${m.updated||"-"}`}</small><div className="flex items-center gap-2"><button className="table-action" onClick={()=>setSelected(m)} aria-label="Buka materi"><Eye/></button>{can&&<button className="table-action danger" onClick={()=>void removeMaterial(m)} aria-label="Hapus materi" title="Hapus materi"><Trash2/></button>}</div></div></div></article>)}</div>}
    <Modal open={open} onClose={()=>setOpen(false)} title="Tambah Materi" description="Unggah file asli agar siswa dapat membaca atau mengunduhnya. Maksimal 50 MB."><form className="form-grid" onSubmit={save}>
      <label className="field full"><span>Judul Materi</span><input className="input" name="judul" required placeholder="Contoh: Pengenalan HTML & CSS"/></label>
      <label className="field"><span>Mata Pelajaran</span><input className="input" name="mapel" required placeholder="Pemrograman Web"/></label>
      <label className="field"><span>Kelas tujuan</span><input className="input" name="kelas" required placeholder="X PPLG 1"/></label>
      <label className="field"><span>Jenis materi</span><select className="input" name="type"><option>Modul</option><option>Video</option><option>Link</option><option>Dokumen</option></select></label>
      <label className="field full"><span>Deskripsi / petunjuk</span><textarea className="input min-h-24" name="deskripsi" placeholder="Jelaskan isi materi dan apa yang harus dipelajari siswa."/></label>
      <label className="field full"><span>File materi (PDF, Word, PPT, Excel, gambar, video, ZIP; maks. 50 MB)</span><input className="input" type="file" name="file" accept="*/*"/></label>
      <div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>Batal</button><button className="primary-btn" disabled={saving}><LibraryBig/> {saving?"Mengunggah...":"Simpan Materi"}</button></div>
    </form></Modal>
    <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected?.judul||"Detail Materi"} description={`${selected?.mapel||""} · ${selected?.kelas||""}`}>
      {selected&&<div className="space-y-4"><p className="whitespace-pre-wrap text-sm text-slate-600">{selected.deskripsi||"Guru belum menambahkan deskripsi untuk materi ini."}</p>{selected.fileId?<div className="space-y-3"><div className="rounded-xl border p-4 flex items-center justify-between gap-3"><div className="min-w-0"><b className="block truncate">{selected.fileName}</b><small className="text-slate-500">{selected.fileSize?`${(selected.fileSize/1024/1024).toFixed(2)} MB`:"Lampiran materi"}</small></div><button className="primary-btn" onClick={()=>download(selected.fileId)}><Download/> Unduh</button></div>{/\.pdf$/i.test(selected.fileName||"")&&<iframe title="Pratinjau materi PDF" src={`/api/files?id=${encodeURIComponent(selected.fileId)}&inline=1`} className="w-full rounded-xl border" style={{height: "65vh"}}/>}{/\.(png|jpe?g|gif|webp)$/i.test(selected.fileName||"")&&<img src={`/api/files?id=${encodeURIComponent(selected.fileId)}&inline=1`} alt={selected.judul} className="max-h-[65vh] max-w-full rounded-xl object-contain"/>}{/\.(mp4|mov|webm)$/i.test(selected.fileName||"")&&<video controls className="w-full rounded-xl" src={`/api/files?id=${encodeURIComponent(selected.fileId)}&inline=1`}/>}</div>:<p className="text-sm text-amber-700">Materi ini belum memiliki lampiran file.</p>}</div>}
    </Modal>
  </div>;
}

function TaskPage({role}:{role:Role}){
  const can=role==="guru"||role==="admin";
  const [rows,setRows]=useCollection("tasks");
  const [submissions,setSubmissions]=useCollection("submissions");
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState<any|null>(null);
  const [saving,setSaving]=useState(false);
  const [uploadingTask,setUploadingTask]=useState<string|null>(null);
  const filtered=(rows as any[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
  const save=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(saving)return;setSaving(true);
    const form=e.currentTarget;const d=new FormData(form);
    try{
      const id=uid("task");const file=d.get("file");let uploaded:any=null;
      if(file instanceof File&&file.size>0){const fd=new FormData();fd.append("file",file);fd.append("purpose","task");fd.append("recordId",id);const r=await fetch("/api/files",{method:"POST",body:fd,credentials:"include"});uploaded=await r.json();if(!r.ok)throw new Error(uploaded.error||"Upload lampiran gagal");}
      const item={id,judul:String(d.get("judul")||""),mapel:String(d.get("mapel")||""),kelas:String(d.get("kelas")||""),deadline:String(d.get("deadline")||""),deskripsi:String(d.get("deskripsi")||""),fileId:uploaded?.fileId||"",fileName:uploaded?.fileName||"",fileSize:uploaded?.size||0,status:"Aktif",pengumpulan:0,total:0,createdAt:new Date().toISOString()};
      const saved=await saveCollection("tasks",[item,...(rows as any[])] as any);setRows(saved as any);await logAction("Membuat tugas",item.judul);toast("Tugas dan lampiran berhasil diterbitkan");setOpen(false);form.reset();
    }catch(error){console.error(error);toast(error instanceof Error?error.message:"Gagal menyimpan tugas");}
    finally{setSaving(false);}
  };
  const removeTask=async(task:any)=>{
    if(!window.confirm(`Hapus tugas "${task.judul}"? Lampiran soal dan file jawaban siswa untuk tugas ini juga akan dihapus.`))return;
    try{
      const response=await fetch(`/api/data/tasks?id=${encodeURIComponent(String(task.id))}`,{method:"DELETE",credentials:"include"});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Gagal menghapus tugas");
      setRows((rows as any[]).filter((row:any)=>row.id!==task.id) as any);
      setSubmissions((submissions as any[]).filter((row:any)=>row.taskId!==task.id) as any);
      if(selected?.id===task.id)setSelected(null);
      await logAction("Menghapus tugas",task.judul);toast("Tugas dan seluruh lampiran terkait berhasil dihapus");
    }catch(error){console.error(error);toast(error instanceof Error?error.message:"Gagal menghapus tugas");}
  };
  const submitTask=async(task:any,file?:File)=>{
    if(!file){toast("Pilih file jawaban terlebih dahulu.");return;}
    setUploadingTask(String(task.id));
    const fd=new FormData();fd.append("file",file);fd.append("purpose","submission");fd.append("taskId",String(task.id));
    try{const r=await fetch("/api/files",{method:"POST",body:fd,credentials:"include"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Pengumpulan gagal");const fresh=await fetchCollection("submissions");setSubmissions(fresh as any);toast("Jawaban berhasil dikumpulkan");}
    catch(error){console.error(error);toast(error instanceof Error?error.message:"Gagal mengumpulkan tugas");}
    finally{setUploadingTask(null);}
  };
  const download=(id:string)=>window.open(`/api/files?id=${encodeURIComponent(id)}`,"_blank","noopener,noreferrer");
  const dueLabel=(value:string)=>{if(!value)return "Tanpa tenggat";const date=new Date(`${value}T23:59:59`);if(Number.isNaN(date.getTime()))return value;return date.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});};
  const isOverdue=(value:string)=>Boolean(value&&new Date(`${value}T23:59:59`).getTime()<Date.now());
  return <div className="space-y-5 fade-up">
    <PageHeader title="Tugas" description={can?"Buat, bagikan, dan pantau tugas untuk kelas yang kamu ajar.":"Semua tugas dari guru tersusun di sini. Baca instruksi, unduh lampiran, lalu kumpulkan jawaban sebelum tenggat."} action={can?<button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Buat Tugas</button>:undefined}/>
    {role==="siswa"&&<section className="student-task-hero"><div className="student-task-hero-icon"><ClipboardCheck/></div><div className="min-w-0"><span className="student-task-kicker">RUANG BELAJAR EDUCN</span><h3>Daftar Tugas Saya</h3><p>{filtered.length} tugas tersedia · {(submissions as any[]).filter((x:any)=>x.status==="Dikumpulkan").length} pengumpulan tercatat</p></div><div className="student-task-hero-mark"><BookOpen/></div></section>}
    <div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari judul, mapel, atau kelas..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"tugas.csv","text/csv")}><Download/> Export</button></div>
    {filtered.length===0?<div className="student-task-empty"><div className="student-task-empty-icon"><ClipboardList/></div><h3>Belum ada tugas</h3><p>Tugas yang dibagikan guru untuk kelas kamu akan muncul di halaman ini.</p></div>:<div className={can?"space-y-3":"student-task-list"}>{filtered.map((t:any)=>{
      const ownSubmission=(submissions as any[]).find((x:any)=>x.taskId===t.id);
      const count=(submissions as any[]).filter((x:any)=>x.taskId===t.id).length;
      const overdue=isOverdue(t.deadline);
      const done=Boolean(ownSubmission);
      return <article className={can?"glass-card-strong p-5 space-y-3":"student-task-card"} key={t.id}>
        <div className="student-task-card-top"><div className="student-task-subject-icon"><FileText/></div><div className="min-w-0 flex-1"><div className="student-task-tags"><span className="student-task-tag">{t.mapel||"Mata pelajaran"}</span><span className="student-task-tag muted">{t.kelas}</span></div><h3>{t.judul}</h3><p>Ditugaskan oleh guru · {t.createdAt?new Date(t.createdAt).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):""}</p></div><span className={`student-task-status ${can?"teacher":""} ${done?"done":overdue?"late":"pending"}`}>{can?"Diterbitkan":done?"Sudah dikumpulkan":overdue?"Tenggat lewat":"Belum dikumpulkan"}</span></div>
        <div className="student-task-deadline"><Clock3/><span>Batas pengumpulan</span><b className={overdue&&!done?"text-rose-600":""}>{dueLabel(t.deadline)}</b></div>
        <div className="student-task-instruction"><b>Instruksi tugas</b><p>{t.deskripsi||"Tidak ada instruksi tambahan dari guru."}</p></div>
        {t.fileId&&<div className="student-task-attachment"><div className="student-task-file-icon"><FileText/></div><div className="min-w-0 flex-1"><b>{t.fileName||"Lampiran tugas"}</b><small>{t.fileSize?`${(t.fileSize/1024/1024).toFixed(2)} MB · `:""}File soal dari guru</small></div><button className="secondary-btn compact" onClick={()=>download(t.fileId)}><Download/> Unduh soal</button></div>}
        {can?<div className="student-task-teacher-actions"><span><Users/> {count} pengumpulan siswa</span><div className="flex gap-2"><button className="secondary-btn compact" onClick={()=>setSelected(t)}><Eye/> Pengumpulan</button><button className="table-action danger" onClick={()=>void removeTask(t)} title="Hapus tugas"><Trash2/></button></div></div>:<div className="student-task-submit-panel"><div className="student-task-submit-heading"><div><b>{done?"Jawaban sudah dikumpulkan":"Kumpulkan jawaban"}</b><p>{done?`Dikirim ${new Date(ownSubmission.submittedAt).toLocaleString("id-ID")}`:overdue?"Tenggat sudah lewat. Pengumpulan dinonaktifkan.":"Unggah hasil pekerjaan kamu dalam bentuk file."}</p></div><span className={`student-task-submit-state ${done?"done":""}`}>{done?"Terkirim":"Aksi siswa"}</span></div>
          {done?<div className="student-task-submitted-file"><FileCheck/><div className="min-w-0 flex-1"><b>{ownSubmission.fileName||"File jawaban"}</b><small>Jawaban tersimpan di sistem</small></div><button className="secondary-btn compact" onClick={()=>download(ownSubmission.fileId)}><Download/> Unduh</button></div>:<label className={`student-task-upload ${overdue?"disabled":""}`}><UploadCloud/><span><b>{uploadingTask===String(t.id)?"Mengunggah jawaban...":"Pilih file jawaban"}</b><small>PDF, Word, PowerPoint, Excel, gambar, ZIP · Maksimal 50 MB</small></span><input type="file" accept="*/*" disabled={overdue||uploadingTask===String(t.id)} onChange={e=>{const f=e.target.files?.[0];if(f)void submitTask(t,f);e.currentTarget.value="";}}/></label>}
        </div>}
      </article>;
    })}</div>}
    <Modal open={open} onClose={()=>setOpen(false)} title="Buat Tugas" description="Tentukan kelas, instruksi, deadline, dan lampiran soal."><form className="form-grid" onSubmit={save}>
      <label className="field full"><span>Judul Tugas</span><input className="input" name="judul" required placeholder="Membuat Landing Page"/></label>
      <label className="field"><span>Mata Pelajaran</span><input className="input" name="mapel" required placeholder="Pemrograman Web"/></label>
      <label className="field"><span>Kelas tujuan</span><input className="input" name="kelas" required placeholder="X PPLG 1"/></label>
      <label className="field"><span>Batas pengumpulan</span><input className="input" type="date" name="deadline" required/></label>
      <label className="field full"><span>Instruksi tugas</span><textarea className="input min-h-24" name="deskripsi" required placeholder="Jelaskan apa yang harus dikerjakan siswa."/></label>
      <label className="field full"><span>Lampiran soal (opsional, maks. 50 MB)</span><input className="input" type="file" name="file" accept="*/*"/></label>
      <div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>Batal</button><button className="primary-btn" disabled={saving}><ClipboardList/> {saving?"Menyimpan...":"Terbitkan Tugas"}</button></div>
    </form></Modal>
    <Modal open={!!selected} onClose={()=>setSelected(null)} title={`Pengumpulan: ${selected?.judul||""}`} description="Daftar jawaban yang dikumpulkan siswa untuk tugas ini.">
      {selected&&<div className="space-y-2">{(submissions as any[]).filter((x:any)=>x.taskId===selected.id).length===0?<p className="text-sm text-slate-500">Belum ada siswa yang mengumpulkan jawaban.</p>:(submissions as any[]).filter((x:any)=>x.taskId===selected.id).map((x:any)=><div key={x.id} className="flex items-center justify-between gap-3 border rounded-xl p-3"><div><b>{x.studentName}</b><small className="block text-slate-500">{x.nis||""} · {new Date(x.submittedAt).toLocaleString("id-ID")}</small></div><button className="secondary-btn compact" onClick={()=>download(x.fileId)}><Download/> Unduh jawaban</button></div>)}</div>}
    </Modal>
  </div>;
}

function AttendancePage({role}:{role:Role}){
  const [classes]=useCollection("kelas");
  const [students]=useCollection("siswa");
  const [rows,setRows]=useCollection("attendance" as any);
  const [className,setClassName]=useState("");
  const [tanggal,setTanggal]=useState(new Date().toISOString().slice(0,10));
  const [att,setAtt]=useState<Record<string,string>>({});
  useEffect(()=>{ if(!className && (classes as any[]).length) setClassName((classes as any[])[0].nama); },[classes,className]);
  const list=(students as any[]).filter((x:any)=>!className || x.kelas===className);
  const save=async()=>{
    const today=(tanggal||new Date().toISOString().slice(0,10));
    const existing=(rows as any[]).filter((x:any)=>!(x.tanggal===today && x.kelas===className));
    const fresh=list.map((student:any)=>({id:uid("att"),siswaId:student.id,siswa:student.nama,nis:student.nis,kelas:student.kelas,tanggal:today,status:(att[student.id]||"Hadir"),catatan:""}));
    try { const saved=await saveCollection("attendance" as any,[...fresh,...existing] as any); setRows(saved as any); await logAction("Menyimpan kehadiran",`${className||"Semua kelas"} · ${today}`); toast("Kehadiran tersimpan ke MongoDB"); } catch(error){ console.error(error); toast("Gagal menyimpan kehadiran ke MongoDB"); }
  };
  const count=(status:string)=>(list as any[]).filter((s:any)=>(att[s.id]||"Hadir")===status).length;
  return <div className="space-y-5 fade-up">
    <PageHeader title="Kehadiran" description="Kehadiran tersimpan sebagai data nyata per siswa, kelas, dan tanggal." action={<div className="flex gap-2"><select className="select" value={className} onChange={e=>setClassName(e.target.value)}><option value="">Semua kelas</option>{(classes as any[]).map((x:any)=><option key={x.id}>{x.nama}</option>)}</select><input type="date" className="select" value={tanggal} onChange={e=>setTanggal(e.target.value)}/><button className="primary-btn" onClick={save} disabled={!list.length}><CheckCircle2/> Simpan</button></div>}/>
    <div className="glass-card-strong table-card"><div className="attendance-summary"><span><CheckCircle2/> Hadir {count("Hadir")}</span><span><Info/> Izin {count("Izin")}</span><span><CircleAlert/> Alpa {count("Alpa")}</span><span><CalendarDays/> {tanggal}</span></div><div className="table-scroll"><table><thead><tr><th>Siswa</th><th>NIS</th><th>Status</th></tr></thead><tbody>{list.length===0?<tr><td colSpan={3}><EmptyStateText text="Belum ada siswa/kelas. Buat data siswa dan kelas terlebih dahulu."/></td></tr>:list.map((s:any)=><tr key={s.id}><td><div className="cell-main"><span className="avatar">{initials(s.nama)}</span><div><b>{s.nama}</b><small>{s.kelas}</small></div></div></td><td>{s.nis}</td><td><div className="attendance-pills">{["Hadir","Izin","Alpa"].map(v=><button key={v} className={(att[s.id]||"Hadir")===v?"selected":""} onClick={()=>setAtt(a=>({...a,[s.id]:v}))}>{v}</button>)}</div></td></tr>)}</tbody></table></div></div>
  </div>;
}


function GradePage({role}:{role:Role}){
  const [rows]=useCollection("grades");
  const [className,setClassName]=useState("Semua");
  const [mapel,setMapel]=useState("Semua");
  const isStudent=role==="siswa";
  const filtered=(rows as GradeRecord[]).filter(x=>className==="Semua"||x.kelas===className).filter(x=>mapel==="Semua"||x.mapel===mapel);
  const average=filtered.length?filtered.reduce((sum:any,x:any)=>sum+Number(x.akhir||0),0)/filtered.length:0;
  return <div className="space-y-5 fade-up">
    <PageHeader title={isStudent?"Nilai Saya":"Rekap Nilai Akademik"} description={isStudent?"Lihat rincian hasil belajar yang sudah dimasukkan dan disahkan guru.":"Pantau nilai siswa berdasarkan kelas dan mata pelajaran."}/>
    {isStudent&&<div className="glass-card-strong p-5 grid gap-3 md:grid-cols-3"><div><small className="text-slate-500">Jumlah penilaian</small><h3 className="text-2xl font-semibold">{filtered.length}</h3></div><div><small className="text-slate-500">Rata-rata nilai akhir</small><h3 className="text-2xl font-semibold">{filtered.length?average.toFixed(1):"—"}</h3></div><div><small className="text-slate-500">Keterangan</small><p className="text-sm mt-1">{filtered.length?"Berdasarkan nilai yang sudah tersimpan.":"Belum ada nilai yang diterbitkan guru."}</p></div></div>}
    <div className="toolbar glass-card-strong"><select className="select" value={className} onChange={e=>setClassName(e.target.value)} disabled={isStudent}><option>Semua</option>{Array.from(new Set((rows as any[]).map(x=>x.kelas).filter(Boolean))).map(x=><option key={x}>{x}</option>)}</select><select className="select" value={mapel} onChange={e=>setMapel(e.target.value)}><option>Semua</option>{Array.from(new Set((rows as any[]).map(x=>x.mapel).filter(Boolean))).map(x=><option key={x}>{x}</option>)}</select>{!isStudent&&<button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"nilai-educn.csv","text/csv")}><Download/> Export Nilai</button>}</div>
    <div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr>{!isStudent&&<th>Siswa</th>}<th>Mata Pelajaran</th><th>Nilai Tugas</th><th>UTS</th><th>UAS</th><th>Nilai Akhir</th><th>Predikat</th><th>Keterangan</th></tr></thead><tbody>{filtered.length===0?<tr><td colSpan={isStudent?7:8}><EmptyStateText text={isStudent?"Belum ada nilai yang diterbitkan untuk akun kamu. Nilai akan tampil setelah guru melakukan penilaian.":"Belum ada data nilai yang tersimpan di MongoDB."}/></td></tr>:filtered.map((x:any)=><tr key={x.id}>{!isStudent&&<td><b>{x.siswa}</b><small className="block">{x.nis}</small></td>}<td>{x.mapel}</td><td>{x.tugas??"—"}</td><td>{x.uts??"—"}</td><td>{x.uas??"—"}</td><td><b className="text-primary">{x.akhir??"—"}</b></td><td>{x.predikat?<span className="badge green">{x.predikat}</span>:"—"}</td><td>{x.keterangan||x.feedback||"—"}</td></tr>)}</tbody></table></div></div>
    {isStudent&&<div className="glass-card-strong p-4 text-sm text-slate-600"><b>Arti kolom nilai:</b> Nilai Tugas berasal dari tugas harian, UTS dari ujian tengah semester, UAS dari ujian akhir semester. Nilai Akhir adalah hasil akhir yang ditetapkan guru, sedangkan Predikat adalah kategori capaian. Tanda “—” berarti komponen tersebut belum diisi.</div>}
  </div>;
}

function ReportPage({role}:{role:Role}){
  const [rows,setRows]=useCollection("reports" as any);
  const [type,setType]=useState("Nilai");
  const [periode,setPeriode]=useState("Semester Ganjil 2026/2027");
  const [format,setFormat]=useState<"PDF"|"XLSX"|"CSV">("PDF");
  const can=role==="admin"||role==="kurikulum";
  const generate=async()=>{
    const item={id:uid("report"),judul:`Laporan ${type}`,tanggal:new Date().toLocaleDateString("id-ID"),format,status:"Siap",jenis:type,periode};
    try { const saved=await saveCollection("reports" as any,[item,...(rows as any[])] as any); setRows(saved as any); await logAction("Membuat laporan",item.judul); toast("Laporan tercatat di MongoDB"); } catch { toast("Gagal membuat laporan"); }
  };
  return <div className="space-y-5 fade-up"><PageHeader title="Laporan Akademik" description="Daftar laporan hanya berasal dari laporan yang benar-benar dibuat di sistem." action={<button className="secondary-btn" onClick={()=>downloadText(toCsv(rows as any[]),"laporan-educn.csv","text/csv")}><Download/> Export Daftar</button>}/><div className="report-builder glass-card-strong"><div><p className="eyebrow">Buat Laporan</p><h3>Generate laporan baru</h3><p>Pilih jenis, periode, dan format. Tidak ada laporan contoh bawaan.</p></div><div className="form-grid"><label className="field"><span>Jenis Laporan</span><select className="input" value={type} onChange={e=>setType(e.target.value)}><option>Nilai</option><option>Kehadiran</option><option>Data Guru</option><option>Data Siswa</option><option>Rekap Kelas</option></select></label><label className="field"><span>Periode</span><input className="input" value={periode} onChange={e=>setPeriode(e.target.value)}/></label><label className="field"><span>Format</span><select className="input" value={format} onChange={e=>setFormat(e.target.value as any)}><option>PDF</option><option>XLSX</option><option>CSV</option></select></label><div className="field flex items-end"><button className="primary-btn w-full" onClick={generate} disabled={!can}><FileBarChart/> Generate Laporan</button></div></div></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr><th>Nama Laporan</th><th>Tanggal</th><th>Format</th><th>Status</th><th>Periode</th></tr></thead><tbody>{(rows as any[]).length===0?<tr><td colSpan={5}><EmptyStateText text="Belum ada laporan yang dibuat."/></td></tr>:(rows as any[]).map((r:any)=><tr key={r.id}><td><b>{r.judul}</b></td><td>{r.tanggal}</td><td><span className="badge blue">{r.format}</span></td><td><span className="badge green">{r.status}</span></td><td>{r.periode}</td></tr>)}</tbody></table></div></div></div>;
}


function ProfilePage({role}:{role:Role}){
  const [profile,setProfile]=useState<{nama:string;email:string;telepon:string}>({nama:"",email:"",telepon:""});
  const [saved,setSaved]=useState(false);
  useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject(new Error("Sesi tidak valid"))).then((d:any)=>{if(active&&d.user)setProfile({nama:d.user.nama||"",email:d.user.email||"",telepon:d.user.telepon||""})}).catch(()=>{});return()=>{active=false}},[]);
  const save=async()=>{try{const r=await fetch("/api/auth/me",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({nama:profile.nama,telepon:profile.telepon})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal menyimpan");setProfile(p=>({...p,nama:d.user?.nama||p.nama,telepon:d.user?.telepon||p.telepon}));setSaved(true);await logAction("Memperbarui profil",profile.nama);toast("Profil berhasil disimpan");}catch{toast("Profil gagal disimpan")}};
  return <div className="space-y-5 fade-up"><PageHeader title="Profil" description="Data profil dibaca dan disimpan ke MongoDB." action={<button className="primary-btn" onClick={save}><CheckCircle2/> Simpan Perubahan</button>}/><div className="profile-layout"><Card title="Informasi Profil" subtitle="Identitas akun yang sedang login."><div className="profile-cover"><div className="profile-avatar">{initials(profile.nama||roleMeta[role].label)}</div><div><b>{profile.nama||"Belum tersedia"}</b><p>{roleMeta[role].label}</p></div></div><div className="form-grid mt-5"><label className="field"><span>Nama Lengkap</span><input className="input" value={profile.nama} onChange={e=>setProfile(p=>({...p,nama:e.target.value}))}/></label><label className="field"><span>Email</span><input className="input" value={profile.email} readOnly/></label><label className="field"><span>Nomor Telepon</span><input className="input" value={profile.telepon} onChange={e=>setProfile(p=>({...p,telepon:e.target.value}))} placeholder="08xxxxxxxxxx"/></label><label className="field"><span>Role</span><input className="input" value={roleMeta[role].label} readOnly/></label></div>{saved&&<div className="inline-success mt-4"><CheckCircle2/> Profil sudah diperbarui.</div>}</Card><Card title="Keamanan Akun" subtitle="Pengaturan keamanan sesi tetap dikelola server."><SecuritySettings/></Card></div></div>;
}


function SecuritySettings(){ const [two,setTwo]=useState(true); const [session,setSession]=useState(true); return <div className="setting-list"><ToggleRow icon={ShieldCheck} title="Autentikasi 2 Faktor" text="Tambahkan lapisan keamanan saat login." on={two} setOn={setTwo}/><ToggleRow icon={LockKeyhole} title="Perangkat tepercaya" text="Izinkan perangkat ini mengingat sesi login." on={session} setOn={setSession}/><button className="secondary-btn w-full mt-2" onClick={()=>toast("Semua sesi lain sudah dicabut")}>Keluar dari semua perangkat</button></div>; }
function ToggleRow({icon:Icon,title,text,on,setOn}:{icon:any;title:string;text:string;on:boolean;setOn:(v:boolean)=>void}){return <div className="toggle-row"><span className="setting-icon"><Icon/></span><div><b>{title}</b><small>{text}</small></div><button className={`toggle ${on?"on":""}`} onClick={()=>setOn(!on)} aria-label={title}><i/></button></div>;}

function SettingsPage({role}:{role:Role}){ const [maintenance,setMaintenance]=useState(false); const [backup,setBackup]=useState(true); const [notif,setNotif]=useState(true); const [compact,setCompact]=useState(false); return <div className="space-y-5 fade-up"><PageHeader title="Pengaturan" description="Sesuaikan pengalaman, notifikasi, dan konfigurasi workspace." action={<button className="primary-btn" onClick={()=>{localStorage.setItem("educn-settings",JSON.stringify({maintenance,backup,notif,compact}));toast("Pengaturan berhasil disimpan")}}><CheckCircle2/> Simpan Pengaturan</button>}/><div className="settings-grid"><Card title="Umum" subtitle="Konfigurasi utama sistem."><div className="setting-list"><ToggleRow icon={Settings2} title="Mode Maintenance" text="Sembunyikan modul publik saat perawatan." on={maintenance} setOn={setMaintenance}/><ToggleRow icon={HardDrive} title="Backup Otomatis" text="Backup data setiap malam." on={backup} setOn={setBackup}/><ToggleRow icon={Bell} title="Notifikasi Sistem" text="Terima notifikasi aktivitas penting." on={notif} setOn={setNotif}/><ToggleRow icon={LayoutDashboard} title="Tampilan Ringkas" text="Kurangi kepadatan informasi dashboard." on={compact} setOn={setCompact}/></div></Card><Card title="Identitas Aplikasi" subtitle="Informasi yang digunakan pada laporan."><div className="form-grid"><label className="field"><span>Nama Aplikasi</span><input className="input" value="EduCN" readOnly/></label><label className="field"><span>Versi</span><input className="input" value="2.0.0" readOnly/></label><label className="field"><span>Zona Waktu</span><select className="input"><option>Asia/Jakarta (WIB)</option><option>Asia/Makassar (WITA)</option><option>Asia/Jayapura (WIT)</option></select></label><label className="field"><span>Bahasa</span><select className="input"><option>Bahasa Indonesia</option><option>English</option></select></label></div></Card></div><Card title="Pemulihan Data" subtitle="Operasi maintenance untuk workspace sekolah."><div className="recovery-grid"><button className="secondary-btn" onClick={()=>{resetCollection("users");toast("Data pengguna dikosongkan")}}><RefreshCcw/> Reset Data Pengguna</button><button className="secondary-btn" onClick={()=>{Object.keys(localStorage).filter(k=>k.startsWith("educn-v2-")).forEach(k=>localStorage.removeItem(k));toast("Cache browser dibersihkan. Muat ulang halaman")}}><RefreshCcw/> Reset Workspace</button><button className="danger-btn" onClick={()=>{localStorage.clear();toast("Local storage dibersihkan")}}><Trash2/> Bersihkan Local Storage</button></div></Card></div>; }

function HelpPage({role}:{role:Role}){ const [open,setOpen]=useState<string|null>(null); const faqs=[["Bagaimana cara menambah pengguna?","Buka menu Pengguna, tekan Tambah Data, isi form lalu Simpan Data."],["Bagaimana generate nilai?","Role Kurikulum, Guru, dan Admin dapat membuka Generate Nilai lalu menekan tombol Generate Nilai."],["Bagaimana export laporan?","Setiap tabel yang menyediakan data dapat diekspor melalui tombol Export."],["Apakah semua role memiliki akses yang sama?","Tidak. Sidebar dan modul berubah berdasarkan role untuk menjaga hak akses."],["Apa yang terjadi saat logout?","Sesi demo di browser dihapus dan pengguna kembali ke halaman login."]]; return <div className="space-y-5 fade-up"><PageHeader title="Pusat Bantuan" description="Panduan singkat untuk menggunakan EduCN." action={<button className="primary-btn" onClick={()=>toast("Tiket bantuan dibuat") }><MessageCircle/> Buat Tiket</button>}/><div className="help-grid"><Card title="FAQ" subtitle="Pertanyaan paling sering ditanyakan."><div className="faq-list">{faqs.map(([q,a])=><button key={q} className="faq-item" onClick={()=>setOpen(open===q?null:q)}><div><b>{q}</b>{open===q&&<p>{a}</p>}</div><ChevronDown className={open===q?"rotate-180":""}/></button>)}</div></Card><Card title="Kontak Bantuan" subtitle="Butuh bantuan lebih lanjut?"><div className="contact-card"><span><MessageCircle/></span><div><b>Tim Support EduCN</b><p>Senin–Jumat · 08.00–17.00 WIB</p><button className="secondary-btn" onClick={()=>toast("Live chat dibuka")}>Mulai Chat</button></div></div><div className="contact-card"><span><FileText/></span><div><b>Dokumentasi Sistem</b><p>Panduan lengkap penggunaan modul.</p><button className="secondary-btn" onClick={()=>toast("Dokumentasi dibuka")}>Baca Dokumentasi</button></div></div></Card></div></div>; }

function NotFound({role}:{role:Role}) { return <div className="empty-page"><div className="empty-state"><CircleAlert/><b>Halaman belum tersedia</b><span>Modul tersebut tidak ada pada role {roleMeta[role].label}.</span><Link href={`/${role}`} className="primary-btn">Kembali ke Beranda</Link></div></div>; }

const routePages: Record<string,(props:{role:Role})=>ReactElement> = {
  pengguna: (p) => <CrudPage {...p} type="pengguna" />, guru: (p) => <CrudPage {...p} type="guru" />, siswa: (p) => <CrudPage {...p} type="siswa" />, kelas: (p) => <CrudPage {...p} type="kelas" />, mapel: (p) => <CrudPage {...p} type="mapel" />,
  aktivitas: (p) => <ActivitiesPage {...p} />, pengumuman: (p) => <AnnouncementPage {...p} />, materi: (p) => <MaterialPage {...p} />, tugas: (p) => <TaskPage {...p} />, kehadiran: (p) => <AttendancePage {...p} />, penilaian: (p) => <GradePage {...p} />, nilai: (p) => <GradePage {...p} />, laporan: (p) => <ReportPage {...p} />, profil: (p) => <ProfilePage {...p} />, pengaturan: (p) => <SettingsPage {...p} />, bantuan: (p) => <HelpPage {...p} />,
  jadwal: (p) => <SchedulePage {...p} />,
  users: (p) => <CrudPage {...p} type="pengguna" />, activity: (p) => <ActivitiesPage {...p} />, help: (p) => <HelpPage {...p} />, profile: (p) => <ProfilePage {...p} />, settings: (p) => <SettingsPage {...p} />,
};

function SchedulePage({role}:{role:Role}){
  const [rows,setRows]=useCollection("schedules" as any);
  const can=role==="admin";
  const [open,setOpen]=useState(false);
  const [q,setQ]=useState("");
  const filtered=(rows as any[]).filter((x:any)=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
  const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());const next=[{id:uid("sch"),hari:String(d.hari),jam:String(d.jam),mapel:String(d.mapel),kelas:String(d.kelas),guru:String(d.guru)},...(rows as any[])];try{const saved=await saveCollection("schedules" as any,next as any);setRows(saved as any);await logAction("Menambah jadwal",String(d.mapel));toast("Jadwal disimpan");setOpen(false)}catch{toast("Gagal menyimpan jadwal")}};
  return <div className="space-y-5 fade-up"><PageHeader title="Jadwal" description="Jadwal hanya menampilkan data yang dibuat dan disimpan di MongoDB." action={<div className="flex gap-2"><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered),"jadwal-educn.csv","text/csv")}><Download/> Export</button>{can&&<button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Tambah Jadwal</button>}</div>}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari jadwal..." value={q} onChange={e=>setQ(e.target.value)}/></div></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr><th>Hari</th><th>Jam</th><th>Mapel</th><th>Kelas</th><th>Guru</th></tr></thead><tbody>{filtered.length===0?<tr><td colSpan={5}><EmptyStateText text="Belum ada jadwal. Admin dapat menambahkan jadwal nyata."/></td></tr>:filtered.map((x:any)=><tr key={x.id}><td>{x.hari}</td><td>{x.jam}</td><td>{x.mapel}</td><td>{x.kelas}</td><td>{x.guru}</td></tr>)}</tbody></table></div></div><Modal open={open} onClose={()=>setOpen(false)} title="Tambah Jadwal" description="Simpan jadwal baru ke MongoDB."><form className="form-grid" onSubmit={save}><label className="field"><span>Hari</span><select name="hari" className="input"><option>Senin</option><option>Selasa</option><option>Rabu</option><option>Kamis</option><option>Jumat</option></select></label><label className="field"><span>Jam</span><input className="input" name="jam" required placeholder="07.00 - 08.30"/></label><label className="field"><span>Mapel</span><input className="input" name="mapel" required/></label><label className="field"><span>Kelas</span><input className="input" name="kelas" required/></label><label className="field"><span>Guru</span><input className="input" name="guru" required/></label><div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>Batal</button><button className="primary-btn"><CheckCircle2/> Simpan Jadwal</button></div></form></Modal></div>;
}


function toCsv(rows: any[]) { if (!rows.length) return ""; const keys=Object.keys(rows[0]); return [keys.join(","),...rows.map(r=>keys.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\n"); }
function downloadText(content:string,name:string,type:string){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
