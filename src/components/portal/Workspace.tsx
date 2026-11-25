"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, ReactElement, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, BookOpen, BookMarked, CheckCircle2,
  CheckSquare2, ChevronDown, CircleAlert, Clock3, Download, FileBarChart, GraduationCap, HardDrive,
  Info, LayoutDashboard, Megaphone, Pencil, Plus, RefreshCcw, Search, Server, ShieldCheck,
  Sparkles, Trash2, UserCircle2, Users, X, School, ClipboardList, Calculator, Eye, Filter, LockKeyhole,
  Settings2, MessageCircle, Trophy, Target, ClipboardCheck, LibraryBig, UserRoundCheck, FileText, UploadCloud, FileCheck
} from "lucide-react";
import {
  CalendarDays,
  // import lainnya tetap dipertahankan
} from "lucide-react";
import { GradeRecord, MAJORS, seed } from "@/lib/data";
import { Role, roleMeta, roleNav } from "@/lib/portal";
import { fetchCollection, loadCollection, logAction, saveCollection, uid, resetCollection, deleteClassRecordFromApi } from "@/lib/store";
import Modal from "./Modal";
import * as XLSX from "xlsx";

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
        { label: "Siswa Aktif", value: counts?.activeSiswa ?? 0, helper: "", icon: GraduationCap },
        { label: "Guru Aktif", value: counts?.activeGuru ?? 0, helper: "", icon: UserCircle2 },
        { label: "Status Server", value: isLoading ? "..." : "ONLINE", helper: summary?.generatedAt ? `Sinkron ${new Date(summary.generatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "", icon: Server },
      ]
    : role === "guru"
      ? [
          { label: "Kelas Saya", value: counts?.kelas ?? 0, helper: "" , icon: School },
          { label: "Siswa", value: counts?.siswa ?? 0, helper: "" , icon: Users },
          { label: "Tugas", value: counts?.tasks ?? 0, helper: "" , icon: ClipboardList },
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
  majorCounts: Record<string, number>;
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
      <Card title="Aktivitas Terbaru" subtitle="">
        {actions.length === 0 ? <EmptyStateText text="Belum ada aktivitas tersimpan." /> : <div className="activity-list">{actions.map((item) => <div className="activity-row" key={item.id}><span className="activity-symbol success"><Activity/></span><div><b>{item.title}</b><small>{item.time || "Baru saja"}</small></div></div>)}</div>}
      </Card>
      <Card title="Ringkasan Data" subtitle="">
        <div className="metric-grid">
          <Metric label="Pengumuman" value={String(summary?.counts.announcements ?? 0)} icon={Megaphone}/>
          <Metric label="Materi" value={String(summary?.counts.material ?? 0)} icon={BookOpen}/>
          <Metric label="Tugas" value={String(summary?.counts.tasks ?? 0)} icon={ClipboardList}/>
          <Metric label="Nilai" value={String(summary?.counts.grades ?? 0)} icon={Calculator}/>
        </div>
      </Card>
    </section>
    <section className="dashboard-grid-2">
      <Card title="Sebaran Jurusan" subtitle="">
        <div className="simple-metrics">{MAJORS.map((major) => <div key={major}><span>{major}</span><b>{summary?.majorCounts?.[major] ?? 0}</b></div>)}</div>
      </Card>
    </section>
  </>;
}

function EmptyStateText({ text }: { text: string }) { return <div className="empty-state"><Info/><b>Belum ada data</b><span>{text}</span></div>; }

function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return <div className={`glass-card-strong card ${className}`}><div className="card-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div></div>{children}</div>;
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
  guru: { title: "Data Guru", description: "Kelola data tenaga pendidik, mata pelajaran, dan wali kelas.", key: "guru", columns: ["Nama","NIP","Mata Pelajaran","Wali Kelas","Status","Aksi"], canCreate: true, canEdit: true, canDelete: true },
  siswa: { title: "Data Siswa", description: "Kelola data peserta didik, jurusan, dan kelas.", key: "siswa", columns: ["Nama","NIS","Kelas","Jurusan","Status","Aksi"], canCreate: true, canEdit: true, canDelete: true },
  kelas: { title: "Data Kelas", description: "Kelola rombongan belajar, wali kelas, dan kapasitas siswa.", key: "kelas", columns: ["Kelas","Tingkat","Jurusan","Wali Kelas","Jumlah","Aksi"], canCreate: true, canEdit: true, canDelete: true },
  mapel: { title: "Mata Pelajaran", description: "Kelola mata pelajaran dan guru-guru pengampu.", key: "mapel", columns: ["Kode","Mata Pelajaran","Jam","Guru Pengampu","Aksi"], canCreate: true, canEdit: true, canDelete: true },
};

function CrudPage({ role, type }: { role: Role; type: keyof typeof typeConfig }) {
  const cfg = typeConfig[type];
  const [rows, setRows] = useCollection(cfg.key);
  const [q, setQ] = useState(""); const [status, setStatus] = useState("Semua"); const [modal, setModal] = useState(false); const [view, setView] = useState<any>(null); const [editing, setEditing] = useState<any>(null); const [importOpen, setImportOpen] = useState(false);
  const canMutate = role === "admin" || (role === "kurikulum" && type === "mapel");
  const filtered = useMemo(() => (rows as any[]).filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).filter((r) => status === "Semua" || r.status === status), [rows, q, status]);
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as any;
    data.mapelIds = formData.getAll("mapelIds").map(String).filter(Boolean);
    data.guruIds = formData.getAll("guruIds").map(String).filter(Boolean);
    try { data.teachingAssignments = JSON.parse(String(formData.get("teachingAssignments") || "[]")); } catch { data.teachingAssignments = []; }

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
  const remove = async (id: string) => {
    const row = (rows as any[]).find((item) => item.id === id);
    const promptText = type === "kelas"
      ? `Hapus kelas ${row?.nama ?? "ini"}? Jika masih dipakai akun guru/siswa, sistem akan meminta kelas pengganti dan memindahkan relasinya agar akun tidak terputus.`
      : "Hapus data ini?";
    if (!confirm(promptText)) return;
    try {
      if (type === "kelas") {
        const result = await deleteClassRecordFromApi(id);
        const saved = await fetchCollection(cfg.key);
        setRows(saved as any);
        await logAction("Menghapus data kelas", row?.nama ?? "");
        toast(result.reassigned ? `Kelas dihapus. ${result.reassigned} akun dipindahkan ke ${result.replacementClass}.` : "Kelas berhasil dihapus.");
        return;
      }
      const next=(rows as any[]).filter((x)=>x.id!==id);
      const saved = await saveCollection(cfg.key,next as any);
      setRows(saved as any);
      await logAction(`Menghapus data ${cfg.title}`);
      toast("Data berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast(error instanceof Error ? error.message : "Gagal menghapus dari MongoDB");
    }
  };
  return <div className="space-y-5 fade-up"><PageHeader title={cfg.title} description={cfg.description} action={canMutate ? <div className="page-actions">{(type === "pengguna" || type === "siswa" || type === "guru") && <button className="secondary-btn" onClick={()=>setImportOpen(true)}><UploadCloud/> Import Excel</button>}<button className="primary-btn" onClick={()=>{setEditing(null);setModal(true)}}><Plus/> Tambah Data</button></div> : undefined}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari data..." value={q} onChange={(e)=>setQ(e.target.value)}/></div><select className="select" value={status} onChange={(e)=>setStatus(e.target.value)}><option>Semua</option><option>Aktif</option><option>Non-aktif</option></select><button className="secondary-btn" onClick={()=>{ const csv = toCsv(filtered as any[]); downloadText(csv, `${type}-educn.csv`, "text/csv"); toast("Data berhasil diekspor"); }}><Download/> Export</button></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr>{cfg.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{filtered.length===0?<tr><td colSpan={cfg.columns.length}><EmptyState/></td></tr>:filtered.map((row:any)=><tr key={row.id}><td><div className="cell-main"><span className="avatar">{initials(row.nama || row.nama)}</span><div><b>{type === "mapel" ? row.kode : row.nama}</b><small>{type === "mapel" ? row.nama : row.email || row.nip || row.nis || row.kode}</small></div></div></td>{type==="pengguna" && <><td>{row.email}</td><td><span className="badge blue">{row.role}</span></td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="guru" && <><td>{row.nip}</td><td>{row.mapel}</td><td>{row.waliKelas||row.kelas||"—"}</td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="siswa" && <><td>{row.nis}</td><td>{row.kelas}</td><td>{row.jurusan}</td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="kelas" && <><td>{row.tingkat}</td><td>{row.jurusan}</td><td>{row.wali}</td><td>{row.jumlah}</td></>}{type==="mapel" && <><td>{row.nama}</td><td>{row.jam} JP</td><td>{Array.isArray(row.guru) ? row.guru.join(", ") : row.guru || "—"}</td></>}<td><div className="row-actions"><button className="table-action" onClick={()=>setView(row)} title="Lihat"><Eye/></button>{canMutate&&<button className="table-action" onClick={()=>{setEditing(row);setModal(true)}} title="Edit"><Pencil/></button>}{canMutate&&<button className="table-action danger" onClick={()=>remove(row.id)} title="Hapus"><Trash2/></button>}</div></td></tr>)}</tbody></table></div><div className="table-footer">Menampilkan <b>{filtered.length}</b> dari <b>{(rows as any[]).length}</b> data</div></div>
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
    ? ["Nama", "Email", "Password", "Peran", "NIP", "Mata Pelajaran", "NIS", "Kelas / Wali Kelas", "Jurusan", "Status"]
    : type === "siswa"
      ? ["NIS", "Nama", "Email", "Password", "Kelas", "Jurusan", "Status"]
      : ["NIP", "Nama", "Email", "Password", "Mata Pelajaran (pisahkan koma)", "Wali Kelas (opsional)", "Status"];
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
      ? [["Kolom", "Keterangan"], ["Nama", "Nama lengkap pengguna"], ["Email", "Email login yang unik"], ["Password", "Minimal 8 karakter"], ["Peran", "Admin / Guru / Siswa / Kurikulum / Kepsek"], ["NIP", "Wajib jika peran Guru"], ["Mata Pelajaran", "Wajib jika peran Guru"], ["NIS", "Wajib jika peran Siswa"], ["Kelas / Wali Kelas", "Wajib untuk Siswa; opsional untuk Guru dan harus memakai kelas yang sudah dibuat"], ["Jurusan", "Wajib jika peran Siswa; DKV / MPLB / PPLG / PERHOTELAN / TJKT / PEMASARAN"], ["Status", "Aktif atau Non-aktif; default Aktif"]]
      : type === "siswa"
        ? [["Kolom", "Keterangan"], ["NIS", "Wajib dan harus unik"], ["Nama", "Nama lengkap siswa"], ["Email", "Email login, harus unik"], ["Password", "Minimal 8 karakter untuk akun baru"], ["Kelas", "Contoh: X PPLG 1"], ["Jurusan", "DKV / MPLB / PPLG / PERHOTELAN / TJKT / PEMASARAN"], ["Status", "Aktif atau Non-aktif; jika kosong otomatis Aktif"]]
        : [["Kolom", "Keterangan"], ["NIP", "Wajib dan harus unik"], ["Nama", "Nama lengkap guru"], ["Email", "Email login, harus unik"], ["Password", "Minimal 8 karakter untuk akun baru"], ["Mata Pelajaran", "Wajib; boleh beberapa nama mapel dipisahkan koma"], ["Wali Kelas", "Opsional; pilih nama kelas yang sudah dibuat"], ["Status", "Aktif atau Non-aktif; jika kosong otomatis Aktif"]];
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
        role: getValue(row, ["peran", "role"]), nip: getValue(row, ["nip", "nomorindukpegawai"]), mapel: getValue(row, ["matapelajaran", "matapelajaranpisahkankoma", "mapel"]),
        nis: getValue(row, ["nis", "nomorinduksiswa"]), kelas: getValue(row, ["kelas", "rombel", "walikelas", "walikelasopsional", "kelaswali", "kelaswalikelas"]), waliKelas: getValue(row, ["walikelas", "walikelasopsional", "kelaswali", "kelaswalikelas", "kelas", "rombel"]), jurusan: getValue(row, ["jurusan", "programkeahlian"]), status: getValue(row, ["status"]) || "Aktif",
      }) : ({
        ...(type === "siswa" ? { nis: getValue(row, ["nis", "nomorinduksiswa"]) } : { nip: getValue(row, ["nip", "nomorindukpegawai"]) }),
        nama: getValue(row, ["nama", "namalengkap", "namasiswa", "namaguru"]), email: getValue(row, ["email", "emailaktif"]), password: getValue(row, ["password", "katasandi"]),
        kelas: getValue(row, ["kelas", "rombel", "walikelas", "walikelasopsional", "kelaswali", "kelaswalikelas"]), ...(type === "siswa" ? { jurusan: getValue(row, ["jurusan", "programkeahlian"]) } : { waliKelas: getValue(row, ["walikelas", "walikelasopsional", "kelaswali", "kelaswalikelas", "kelas", "rombel"]), mapel: getValue(row, ["matapelajaran", "matapelajaranpisahkankoma", "mapel"]) }), status: getValue(row, ["status"]) || "Aktif",
      })).filter((row) => Object.values(row).some((value) => String(value).trim()));
      if (!mapped.length) { setError("Tidak ada baris data yang bisa dibaca."); return; }
      if (mapped.length > 1000) { setError("Maksimal 1.000 baris per sekali impor."); return; }
    setParsed(mapped as Record<string, string>[]);
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
  const [classes] = useCollection("kelas");
  const [subjects] = useCollection("mapel");
  const [teachers] = useCollection("guru");
  const classRows = classes as any[];
  const subjectRows = subjects as any[];
  const teacherRows = teachers as any[];
  const initialClass = classRows.find((x:any)=>String(x.id)===String(i.kelasId||"")) || classRows.find((x:any)=>String(x.nama||x.namaKelas||"").trim()===String(i.kelas||"").split(",")[0].trim());
  const [selectedClassId,setSelectedClassId]=useState(String(initialClass?.id||""));
  const initialSubject = subjectRows.find((x:any)=>String(x.id)===String(i.mapelId||"")) || subjectRows.find((x:any)=>String(x.nama||"").trim()===String(i.mapel||"").trim());
  const initialSubjectIds = Array.isArray(i.mapelIds) ? i.mapelIds.map(String) : String(i.mapel||"").split(",").map((name:string)=>subjectRows.find((m:any)=>String(m.nama||"").trim()===name.trim())?.id).filter(Boolean).map(String).concat(initialSubject?.id && !String(i.mapel||"").trim() ? [String(initialSubject.id)] : []);
  const [selectedSubjectIds,setSelectedSubjectIds]=useState<string[]>(initialSubjectIds);
  const [teachingAssignments,setTeachingAssignments]=useState<{mapelId:string;kelasIds:string[]}[]>(Array.isArray(i.teachingAssignments)?i.teachingAssignments.map((a:any)=>({mapelId:String(a.mapelId||""),kelasIds:Array.isArray(a.kelasIds)?a.kelasIds.map(String):[]})):[]);
  const initialGuruIds = Array.isArray(i.guruIds) ? i.guruIds.map(String) : String(i.guru||"").split(",").map((name:string)=>teacherRows.find((g:any)=>String(g.nama||"").trim()===name.trim())?.id).filter(Boolean).map(String).concat(i.guruId ? [String(i.guruId)] : []);
  const [selectedGuruIds,setSelectedGuruIds]=useState<string[]>(initialGuruIds);
  const [selectedWaliGuruId,setSelectedWaliGuruId]=useState(String(i.waliGuruId||teacherRows.find((g:any)=>String(g.nama||"").trim()===String(i.wali||"").trim())?.id||""));
  const [selectedWaliKelasId,setSelectedWaliKelasId]=useState(String(i.waliKelasId||""));
  const selectedWaliKelas=classRows.find((c:any)=>String(c.id)===selectedWaliKelasId);
  const subjectSelectionInitialized = useRef(false);
  const teacherSelectionInitialized = useRef(false);
  useEffect(()=>{
    if(subjectSelectionInitialized.current || !subjectRows.length) return;
    if(type !== "guru" && !(type === "pengguna" && selectedRole === "Guru")) return;
    subjectSelectionInitialized.current = true;
    if(type === "guru" || (type === "pengguna" && selectedRole === "Guru")) {
      const ids = Array.isArray(i.mapelIds) ? i.mapelIds.map(String) : String(i.mapel||"").split(",").map((name:string)=>subjectRows.find((m:any)=>String(m.nama||"").trim()===name.trim())?.id).filter(Boolean).map(String);
      setSelectedSubjectIds(ids.length ? ids : (initialSubject?.id ? [String(initialSubject.id)] : []));
    }
  },[subjectRows,type,selectedRole,i.mapelIds,i.mapel,initialSubject?.id]);
  useEffect(()=>{
    if(teacherSelectionInitialized.current || !teacherRows.length) return;
    if(type !== "mapel" && type !== "kelas") return;
    teacherSelectionInitialized.current = true;
    if(type === "mapel") {
      const ids = Array.isArray(i.guruIds) ? i.guruIds.map(String) : String(i.guru||"").split(",").map((name:string)=>teacherRows.find((g:any)=>String(g.nama||"").trim()===name.trim())?.id).filter(Boolean).map(String);
      setSelectedGuruIds(ids);
    }
    if(type === "kelas") setSelectedWaliGuruId(String(i.waliGuruId||teacherRows.find((g:any)=>String(g.nama||"").trim()===String(i.wali||"").trim())?.id||""));
  },[teacherRows,type,i.guruIds,i.guru,i.waliGuruId,i.wali]);
  useEffect(()=>{
    if(!selectedClassId && classRows.length){
      const found=classRows.find((x:any)=>String(x.id)===String(i.kelasId||"")) || classRows.find((x:any)=>String(x.nama||x.namaKelas||"").trim()===String(i.kelas||"").split(",")[0].trim());
      if(found)setSelectedClassId(String(found.id));
    }
  },[classRows,selectedClassId,i.kelasId,i.kelas]);
  useEffect(()=>{
    if(!selectedWaliKelasId && classRows.length && (i.waliKelasId || i.waliKelas)) {
      const found=classRows.find((c:any)=>String(c.id)===String(i.waliKelasId||"")) || classRows.find((c:any)=>String(c.nama||"").trim()===String(i.waliKelas||"").trim());
      if(found)setSelectedWaliKelasId(String(found.id));
    }
  },[classRows,selectedWaliKelasId,i.waliKelasId,i.waliKelas]);
  const selectedClass=classRows.find((x:any)=>String(x.id)===selectedClassId);
  const selectedSubjects=subjectRows.filter((x:any)=>selectedSubjectIds.includes(String(x.id)));
  const selectedTeachers=teacherRows.filter((x:any)=>selectedGuruIds.includes(String(x.id)));
  const selectedWaliGuru=teacherRows.find((x:any)=>String(x.id)===selectedWaliGuruId);
  const input=(name:string,label:string,placeholder:string, value?:string, required=false)=><label className="field"><span>{label}</span><input className="input" name={name} defaultValue={value ?? i[name] ?? ""} placeholder={placeholder} required={required}/></label>;
  const classSelect=(label="Kelas")=><><label className="field"><span>{label}</span><select className="input" value={selectedClassId} onChange={e=>setSelectedClassId(e.target.value)} required><option value="">Pilih kelas yang sudah dibuat</option>{classRows.map((c:any)=><option key={c.id} value={String(c.id)}>{c.nama||c.namaKelas} · {c.tingkat||""} {c.jurusan||""}</option>)}</select>{classRows.length===0&&<small className="text-amber-700">Buat data kelas terlebih dahulu di menu Kelas.</small>}</label><input type="hidden" name="kelasId" value={selectedClassId}/><input type="hidden" name="kelas" value={String(selectedClass?.nama||selectedClass?.namaKelas||"")}/></>;
  const subjectSelect=()=><><label className="field"><span>Mata Pelajaran yang Diampu</span><select className="input" name="mapelIds" multiple size={Math.min(5,Math.max(3,subjectRows.length))} value={selectedSubjectIds} onChange={(e:ChangeEvent<HTMLSelectElement>)=>{const ids=Array.from(e.currentTarget.selectedOptions as unknown as HTMLOptionElement[]).map((o:HTMLOptionElement)=>o.value);setSelectedSubjectIds(ids);setTeachingAssignments(prev=>prev.filter(a=>ids.includes(a.mapelId)));}} required><option value="" disabled>Pilih satu atau beberapa mata pelajaran</option>{subjectRows.map((m:any)=><option key={m.id} value={String(m.id)}>{m.nama} ({m.kode})</option>)}</select><small>Pilih mapel yang diajar. Setelah itu tentukan kelas untuk setiap mapel.</small></label><input type="hidden" name="mapelId" value={selectedSubjectIds[0]||""}/><input type="hidden" name="mapel" value={selectedSubjects.map((m:any)=>m.nama).join(", ")}/><input type="hidden" name="teachingAssignments" value={JSON.stringify(teachingAssignments)}/>{selectedSubjectIds.map(id=>{const subject=subjectRows.find((m:any)=>String(m.id)===id);const assigned=teachingAssignments.find(a=>a.mapelId===id)?.kelasIds||[];return <label className="field" key={id}><span>Kelas yang diajar — {subject?.nama||"Mapel"}</span><select className="input" multiple size={Math.min(5,Math.max(3,classRows.length))} value={assigned} onChange={e=>{const ids=Array.from(e.currentTarget.selectedOptions).map(o=>o.value);setTeachingAssignments(prev=>[...prev.filter(a=>a.mapelId!==id),{mapelId:id,kelasIds:ids}]);}} required><option value="" disabled>Pilih kelas</option>{classRows.map((cl:any)=><option key={cl.id} value={String(cl.id)}>{cl.nama||cl.namaKelas} · {cl.jurusan||""}</option>)}</select><small>Pilih semua kelas yang diajar untuk mapel ini (Ctrl/Cmd untuk beberapa kelas).</small></label>})}</>;
  const teacherSelect=()=><><label className="field"><span>Guru Pengampu</span><select className="input" name="guruIds" multiple size={Math.min(5,Math.max(3,teacherRows.length))} value={selectedGuruIds} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setSelectedGuruIds(Array.from(e.currentTarget.selectedOptions as unknown as HTMLOptionElement[]).map((o:HTMLOptionElement)=>o.value))}><option value="" disabled>Pilih satu atau beberapa guru</option>{teacherRows.map((g:any)=><option key={g.id} value={String(g.id)}>{g.nama} · {g.nip||g.email||"Guru"}</option>)}</select><small>Satu mapel boleh diajar oleh banyak guru. Pilih beberapa dengan Ctrl/Cmd.</small>{teacherRows.length===0&&<small className="text-amber-700">Buat akun Guru terlebih dahulu.</small>}</label><input type="hidden" name="guru" value={selectedTeachers.map((g:any)=>g.nama).join(", ")}/></>;
  const waliKelasForTeacher=()=><label className="field"><span>Wali Kelas (opsional)</span><select className="input" name="waliKelasId" value={selectedWaliKelasId} onChange={e=>setSelectedWaliKelasId(e.target.value)}><option value="">Tidak ditugaskan sebagai wali kelas</option>{classRows.map((c:any)=><option key={c.id} value={String(c.id)}>{c.nama} · {c.tingkat||""} {c.jurusan||""}</option>)}</select><input type="hidden" name="waliKelas" value={String(selectedWaliKelas?.nama||"")}/><small>Kelas wali akan otomatis terhubung ke data kelas.</small></label>;
  const waliSelect=()=><label className="field"><span>Wali Kelas</span><select className="input" name="waliGuruId" value={selectedWaliGuruId} onChange={e=>setSelectedWaliGuruId(e.target.value)}><option value="">Belum ditentukan</option>{teacherRows.map((g:any)=><option key={g.id} value={String(g.id)}>{g.nama} · {g.nip||g.email||"Guru"}</option>)}</select><input type="hidden" name="waliUserId" value={String(selectedWaliGuru?.userId||selectedWaliGuru?.id||"")}/><input type="hidden" name="wali" value={String(selectedWaliGuru?.nama||"")}/><small>Pilih guru dari akun yang sudah dibuat.</small></label>;
  return <form onSubmit={onSubmit} className="form-grid">
    {type === "pengguna" && <>{input("nama","Nama Lengkap","Nama pengguna",undefined,true)} {input("email","Email","nama@sekolah.sch.id",undefined,true)} <label className="field"><span>Peran</span><select name="role" className="input" value={selectedRole} onChange={(e)=>setSelectedRole(e.target.value)}><option>Admin</option><option>Guru</option><option>Siswa</option><option>Kurikulum</option><option>Kepsek</option></select></label>
      {selectedRole === "Guru" && <>{input("nip","NIP","Nomor Induk Pegawai",undefined,true)} {subjectSelect()} {waliKelasForTeacher()}</>}
      {selectedRole === "Siswa" && <>{input("nis","NIS","Nomor Induk Siswa",undefined,true)} {classSelect()} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||selectedClass?.jurusan||"DKV"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label></>}
      <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label><label className="field"><span>Kata Sandi {initial ? "(opsional)" : "(wajib)"}</span><input className="input" name="password" type="password" required={!initial} autoComplete="new-password" placeholder={initial?"Kosongkan jika tidak diubah":"Buat kata sandi akun"}/></label> {input("telepon","Telepon","08xxxxxxxxxx")}</>}
    {type === "guru" && <>{input("nama","Nama Guru","Nama lengkap",undefined,true)} {input("nip","NIP","NIP guru",undefined,true)} {input("email","Email","guru@educn.id",undefined,true)} <label className="field"><span>Kata Sandi {initial ? "(opsional)" : "(wajib)"}</span><input className="input" name="password" type="password" required={!initial} autoComplete="new-password" placeholder={initial ? "Kosongkan jika tidak diubah" : "Buat kata sandi akun guru"}/></label> {subjectSelect()} {waliKelasForTeacher()} <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label></>}
    {type === "siswa" && <>{input("nama","Nama Siswa","Nama lengkap",undefined,true)} {input("nis","NIS","Nomor induk siswa",undefined,true)} {classSelect()} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||selectedClass?.jurusan||"DKV"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label> {input("email","Email","siswa@sekolah.sch.id",undefined,true)} <label className="field"><span>Kata Sandi {initial ? "(opsional)" : "(wajib)"}</span><input className="input" name="password" type="password" required={!initial} autoComplete="new-password" placeholder={initial ? "Kosongkan jika tidak diubah" : "Buat kata sandi akun siswa"}/></label> <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label></>}
    {type === "kelas" && <>{input("nama","Nama Kelas","Contoh: XII PPLG 3",undefined,true)} {input("tingkat","Tingkat","X / XI / XII",undefined,true)} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||"PPLG"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label> {waliSelect()} <div className="field"><span>Jumlah Siswa</span><input className="input" value={String(i.jumlah ?? 0)} readOnly/><small>Jumlah siswa dihitung otomatis dari akun yang terhubung ke kelas ini.</small></div></>}
    {type === "mapel" && <>{input("kode","Kode","MTK-X",undefined,true)} {input("nama","Mata Pelajaran","Nama mata pelajaran",undefined,true)} <label className="field"><span>Jam Pelajaran (JP)</span><input className="input" name="jam" type="number" min="1" max="40" step="1" defaultValue={i.jam ?? 2} required/></label> {teacherSelect()}</>}
    <div className="form-actions"><button type="button" className="secondary-btn" onClick={onCancel}>Batal</button><button className="primary-btn"><CheckCircle2/> Simpan Data</button></div>
  </form>;
}

function normalizeType(type: keyof typeof typeConfig, data: any) {
  if (type === "kelas") return { ...data, waliGuruId: String(data.waliGuruId||""), waliUserId: String(data.waliUserId||""), jumlah: Number(data.jumlah || 0) };
  if (type === "mapel") { const { kelompok: _kelompok, ...rest } = data; void _kelompok; return { ...rest, jam: Number(data.jam || 0), guruIds: Array.isArray(data.guruIds)?data.guruIds.map(String):[], guru: String(data.guru||"").split(", ").filter(Boolean) }; }
  if (type === "guru") { const ids=Array.isArray(data.mapelIds)?data.mapelIds.map(String).filter(Boolean):(data.mapelId?[String(data.mapelId)]:[]); const assignments=Array.isArray(data.teachingAssignments)?data.teachingAssignments.map((a:any)=>({mapelId:String(a.mapelId||""),kelasIds:Array.isArray(a.kelasIds)?a.kelasIds.map(String).filter(Boolean):[]})).filter((a:any)=>ids.includes(a.mapelId)&&a.kelasIds.length):[]; const waliKelasId=String(data.waliKelasId||""); const waliKelas=String(data.waliKelas||""); return { ...data, mapelIds: ids, mapelId: ids[0]||"", mapel: String(data.mapel||""), teachingAssignments: assignments, kelasId: waliKelasId, kelas: waliKelas, waliKelasId, waliKelas }; }
  if (type === "pengguna") {
    const role = String(data.role || "Siswa");
    return {
      ...data,
      password: String(data.password || ""),
      nip: role === "Guru" ? String(data.nip || "").trim() : "",
      mapel: role === "Guru" ? String(data.mapel || "").trim() : "",
      mapelId: role === "Guru" ? String((Array.isArray(data.mapelIds)?data.mapelIds[0]:data.mapelId) || "").trim() : "",
      mapelIds: role === "Guru" ? (Array.isArray(data.mapelIds)?data.mapelIds.map(String):[]) : [],
      kelasId: role === "Guru" ? String(data.waliKelasId || "").trim() : role === "Siswa" ? String(data.kelasId || "").trim() : "",
      waliKelasId: role === "Guru" ? String(data.waliKelasId || "").trim() : "",
      waliKelas: role === "Guru" ? String(data.waliKelas || "").trim() : "",
      nis: role === "Siswa" ? String(data.nis || "").trim() : "",
      kelas: role === "Guru" ? String(data.waliKelas || "").trim() : role === "Siswa" ? String(data.kelas || "").trim() : "",
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
    <div className="activity-page-grid activity-page-grid-single">
      <Card title="Riwayat Aktivitas">
        {filtered.length===0 ? <EmptyStateText text="Belum ada aktivitas yang tercatat."/> : <div className="activity-large-list">{filtered.map((x:any)=><div className="activity-large" key={x.id}><span className="activity-symbol success"><Activity/></span><div><b>{x.title}</b><p>{x.detail || "Perubahan sistem"} · {x.time || ""}</p></div></div>)}</div>}
      </Card>
    </div>
  </div>;
}


function AnnouncementPage({role}:{role:Role}) {
  const canCreate = role === "admin";
  const [rows,setRows] = useCollection("announcements");
  const [open,setOpen] = useState(false);
  const [selected,setSelected] = useState<any>(null);
  const [q,setQ] = useState("");
  const [saving,setSaving] = useState(false);
  const [files,setFiles] = useState<File[]>([]);
  const [currentUserId,setCurrentUserId] = useState("");
  useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store",credentials:"include"}).then(r=>r.ok?r.json():null).then(d=>{if(active)setCurrentUserId(String(d?.user?.id||""))}).catch(()=>{});return()=>{active=false}},[]);
  const filtered = (rows as any[]).filter((x) => `${x.judul||""} ${x.isi||""} ${x.audience||""}`.toLowerCase().includes(q.toLowerCase()));
  const save = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if(saving) return;
    const form = e.currentTarget; const data = new FormData(form);
    const judul = String(data.get("judul")||"").trim(); const isi = String(data.get("isi")||"").trim();
    const audience = String(data.get("audience")||"Semua") as "Semua"|"Guru"|"Siswa";
    if(!judul || !isi){toast("Judul dan isi pengumuman wajib diisi.");return;}
    if(files.length>12){toast("Maksimal 12 lampiran per pengumuman.");return;}
    if(files.some(f=>f.size>50*1024*1024)){toast("Ukuran setiap lampiran maksimal 50 MB.");return;}
    setSaving(true);
    const uploadedFileIds:string[]=[];
    try {
      const id = uid("ann");
      const attachments:{fileId:string;fileName:string;contentType:string;size:number}[]=[];
      for(const file of files){
        const upload = new FormData(); upload.append("file",file); upload.append("purpose","announcement"); upload.append("recordId",id); upload.append("audience",audience);
        const response = await fetch("/api/files",{method:"POST",credentials:"include",body:upload});
        const result = await response.json(); if(!response.ok) throw new Error(result.error||`Gagal mengunggah ${file.name}`);
        uploadedFileIds.push(String(result.fileId));
        attachments.push({fileId:String(result.fileId),fileName:String(result.fileName||file.name),contentType:String(result.contentType||file.type),size:Number(result.size||file.size)});
      }
      const response=await fetch("/api/announcements",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,judul,isi,audience,attachments})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Gagal menyimpan pengumuman.");
      const row=result.data||{id,judul,isi,audience,tanggal:new Date().toLocaleString("id-ID"),status:"Terbit",attachments};
      setRows([row,...(rows as any[])] as any);
      await logAction("Membuat pengumuman",judul);toast("Pengumuman diterbitkan beserta lampiran.");setOpen(false);setFiles([]);form.reset();
    } catch(error){
      console.error(error);
      await Promise.all(uploadedFileIds.map(fileId=>fetch(`/api/files?id=${encodeURIComponent(fileId)}`,{method:"DELETE",credentials:"include"}).catch(()=>null)));
      toast(error instanceof Error?error.message:"Gagal menyimpan pengumuman.");
    }
    finally{setSaving(false);}
  };
  const remove = async (item:any) => {
    if(!window.confirm(`Hapus pengumuman “${item.judul}”?`))return;
    try{const response=await fetch(`/api/announcements?id=${encodeURIComponent(String(item.id))}`,{method:"DELETE",credentials:"include"});const result=await response.json();if(!response.ok)throw new Error(result.error||"Gagal menghapus pengumuman.");setRows((rows as any[]).filter((r)=>r.id!==item.id) as any);await logAction("Menghapus pengumuman",item.judul);toast("Pengumuman dihapus");if(selected?.id===item.id)setSelected(null);}
    catch(error){console.error(error);toast(error instanceof Error?error.message:"Gagal menghapus pengumuman.");}
  };
  const formatSize=(size:number)=>size<1024*1024?`${Math.max(1,Math.round(size/1024))} KB`:`${(size/1024/1024).toFixed(1)} MB`;
  return <div className="space-y-5 fade-up announcement-page">
    <PageHeader title="Pengumuman" description="Informasi sekolah, poster kegiatan, dan dokumen resmi dalam satu tempat." action={canCreate?<button className="primary-btn" onClick={()=>{setFiles([]);setOpen(true);}}><Plus/> Buat Pengumuman</button>:undefined}/>
    <div className="announcement-hero"><div className="announcement-hero-orb"/><div className="announcement-hero-copy"><span className="announcement-kicker"><Megaphone size={15}/> PUSAT INFORMASI EDUCN</span><h3>Informasi penting,<br/><em>langsung ke tujuan.</em></h3><p>Pengumuman ditampilkan sesuai target. Admin, Kurikulum, dan Kepsek dapat memantau seluruh informasi sekolah.</p></div><div className="announcement-hero-art"><div className="announcement-art-sheet"><Megaphone/><span>INFO</span><i/><i/><i/></div><div className="announcement-art-bubble">EduCN</div></div></div>
    <div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari judul atau isi pengumuman..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered.map((x:any)=>({Judul:x.judul,Isi:x.isi,Target:x.audience,Tanggal:x.tanggal,Status:x.status}))),"pengumuman-educn.csv","text/csv")}><Download/> Export</button></div>
    {filtered.length===0?<div className="glass-card-strong announcement-empty"><span><Megaphone/></span><b>Belum ada pengumuman untuk ditampilkan</b><p>Pengumuman akan muncul di sini jika ditargetkan untuk role akunmu atau ditujukan ke Semua.</p></div>:<div className="announcement-grid">{filtered.map((x:any)=><article className="announcement-card announcement-card-modern" key={x.id}>
      <div className="announcement-card-top"><span className={`announcement-audience ${String(x.audience)==="Semua"?"all":""}`}>{x.audience==="Semua"?<Users size={13}/>:<UserRoundCheck size={13}/>} {x.audience||"Semua"}</span><span className="announcement-date"><Clock3 size={12}/>{x.tanggal}</span></div>
      {x.attachments?.some((a:any)=>String(a.contentType||"").startsWith("image/"))&&<div className="announcement-poster"><img src={`/api/files?id=${encodeURIComponent(x.attachments.find((a:any)=>String(a.contentType||"").startsWith("image/")).fileId)}&inline=1`} alt={`Poster ${x.judul}`} loading="lazy"/></div>}
      <h3>{x.judul}</h3><p className="announcement-description">{x.isi||"Tidak ada deskripsi."}</p>
      {Array.isArray(x.attachments)&&x.attachments.length>0&&<div className="announcement-attachments">{x.attachments.map((a:any)=><a key={a.fileId} href={`/api/files?id=${encodeURIComponent(a.fileId)}`} className="announcement-attachment" download><FileText size={16}/><span><b>{a.fileName}</b><small>{formatSize(Number(a.size||0))}</small></span><Download size={15}/></a>)}</div>}
      <div className="announcement-card-actions"><button className="secondary-btn" onClick={()=>setSelected(x)}><Eye size={16}/> Baca detail</button>{canCreate&&(role!=="guru"||String(x.createdBy||"")===currentUserId)&&<button className="table-action danger" aria-label="Hapus pengumuman" onClick={()=>remove(x)}><Trash2/></button>}</div>
    </article>)}</div>}
    <Modal open={open} onClose={()=>{if(!saving){setOpen(false);setFiles([])}}} title="Buat Pengumuman" description="Tulis informasi lengkap, tentukan target, lalu tambahkan poster atau dokumen jika diperlukan.">
      <form className="form-grid announcement-form" onSubmit={save}>
        <label className="field full"><span>Judul Pengumuman</span><input className="input" name="judul" required maxLength={180} placeholder="Contoh: Informasi Pelaksanaan Ujian"/></label>
        <label className="field full"><span>Target Pengumuman</span><select className="input" name="audience" defaultValue="Semua"><option value="Semua">Semua (Guru & Siswa)</option><option value="Guru">Guru saja</option><option value="Siswa">Siswa saja</option></select><small>Admin, Kurikulum, dan Kepsek tetap dapat melihat semua pengumuman.</small></label>
        <label className="field full"><span>Isi / Deskripsi</span><textarea className="input min-h-36" name="isi" required maxLength={12000} placeholder="Jelaskan informasi dari judul pengumuman secara lengkap..."/></label>
        <div className="field full"><span>Lampiran Poster atau Dokumen</span><label className="announcement-upload"><UploadCloud/><b>Pilih gambar, PDF, atau dokumen</b><small>JPG, PNG, WEBP, PDF, DOCX, XLSX dan file umum · maksimal 50 MB per file</small><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={e=>setFiles(Array.from(e.target.files||[]))}/></label>{files.length>0&&<div className="announcement-file-list">{files.map((f,i)=><div key={`${f.name}-${i}`}><FileText size={15}/><span>{f.name}<small>{formatSize(f.size)}</small></span><button type="button" onClick={()=>setFiles(prev=>prev.filter((_,j)=>j!==i))} aria-label={`Hapus ${f.name}`}><X size={15}/></button></div>)}</div>}</div>
        <div className="form-actions"><button type="button" className="secondary-btn" disabled={saving} onClick={()=>{setOpen(false);setFiles([])}}>Batal</button><button className="primary-btn" disabled={saving}>{saving?<><RefreshCcw className="animate-spin"/> Mengunggah...</>:<><Megaphone/> Terbitkan Pengumuman</>}</button></div>
      </form>
    </Modal>
    <Modal open={Boolean(selected)} onClose={()=>setSelected(null)} title={selected?.judul||"Detail Pengumuman"} description={`Ditujukan untuk ${selected?.audience||"Semua"} · ${selected?.tanggal||""}`}>
      {selected&&<div className="announcement-detail"><p>{selected.isi}</p>{(selected.attachments||[]).map((a:any)=><a key={a.fileId} href={`/api/files?id=${encodeURIComponent(a.fileId)}`} className="announcement-attachment" download><FileText size={16}/><span><b>{a.fileName}</b><small>{formatSize(Number(a.size||0))}</small></span><Download size={15}/></a>)}</div>}
    </Modal>
  </div>;
}

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

function AttendancePage(_props:{role:Role}){
  const [classes]=useCollection("kelas"); const [students]=useCollection("siswa"); const [rows,setRows]=useCollection("attendance" as any);
  const [classId,setClassId]=useState("Semua"); const now=new Date(); const todayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const [tanggal,setTanggal]=useState(todayKey); const [bulan,setBulan]=useState(todayKey.slice(0,7)); const [draft,setDraft]=useState<Record<string,string>>({}); const [saving,setSaving]=useState(false); const [filterClass,setFilterClass]=useState("Semua");
  const classByName=new Map((classes as any[]).map((c:any)=>[String(c.nama||c.namaKelas||""),c]));
  const list=(students as any[]).filter((x:any)=>classId==="Semua"||(String(x.kelasId||"")===classId||String(x.kelas||"")===String((classes as any[]).find((c:any)=>String(c.id)===classId)?.nama||"")));
  const dateRows=(rows as any[]).filter((x:any)=>String(x.tanggal||"")===tanggal&&(classId==="Semua"||String(x.kelasId||"")===classId||String(x.kelas||"")===String((classes as any[]).find((c:any)=>String(c.id)===classId)?.nama||"")));
  const savedByStudent=new Map<string,any>(dateRows.map((x:any)=>[String(x.siswaId),x] as [string,any]));
  const valueFor=(student:any)=>({status:draft[String(student.id)]||String(savedByStudent.get(String(student.id))?.status||"Hadir"),waktu:String(savedByStudent.get(String(student.id))?.waktu||"")});
  const update=(studentId:string,status:string)=>setDraft(current=>({...current,[studentId]:status}));
  const changeDate=(value:string)=>{setTanggal(value);setBulan(value.slice(0,7));setDraft({});}; const changeClass=(value:string)=>{setClassId(value);setDraft({});}; const count=(status:string)=>list.filter((student:any)=>valueFor(student).status===status).length;
  const monthRows=(rows as any[]).filter((x:any)=>String(x.tanggal||"").startsWith(bulan)&&(filterClass==="Semua"||String(x.kelasId||"")===filterClass||String(x.kelas||"")===String((classes as any[]).find((c:any)=>String(c.id)===filterClass)?.nama||""))).sort((a:any,b:any)=>String(a.tanggal).localeCompare(String(b.tanggal))||String(a.kelas||"").localeCompare(String(b.kelas||""))||String(a.siswa||"").localeCompare(String(b.siswa||"")));
  const save=async()=>{if(!list.length)return;setSaving(true);const markedAt=new Date();const waktu=markedAt.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Jakarta"});const stamp=markedAt.toISOString();
    const existing=(rows as any[]).filter((x:any)=>!(String(x.tanggal||"")===tanggal&&(classId==="Semua"||String(x.kelasId||"")===classId||String(x.kelas||"")===String((classes as any[]).find((c:any)=>String(c.id)===classId)?.nama||""))));
    const fresh=list.map((student:any)=>{const studentId=String(student.id);const previous=savedByStudent.get(studentId);const changed=draft[studentId]!==undefined;const status=draft[studentId]||String(previous?.status||"Hadir");const cls=classByName.get(String(student.kelas||"")) as any;const recordedAt=changed||!previous?stamp:String(previous?.markedAt||stamp);const recordedTime=changed||!previous?waktu:String(previous?.waktu||waktu);return {id:String(previous?.id||uid("att")),siswaId:studentId,siswaUserId:String(student.userId||""),kelasId:String(student.kelasId||cls?.id||""),siswa:student.nama,nis:student.nis,kelas:student.kelas,tanggal,status,waktu:recordedTime,markedAt:recordedAt,catatan:String(previous?.catatan||"")};});
    try{const saved=await saveCollection("attendance" as any,[...fresh,...existing] as any);setRows(saved as any);setDraft({});await logAction("Menyimpan kehadiran",`${classId==="Semua"?"Semua kelas":(classes as any[]).find((c:any)=>String(c.id)===classId)?.nama||classId} · ${tanggal}`);toast(`Kehadiran disimpan. Waktu pencatatan ${waktu} WIB.`);}catch(error){console.error(error);toast(error instanceof Error?error.message:"Gagal menyimpan kehadiran ke MongoDB.")}finally{setSaving(false)}};
  const exportMonth=()=>{const data=monthRows.map((x:any)=>({Tanggal:x.tanggal||"",Bulan:String(x.tanggal||"").slice(5,7),Tahun:String(x.tanggal||"").slice(0,4),Jam:x.waktu||"—",Nama:x.siswa||"",NIS:x.nis||"",Kelas:x.kelas||"",Status:x.status||"",Catatan:x.catatan||""}));const workbook=XLSX.utils.book_new();const worksheet=XLSX.utils.json_to_sheet(data.length?data:[{Tanggal:"",Bulan:"",Tahun:"",Jam:"",Nama:"",NIS:"",Kelas:"",Status:"",Catatan:""}]);worksheet["!cols"]=[{wch:14},{wch:9},{wch:9},{wch:10},{wch:28},{wch:16},{wch:18},{wch:14},{wch:24}];XLSX.utils.book_append_sheet(workbook,worksheet,"Rekap Kehadiran");const classSuffix=filterClass==="Semua"?"semua-kelas":String((classes as any[]).find((c:any)=>String(c.id)===filterClass)?.nama||"kelas").replace(/[^a-z0-9-]/gi,"-");XLSX.writeFile(workbook,`rekap-kehadiran-${bulan}-${classSuffix}.xlsx`);};
  return <div className="space-y-5 fade-up"><PageHeader title="Kehadiran" description="Pilih status siswa lalu simpan. Jam kehadiran dicatat otomatis dari waktu aktual saat tombol Simpan ditekan."/><section className="attendance-control glass-card-strong"><div className="attendance-control-heading"><div><p className="eyebrow">Input Kehadiran</p><h3>Atur tanggal dan kelas</h3><p>Jam tidak perlu diisi manual; sistem mencatat waktu saat disimpan.</p></div><div className="attendance-month"><label htmlFor="attendance-month">Rekap bulan</label><input id="attendance-month" type="month" className="input" value={bulan} onChange={e=>setBulan(e.target.value)}/></div></div><div className="attendance-filters"><label className="field"><span>Tanggal Kehadiran</span><input type="date" className="input" value={tanggal} onChange={e=>changeDate(e.target.value)}/></label><label className="field"><span>Kelas</span><select className="input" value={classId} onChange={e=>changeClass(e.target.value)}>{(classes as any[]).map((x:any)=><option key={x.id} value={String(x.id)}>{x.nama||x.namaKelas}</option>)}</select></label><div className="attendance-save-wrap"><button className="primary-btn" onClick={save} disabled={!list.length||saving}>{saving?"Menyimpan...":<><CheckCircle2/> Simpan Kehadiran</>}</button></div></div></section><div className="attendance-kpis"><div><span>Hadir</span><b>{count("Hadir")}</b></div><div><span>Izin</span><b>{count("Izin")}</b></div><div><span>Alpa</span><b>{count("Alpa")}</b></div><div><span>Jumlah Siswa</span><b>{list.length}</b></div></div><div className="glass-card-strong table-card"><div className="attendance-table-heading"><div><h3>Daftar Siswa</h3><p>{new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</p></div><span>{dateRows.length} data tersimpan</span></div><div className="table-scroll"><table className="attendance-table"><thead><tr><th>Siswa</th><th>NIS</th><th>Status Kehadiran</th><th>Jam Tercatat</th></tr></thead><tbody>{list.length===0?<tr><td colSpan={4}><EmptyStateText text="Belum ada siswa untuk kelas ini. Buat data siswa dan kelas terlebih dahulu."/></td></tr>:list.map((student:any)=>{const current=valueFor(student);return <tr key={student.id}><td><div className="cell-main"><span className="avatar">{initials(student.nama)}</span><div><b>{student.nama}</b><small>{student.kelas}</small></div></div></td><td>{student.nis||"—"}</td><td><div className="attendance-pills">{["Hadir","Izin","Alpa"].map(status=><button type="button" key={status} className={`${current.status===status?"selected":""} ${status.toLowerCase()}`} onClick={()=>update(String(student.id),status)}>{status}</button>)}</div></td><td><b>{current.waktu||"Dicatat saat simpan"}</b></td></tr>})}</tbody></table></div></div><section className="glass-card-strong table-card attendance-history"><div className="attendance-table-heading"><div><h3>Riwayat Kehadiran Bulanan</h3><p>Data bulan {bulan} terhubung dengan semua kelas dan waktu pencatatan per siswa.</p></div><div className="attendance-history-actions"><select className="select" value={filterClass} onChange={e=>setFilterClass(e.target.value)}>{(classes as any[]).map((c:any)=><option key={c.id} value={String(c.id)}>{c.nama||c.namaKelas}</option>)}</select><button className="secondary-btn" onClick={exportMonth}><Download/> Export Excel</button></div></div><div className="table-scroll"><table><thead><tr><th>Tanggal</th><th>Jam</th><th>Siswa</th><th>NIS</th><th>Kelas</th><th>Status</th></tr></thead><tbody>{monthRows.length===0?<tr><td colSpan={6}><EmptyStateText text="Belum ada catatan kehadiran pada bulan dan filter kelas ini."/></td></tr>:monthRows.map((item:any)=><tr key={`${item.id}-${item.tanggal}`}><td>{item.tanggal}</td><td><b>{item.waktu||"—"}</b></td><td>{item.siswa||"—"}</td><td>{item.nis||"—"}</td><td>{item.kelas||"—"}</td><td><span className={`badge ${item.status==="Hadir"?"green":item.status==="Izin"?"blue":"gray"}`}>{item.status||"—"}</span></td></tr>)}</tbody></table></div><div className="table-footer">Menampilkan <b>{monthRows.length}</b> catatan kehadiran pada bulan {bulan}.</div></section></div>;
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


function escapeHtml(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function downloadPdfReport(title:string,data:any[],filename:string){
  const cols=data.length?Object.keys(data[0]):[];
  const clean=(v:any)=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7E]/g," ").replace(/([\\()])/g,"\\$1");
  const lines=[`Laporan ${title}`,`Dibuat: ${new Date().toLocaleString("id-ID")}`,cols.join(" | "),...data.map(row=>cols.map(c=>String(row[c]??"")).join(" | "))].map(clean);
  const pages:Array<string[]> = []; for(let i=0;i<lines.length;i+=58) pages.push(lines.slice(i,i+58));
  const objects:string[]=["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageRefs:string[]=[];
  pages.forEach((page,i)=>{
    const pageObj=4+i*2, contentObj=pageObj+1; pageRefs.push(`${pageObj} 0 R`);
    const stream=`BT /F1 9 Tf 40 800 Td 12 TL ${page.map((line,j)=>`${j?"T* ":""}(${line.slice(0,150)}) Tj`).join(" ")} ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  objects[1]=`<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pages.length} >>`;
  let pdf="%PDF-1.4\n",offsets=[0]; objects.forEach((obj,i)=>{offsets.push(new TextEncoder().encode(pdf).length);pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;}); const xref=new TextEncoder().encode(pdf).length; pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(o=>`${String(o).padStart(10,"0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const blob=new Blob([pdf],{type:"application/pdf"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
function ReportPage({role}:{role:Role}){
  const [rows,setRows]=useCollection("reports" as any);
  const [guru]=useCollection("guru");
  const [siswa]=useCollection("siswa");
  const [kelas]=useCollection("kelas");
  const [type,setType]=useState("Data Siswa");
  const [format,setFormat]=useState<"PDF"|"WORD"|"XLSX"|"CSV">("PDF");
  const [busy,setBusy]=useState(false);
  const can=role==="admin"||role==="kurikulum"||role==="kepsek";
  const reportData=()=>{
    if(type==="Data Guru") return (guru as any[]).map(g=>({Nama:g.nama||"",NIP:g.nip||"",Email:g.email||"", "Mata Pelajaran":g.mapel||"", "Wali Kelas":g.waliKelas||g.kelas||"",Status:g.status||""}));
    if(type==="Data Siswa") return (siswa as any[]).map(st=>({Nama:st.nama||"",NIS:st.nis||"",Kelas:st.kelas||"",Jurusan:st.jurusan||"",Email:st.email||"",Status:st.status||""}));
    return (kelas as any[]).map(k=>({Kelas:k.nama||"",Tingkat:k.tingkat||"",Jurusan:k.jurusan||"", "Wali Kelas":k.wali||k.waliKelas||"", "Jumlah Siswa":(siswa as any[]).filter(st=>String(st.kelasId||"")===String(k.id)||String(st.kelas||"").toLowerCase()===String(k.nama||"").toLowerCase()).length}));
  };
  const downloadReport=(data:any[])=>{
    const safe=type.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    if(format==="CSV") downloadText(toCsv(data),`laporan-${safe}.csv`,"text/csv;charset=utf-8");
    else if(format==="XLSX") { const ws=XLSX.utils.json_to_sheet(data); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Laporan"); XLSX.writeFile(wb,`laporan-${safe}.xlsx`); }
    else if(format==="WORD") { const cols=data.length?Object.keys(data[0]):[]; const html=`<html><head><meta charset="utf-8"></head><body><h1>Laporan ${type}</h1><table border="1"><thead><tr>${cols.map(c=>`<th>${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${data.map(row=>`<tr>${cols.map(c=>`<td>${escapeHtml(String(row[c]??""))}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`; downloadText(html,`laporan-${safe}.doc`,"application/msword;charset=utf-8"); }
    else downloadPdfReport(type,data,`laporan-${safe}.pdf`);
  };
  const generate=async()=>{
    if(!can)return;
    setBusy(true);
    try{
      const data=reportData();
      if(!data.length){toast(`Belum ada data ${type.toLowerCase()} untuk diunduh.`);return;}
      downloadReport(data);
      const item={id:uid("report"),judul:`Laporan ${type}`,tanggal:new Date().toLocaleDateString("id-ID"),format,status:"Diunduh",jenis:type};
      const saved=await saveCollection("reports" as any,[item,...(rows as any[])] as any); setRows(saved as any);
      await logAction("Mengunduh laporan",`${item.judul} · ${format}`);
      toast(`Laporan ${type} berhasil dibuat dan diunduh.`);
    }catch(error){console.error(error);toast("Gagal membuat atau mengunduh laporan.");}
    finally{setBusy(false);}
  };
  return <div className="space-y-5 fade-up"><PageHeader title="Laporan Akademik" description="Buat dan unduh laporan dari data sekolah yang tersimpan." action={<button className="secondary-btn" onClick={()=>downloadText(toCsv(rows as any[]),"riwayat-laporan-educn.csv","text/csv")}><Download/> Export Riwayat</button>}/><div className="report-builder glass-card-strong"><div><p className="eyebrow">Buat Laporan</p><h3>Generate laporan baru</h3><p>Pilih jenis data dan format dokumen untuk diunduh.</p></div><div className="form-grid"><label className="field"><span>Jenis Laporan</span><select className="input" value={type} onChange={e=>setType(e.target.value)}><option>Data Guru</option><option>Data Siswa</option><option>Rekap Kelas</option></select></label><label className="field"><span>Format Dokumen</span><select className="input" value={format} onChange={e=>setFormat(e.target.value as any)}><option value="PDF">PDF</option><option value="WORD">Word (.doc)</option><option value="XLSX">Excel (.xlsx)</option><option value="CSV">CSV</option></select></label><div className="field flex items-end"><button className="primary-btn w-full" onClick={generate} disabled={!can||busy}><FileBarChart/>{busy?"Menyiapkan...":"Generate & Download"}</button></div></div></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr><th>Nama Laporan</th><th>Tanggal</th><th>Format</th><th>Status</th></tr></thead><tbody>{(rows as any[]).length===0?<tr><td colSpan={4}><EmptyStateText text="Belum ada laporan yang dibuat."/></td></tr>:(rows as any[]).map((r:any)=><tr key={r.id}><td><b>{r.judul}</b></td><td>{r.tanggal}</td><td><span className="badge blue">{r.format}</span></td><td><span className="badge green">{r.status}</span></td></tr>)}</tbody></table></div></div></div>;
}

function ProfilePage({role}:{role:Role}){
  const [profile,setProfile]=useState<{nama:string;email:string;telepon:string;kelas:string;kelasId:string;jurusan:string;waliKelas:string;jumlahSiswa:number;avatarFileId:string}>({nama:"",email:"",telepon:"",kelas:"",kelasId:"",jurusan:"",waliKelas:"",jumlahSiswa:0,avatarFileId:""});
  const [saved,setSaved]=useState(false); const [uploading,setUploading]=useState(false);
  useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store",credentials:"include"}).then(r=>r.ok?r.json():Promise.reject(new Error("Sesi tidak valid"))).then((d:any)=>{if(active&&d.user)setProfile(p=>({...p,nama:d.user.nama||"",email:d.user.email||"",telepon:d.user.telepon||"",kelas:d.user.kelas||"",kelasId:d.user.kelasId||"",jurusan:d.user.jurusan||"",waliKelas:d.user.waliKelas||"",jumlahSiswa:Number(d.user.jumlahSiswa||0),avatarFileId:d.user.avatarFileId||""}))}).catch(()=>{});return()=>{active=false}},[]);
  const uploadPhoto=async(e:ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);try{const form=new FormData();form.append("file",file);form.append("purpose","profile");const r=await fetch("/api/files",{method:"POST",body:form,credentials:"include"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Foto gagal diunggah");setProfile(p=>({...p,avatarFileId:String(d.fileId)}));setSaved(false);toast("Foto profil diunggah. Tekan Simpan Perubahan untuk menerapkan.");}catch(error){toast(error instanceof Error?error.message:"Foto profil gagal diunggah")}finally{setUploading(false);e.target.value=""}};
  const save=async()=>{try{const r=await fetch("/api/auth/me",{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({nama:profile.nama,telepon:profile.telepon,avatarFileId:profile.avatarFileId})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Gagal menyimpan");setProfile(p=>({...p,nama:d.user?.nama||p.nama,telepon:d.user?.telepon||p.telepon}));setSaved(true);await logAction("Memperbarui profil",profile.nama);toast("Profil berhasil disimpan");}catch(error){toast(error instanceof Error?error.message:"Profil gagal disimpan")}};
  const photoUrl=profile.avatarFileId?`/api/files?id=${encodeURIComponent(profile.avatarFileId)}&inline=1`:"";
  return <div className="space-y-5 fade-up"><PageHeader title="Profil" description="Kelola identitas dan foto profil akun." action={<button className="primary-btn" onClick={save}><CheckCircle2/> Simpan Perubahan</button>}/><div className="profile-layout"><Card title="Informasi Profil" subtitle=""><div className="profile-cover"><div className="profile-avatar overflow-hidden">{photoUrl?<img src={photoUrl} alt="Foto profil" className="h-full w-full object-cover"/>:initials(profile.nama||roleMeta[role].label)}</div><div><b>{profile.nama||"Belum tersedia"}</b><p>{roleMeta[role].label}</p><label className="secondary-btn compact mt-2 cursor-pointer"><UploadCloud/> {uploading?"Mengunggah...":"Unggah Foto Profil"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadPhoto} disabled={uploading}/></label><small className="block text-slate-500 mt-1">JPG, PNG, WEBP · maksimal 5 MB</small></div></div><div className="form-grid mt-5"><label className="field"><span>Nama Lengkap</span><input className="input" value={profile.nama} onChange={e=>setProfile(p=>({...p,nama:e.target.value}))}/></label><label className="field"><span>Email</span><input className="input" value={profile.email} readOnly/></label><label className="field"><span>Nomor Telepon</span><input className="input" value={profile.telepon} onChange={e=>setProfile(p=>({...p,telepon:e.target.value}))} placeholder="08xxxxxxxxxx"/></label><label className="field"><span>Role</span><input className="input" value={roleMeta[role].label} readOnly/></label>{(role==="siswa"||role==="guru")&&<><label className="field"><span>{role==="guru"?"Wali Kelas":"Kelas"}</span><input className="input" value={profile.kelas||"Belum terhubung"} readOnly/></label><label className="field"><span>Jurusan</span><input className="input" value={profile.jurusan||"Belum terhubung"} readOnly/></label>{role==="siswa"&&<><label className="field"><span>Wali Kelas</span><input className="input" value={profile.waliKelas||"Belum ditentukan"} readOnly/></label><label className="field"><span>Jumlah Siswa di Kelas</span><input className="input" value={String(profile.jumlahSiswa)} readOnly/></label></>}</>}</div>{saved&&<div className="inline-success mt-4"><CheckCircle2/> Profil sudah diperbarui.</div>}</Card></div></div>;
}

function SecuritySettings(){ const [two,setTwo]=useState(true); const [session,setSession]=useState(true); return <div className="setting-list"><ToggleRow icon={ShieldCheck} title="Autentikasi 2 Faktor" text="Tambahkan lapisan keamanan saat login." on={two} setOn={setTwo}/><ToggleRow icon={LockKeyhole} title="Perangkat tepercaya" text="Izinkan perangkat ini mengingat sesi login." on={session} setOn={setSession}/><button className="secondary-btn w-full mt-2" onClick={()=>toast("Semua sesi lain sudah dicabut")}>Keluar dari semua perangkat</button></div>; }
function ToggleRow({icon:Icon,title,text,on,setOn}:{icon:any;title:string;text:string;on:boolean;setOn:(v:boolean)=>void}){return <div className="toggle-row"><span className="setting-icon"><Icon/></span><div><b>{title}</b><small>{text}</small></div><button className={`toggle ${on?"on":""}`} onClick={()=>setOn(!on)} aria-label={title}><i/></button></div>;}

function SettingsPage({role}:{role:Role}){ const [maintenance,setMaintenance]=useState(false); const [backup,setBackup]=useState(true); const [notif,setNotif]=useState(true); const [compact,setCompact]=useState(false); useEffect(()=>{try{const raw=localStorage.getItem("educn-settings");if(!raw)return;const saved=JSON.parse(raw) as {maintenance?:boolean;backup?:boolean;notif?:boolean;compact?:boolean};if(typeof saved.maintenance==="boolean")setMaintenance(saved.maintenance);if(typeof saved.backup==="boolean")setBackup(saved.backup);if(typeof saved.notif==="boolean")setNotif(saved.notif);if(typeof saved.compact==="boolean")setCompact(saved.compact);}catch{ /* Ignore invalid browser settings and keep defaults. */}},[]); return <div className="space-y-5 fade-up"><PageHeader title="Pengaturan" description="Sesuaikan pengalaman, notifikasi, dan konfigurasi workspace." action={<button className="primary-btn" onClick={()=>{localStorage.setItem("educn-settings",JSON.stringify({maintenance,backup,notif,compact}));toast("Pengaturan berhasil disimpan")}}><CheckCircle2/> Simpan Pengaturan</button>}/><div className="settings-grid"><Card title="Umum" subtitle="Konfigurasi utama sistem."><div className="setting-list"><ToggleRow icon={Settings2} title="Mode Maintenance" text="Sembunyikan modul publik saat perawatan." on={maintenance} setOn={setMaintenance}/><ToggleRow icon={HardDrive} title="Backup Otomatis" text="Backup data setiap malam." on={backup} setOn={setBackup}/><ToggleRow icon={Bell} title="Notifikasi Sistem" text="Terima notifikasi aktivitas penting." on={notif} setOn={setNotif}/><ToggleRow icon={LayoutDashboard} title="Tampilan Ringkas" text="Kurangi kepadatan informasi dashboard." on={compact} setOn={setCompact}/></div></Card><Card title="Identitas Aplikasi" subtitle="Informasi yang digunakan pada laporan."><div className="form-grid"><label className="field"><span>Nama Aplikasi</span><input className="input" value="EduCN" readOnly/></label><label className="field"><span>Versi</span><input className="input" value="2.0.0" readOnly/></label><label className="field"><span>Zona Waktu</span><select className="input"><option>Asia/Jakarta (WIB)</option><option>Asia/Makassar (WITA)</option><option>Asia/Jayapura (WIT)</option></select></label><label className="field"><span>Bahasa</span><select className="input"><option>Bahasa Indonesia</option><option>English</option></select></label></div></Card></div><Card title="Pemulihan Data" subtitle="Operasi maintenance untuk workspace sekolah."><div className="recovery-grid"><button className="secondary-btn" onClick={()=>{resetCollection("users");toast("Data pengguna dikosongkan")}}><RefreshCcw/> Reset Data Pengguna</button><button className="secondary-btn" onClick={()=>{Object.keys(localStorage).filter(k=>k.startsWith("educn-v2-")).forEach(k=>localStorage.removeItem(k));toast("Cache browser dibersihkan. Muat ulang halaman")}}><RefreshCcw/> Reset Workspace</button><button className="danger-btn" onClick={()=>{localStorage.clear();toast("Local storage dibersihkan")}}><Trash2/> Bersihkan Local Storage</button></div></Card></div>; }

function HelpPage({role}:{role:Role}){ const [open,setOpen]=useState<string|null>(null); const faqs=[["Bagaimana cara menambah pengguna?","Buka menu Pengguna, tekan Tambah Data, isi form lalu Simpan Data."],["Bagaimana export laporan?","Setiap tabel yang menyediakan data dapat diekspor melalui tombol Export."],["Apakah semua role memiliki akses yang sama?","Tidak. Sidebar dan modul berubah berdasarkan role untuk menjaga hak akses."],["Apa yang terjadi saat logout?","Sesi demo di browser dihapus dan pengguna kembali ke halaman login."]]; return <div className="space-y-5 fade-up"><PageHeader title="Pusat Bantuan" description="Panduan singkat untuk menggunakan EduCN." action={<button className="primary-btn" onClick={()=>toast("Tiket bantuan dibuat") }><MessageCircle/> Buat Tiket</button>}/><div className="help-grid"><Card title="FAQ" subtitle="Pertanyaan paling sering ditanyakan."><div className="faq-list">{faqs.map(([q,a])=><button key={q} className="faq-item" onClick={()=>setOpen(open===q?null:q)}><div><b>{q}</b>{open===q&&<p>{a}</p>}</div><ChevronDown className={open===q?"rotate-180":""}/></button>)}</div></Card><Card title="Kontak Bantuan" subtitle="Butuh bantuan lebih lanjut?"><div className="contact-card"><span><MessageCircle/></span><div><b>Tim Support EduCN</b><p>Senin–Jumat · 08.00–17.00 WIB</p><button className="secondary-btn" onClick={()=>toast("Live chat dibuka")}>Mulai Chat</button></div></div><div className="contact-card"><span><FileText/></span><div><b>Dokumentasi Sistem</b><p>Panduan lengkap penggunaan modul.</p><button className="secondary-btn" onClick={()=>toast("Dokumentasi dibuka")}>Baca Dokumentasi</button></div></div></Card></div></div>; }

function NotFound({role}:{role:Role}) { return <div className="empty-page"><div className="empty-state"><CircleAlert/><b>Halaman belum tersedia</b><span>Modul tersebut tidak ada pada role {roleMeta[role].label}.</span><Link href={`/${role}`} className="primary-btn">Kembali ke Beranda</Link></div></div>; }

function StudentClassPage(){
  const [classes]=useCollection("kelas"); const [students]=useCollection("siswa"); const [profile,setProfile]=useState<any>(null);
  useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store",credentials:"include"}).then(r=>r.ok?r.json():null).then(d=>{if(active)setProfile(d?.user||null)}).catch(()=>{});return()=>{active=false}},[]);
  const current=(classes as any[]).find((c:any)=>String(c.id||"")===String(profile?.kelasId||"")||String(c.nama||c.namaKelas||"").trim().toLowerCase()===String(profile?.kelas||"").trim().toLowerCase());
  const className=current?.nama||profile?.kelas||"Belum terhubung"; const major=current?.jurusan||profile?.jurusan||"Jurusan belum tersedia";
  const studentCount=Number(current?.jumlah??profile?.jumlahSiswa??(students as any[]).length??0);
  return <div className="space-y-5 fade-up student-class-page"><PageHeader title="Kelas Saya" description=""/>
    <section className="student-class-hero"><div className="student-class-glow"/><div className="student-class-hero-content"><span className="student-class-label"><School size={15}/> RUANG KELAS DIGITAL</span><h2>{className}</h2><p>{current?.tingkat||profile?.tingkat||"SMK Citra Negara"} <span>·</span> {major}</p><div className="student-class-tags"><span><BookMarked size={14}/>{major}</span><span><Users size={14}/>{studentCount} siswa terdaftar</span></div></div><div className="student-class-emblem"><School/><span>EduCN</span></div></section>
    <div className="student-class-info-grid"><article className="student-class-info-card"><div className="student-class-info-icon teacher"><GraduationCap/></div><div><small>WALI KELAS</small><h3>{current?.wali||profile?.waliKelas||"Belum ditentukan"}</h3><p></p></div></article><article className="student-class-info-card"><div className="student-class-info-icon students"><Users/></div><div><small>JUMLAH SISWA</small><h3>{studentCount}</h3><p></p></div></article><article className="student-class-info-card"><div className="student-class-info-icon major"><BookOpen/></div><div><small>PROGRAM KEAHLIAN</small><h3>{major}</h3><p></p></div></article></div>
   
  </div>;
}

const routePages: Record<string,(props:{role:Role})=>ReactElement> = {
  pengguna: (p) => <CrudPage {...p} type="pengguna" />, guru: (p) => <CrudPage {...p} type="guru" />, siswa: (p) => <CrudPage {...p} type="siswa" />, kelas: (p) => p.role === "siswa" ? <StudentClassPage/> : <CrudPage {...p} type="kelas" />, mapel: (p) => <CrudPage {...p} type="mapel" />,
  aktivitas: (p) => <ActivitiesPage {...p} />, pengumuman: (p) => <AnnouncementPage {...p} />, materi: (p) => <MaterialPage {...p} />, tugas: (p) => <TaskPage {...p} />, kehadiran: (p) => <AttendancePage {...p} />, penilaian: (p) => <GradePage {...p} />, nilai: (p) => <GradePage {...p} />, laporan: (p) => <ReportPage {...p} />, profil: (p) => <ProfilePage {...p} />,
  jadwal: (p) => <SchedulePage {...p} />,
  users: (p) => <CrudPage {...p} type="pengguna" />, activity: (p) => <ActivitiesPage {...p} />, profile: (p) => <ProfilePage {...p} />,
};

function SchedulePage({role}:{role:Role}){
  const [rows,setRows]=useCollection("schedules" as any); const [classes]=useCollection("kelas"); const [subjects]=useCollection("mapel"); const [teachers]=useCollection("guru");
  const [user,setUser]=useState<any>(null); const [open,setOpen]=useState(false); const [q,setQ]=useState(""); const [day,setDay]=useState("Senin"); const [start,setStart]=useState("07:00"); const [finish,setFinish]=useState("08:30"); const [classId,setClassId]=useState(""); const [subjectId,setSubjectId]=useState(""); const [teacherId,setTeacherId]=useState(""); const [saving,setSaving]=useState(false);
  useEffect(()=>{let active=true;fetch("/api/auth/me",{cache:"no-store",credentials:"include"}).then(r=>r.ok?r.json():null).then(d=>{if(active){setUser(d?.user||null);if(d?.user?.kelasId)setClassId(String(d.user.kelasId));if(Array.isArray(d?.user?.mapelOptions)&&d.user.mapelOptions[0])setSubjectId(String(d.user.mapelOptions[0].id));}}).catch(()=>{});return()=>{active=false}},[]);
  const isTeacher=role==="guru"; const assignedClass=(classes as any[]).find((c:any)=>String(c.id)===String(user?.kelasId||""));
  const teacherOptions=(teachers as any[]).filter((g:any)=>Array.isArray(g.teachingAssignments)&&g.teachingAssignments.some((a:any)=>String(a.mapelId)===String(subjectId)&&Array.isArray(a.kelasIds)&&a.kelasIds.map(String).includes(String(classId))));
  const subjectOptions=isTeacher?(Array.isArray(user?.mapelOptions)?user.mapelOptions:[]):(subjects as any[]);
  const filtered=(rows as any[]).filter((x:any)=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));
  const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const actualClassId=isTeacher?String(user?.kelasId||user?.waliKelasId||""):classId;const actualTeacherId=isTeacher?String(user?.id||""):teacherId;if(!actualClassId||!subjectId||!actualTeacherId){toast("Pilih kelas, mapel, dan guru yang sudah terhubung.");return;} if(!isTeacher&&!teacherOptions.some((g:any)=>String(g.id)===actualTeacherId)){toast("Guru tersebut tidak ditugaskan untuk mapel dan kelas yang dipilih.");return;}setSaving(true);try{const r=await fetch("/api/schedules",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({hari:day,jamMulai:start,jamSelesai:finish,kelasId:actualClassId,mapelId:subjectId,guruId:actualTeacherId})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Jadwal gagal disimpan");const fresh=await fetchCollection("schedules" as any);setRows(fresh as any);await logAction("Menambah jadwal",`${d.data?.mapel||"Mapel"} · ${d.data?.kelas||"Kelas"}`);toast("Jadwal berhasil disimpan dan terhubung ke kelas");setOpen(false);}catch(error){toast(error instanceof Error?error.message:"Gagal menyimpan jadwal")}finally{setSaving(false)}};
  const removeSchedule=async(id:string)=>{if(!window.confirm("Hapus jadwal ini?"))return;try{const r=await fetch(`/api/schedules?id=${encodeURIComponent(id)}`,{method:"DELETE",credentials:"include"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Jadwal gagal dihapus");setRows(await fetchCollection("schedules" as any) as any);toast("Jadwal dihapus");}catch(error){toast(error instanceof Error?error.message:"Jadwal gagal dihapus")}};
  return <div className="space-y-5 fade-up"><PageHeader title="Jadwal Pelajaran" description="Jadwal terhubung dengan kelas, mata pelajaran, dan guru dari data sekolah." action={<div className="flex gap-2"><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"jadwal-educn.csv","text/csv")}><Download/> Export</button>{(role==="admin"||role==="guru")&&<button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Tambah Jadwal</button>}</div>}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari hari, mapel, kelas, atau guru..." value={q} onChange={e=>setQ(e.target.value)}/></div></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr><th>Hari</th><th>Jam</th><th>Mapel</th><th>Kelas</th><th>Guru</th>{(role==="admin"||role==="guru")&&<th>Aksi</th>}</tr></thead><tbody>{filtered.length===0?<tr><td colSpan={(role==="admin"||role==="guru")?6:5}><EmptyStateText text="Belum ada jadwal pelajaran yang disimpan."/></td></tr>:filtered.map((x:any)=><tr key={x.id}><td>{x.hari}</td><td>{x.jam||`${x.jamMulai||""} - ${x.jamSelesai||""}`}</td><td>{x.mapel}</td><td>{x.kelas}</td><td>{x.guru}</td>{(role==="admin"||role==="guru")&&<td><button className="table-action danger" title="Hapus jadwal" onClick={()=>removeSchedule(String(x.id))}><Trash2/></button></td>}</tr>)}</tbody></table></div></div><Modal open={open} onClose={()=>setOpen(false)} title="Tambah Jadwal Pelajaran" description={isTeacher?"":"Pilih kelas, mapel, dan guru dari data yang sudah dibuat."}><form className="form-grid schedule-form-grid" onSubmit={save}><div className="schedule-form-intro full"><span className="schedule-form-icon"><CalendarDays/></span><div><b>Atur jadwal pembelajaran</b><p></p></div></div><label className="field"><span>Hari</span><select className="input" value={day} onChange={e=>setDay(e.target.value)}>{["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"].map(d=><option key={d}>{d}</option>)}</select></label><label className="field"><span>Jam Mulai</span><input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)} required/></label><label className="field"><span>Jam Selesai</span><input className="input" type="time" value={finish} onChange={e=>setFinish(e.target.value)} required/></label>{isTeacher?<div className="field"><span>Wali Kelas</span><div className="input flex items-center">{assignedClass?.nama||user?.kelas||user?.waliKelas||"Memuat kelas wali..."}</div><small>Jadwal guru hanya masuk ke kelas wali yang terhubung ke akun ini.</small></div>:<label className="field"><span>Kelas</span><select className="input" value={classId} onChange={e=>{setClassId(e.target.value);setTeacherId("");}} required><option value="">Pilih kelas</option>{(classes as any[]).map((c:any)=><option key={c.id} value={String(c.id)}>{c.nama} · {c.jurusan}</option>)}</select></label>}<label className="field"><span>Mata Pelajaran</span><select className="input" value={subjectId} onChange={e=>{setSubjectId(e.target.value);if(!isTeacher)setTeacherId("")}} required><option value="">Pilih mapel</option>{subjectOptions.map((m:any)=><option key={m.id} value={String(m.id)}>{m.nama} ({m.kode||""})</option>)}</select>{subjectOptions.length===0&&<small className="text-amber-700">Belum ada mapel yang ditugaskan pada akun ini.</small>}</label>{isTeacher?<div className="field"><span>Guru</span><div className="input flex items-center">{user?.nama||"Guru yang login"}</div></div>:<label className="field"><span>Guru</span><select className="input" value={teacherId} onChange={e=>setTeacherId(e.target.value)} required><option value="">Pilih guru pengampu</option>{teacherOptions.map((g:any)=><option key={g.id} value={String(g.id)}>{g.nama}</option>)}</select>{teacherOptions.length===0&&<small className="text-amber-700">Belum ada guru yang ditugaskan pada mapel ini.</small>}</label>}<div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>Batal</button><button className="primary-btn" disabled={saving}>{saving?"Menyimpan...":<><CheckCircle2/> Simpan Jadwal</>}</button></div></form></Modal></div>;
}

function toCsv(rows: any[]) { if (!rows.length) return ""; const keys=Object.keys(rows[0]); return [keys.join(","),...rows.map(r=>keys.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\n"); }
function downloadText(content:string,name:string,type:string){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
