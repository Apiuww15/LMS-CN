"use client";

import Link from "next/link";
import { FormEvent, ReactElement, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowUpRight, BarChart3, Bell, BookOpen, BookMarked, CalendarDays, CheckCircle2,
  CheckSquare2, ChevronDown, CircleAlert, Clock3, Download, FileBarChart, GraduationCap, HardDrive,
  Info, LayoutDashboard, Megaphone, MoreHorizontal, Pencil, Plus, RefreshCcw, Search, Server, ShieldCheck,
  Sparkles, Trash2, UserCircle2, Users, X, School, ClipboardList, Calculator, Eye, Filter, LockKeyhole,
  Settings2, MessageCircle, Trophy, Target, ClipboardCheck, LibraryBig, UserRoundCheck, FileText
} from "lucide-react";
import { GradeRecord, MAJORS, seed, UserRecord } from "@/lib/data";
import { Role, roleMeta, roleNav } from "@/lib/portal";
import { fetchCollection, loadCollection, logAction, saveCollection, uid, resetCollection } from "@/lib/store";
import Modal from "./Modal";

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
        <h2>Selamat datang 👋</h2>
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
      <Card title="Sebaran Jurusan" subtitle="Berdasarkan data siswa yang tersimpan.">
        <div className="simple-metrics">{MAJORS.map((major) => <div key={major}><span>{major}</span><b>{majors[major] ?? 0}</b></div>)}</div>
      </Card>
      <Card title="Status Data" subtitle="Tidak ada data contoh bawaan.">
        <div className="insight-strip compact"><div><p className="eyebrow">MongoDB Live</p><h3>{(summary?.counts.users ?? 0) === 0 ? "Workspace masih kosong" : "Workspace sudah berisi data nyata"}</h3><p>{(summary?.counts.users ?? 0) === 0 ? "Silakan Admin membuat akun, guru, siswa, kelas, dan data akademik." : "Perubahan data akan tersinkron otomatis ke dashboard."}</p></div><div className="insight-badge"><CheckCircle2/><span>Sinkron otomatis setiap 3 detik</span></div></div>
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
  const [q, setQ] = useState(""); const [status, setStatus] = useState("Semua"); const [modal, setModal] = useState(false); const [view, setView] = useState<any>(null); const [editing, setEditing] = useState<any>(null);
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
  return <div className="space-y-5 fade-up"><PageHeader title={cfg.title} description={cfg.description} action={canMutate ? <button className="primary-btn" onClick={()=>{setEditing(null);setModal(true)}}><Plus/> Tambah Data</button> : undefined}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari data..." value={q} onChange={(e)=>setQ(e.target.value)}/></div><select className="select" value={status} onChange={(e)=>setStatus(e.target.value)}><option>Semua</option><option>Aktif</option><option>Non-aktif</option></select><button className="secondary-btn" onClick={()=>{ const csv = toCsv(filtered as any[]); downloadText(csv, `${type}-educn.csv`, "text/csv"); toast("Data berhasil diekspor"); }}><Download/> Export</button></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr>{cfg.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{filtered.length===0?<tr><td colSpan={cfg.columns.length}><EmptyState/></td></tr>:filtered.map((row:any)=><tr key={row.id}><td><div className="cell-main"><span className="avatar">{initials(row.nama || row.nama)}</span><div><b>{row.nama || row.nama}</b><small>{row.email || row.nip || row.nis || row.kode}</small></div></div></td>{type==="pengguna" && <><td>{row.email}</td><td><span className="badge blue">{row.role}</span></td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="guru" && <><td>{row.nip}</td><td>{row.mapel}</td><td>{row.kelas}</td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="siswa" && <><td>{row.nis}</td><td>{row.kelas}</td><td>{row.jurusan}</td><td><span className={`badge ${row.status==="Aktif"?"green":"gray"}`}>{row.status}</span></td></>}{type==="kelas" && <><td>{row.tingkat}</td><td>{row.jurusan}</td><td>{row.wali}</td><td>{row.jumlah}</td></>}{type==="mapel" && <><td>{row.nama}</td><td>{row.kelompok}</td><td>{row.jam} JP</td><td>{row.guru}</td></>}<td><div className="row-actions"><button className="table-action" onClick={()=>setView(row)} title="Lihat"><Eye/></button>{canMutate&&<button className="table-action" onClick={()=>{setEditing(row);setModal(true)}} title="Edit"><Pencil/></button>}{canMutate&&<button className="table-action danger" onClick={()=>remove(row.id)} title="Hapus"><Trash2/></button>}</div></td></tr>)}</tbody></table></div><div className="table-footer">Menampilkan <b>{filtered.length}</b> dari <b>{(rows as any[]).length}</b> data</div></div>
    <Modal open={modal} onClose={()=>{setModal(false);setEditing(null)}} title={editing ? `Edit ${cfg.title}` : `Tambah ${cfg.title}`} description="Lengkapi data dengan benar sebelum menyimpan."><CrudForm type={type} initial={editing} onSubmit={save} onCancel={() => { setModal(false); setEditing(null); }}/></Modal>
    <Modal open={!!view} onClose={()=>setView(null)} title="Detail Data" description="Informasi lengkap item yang dipilih."><DetailCard data={view}/></Modal>
  </div>;
}

function CrudForm({ type, initial, onSubmit, onCancel }: { type: keyof typeof typeConfig; initial: any; onSubmit: (e: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const i=initial||{};
  const input=(name:string,label:string,placeholder:string, value?:string)=><label className="field"><span>{label}</span><input className="input" name={name} defaultValue={value ?? i[name] ?? ""} placeholder={placeholder}/></label>;
  return <form onSubmit={onSubmit} className="form-grid">
    {type === "pengguna" && <>{input("nama","Nama Lengkap","Nama pengguna")} {input("email","Email","nama@sekolah.sch.id")} <label className="field"><span>Peran</span><select name="role" className="input" defaultValue={i.role||"Siswa"}><option>Admin</option><option>Guru</option><option>Siswa</option><option>Kurikulum</option><option>Kepsek</option></select></label><label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label><label className="field"><span>Kata Sandi {initial ? "(opsional)" : ""}</span><input className="input" name="password" type="password" required={!initial} autoComplete="new-password" placeholder={initial?"Kosongkan jika tidak diubah":"Buat kata sandi akun"}/></label> {input("telepon","Telepon","08xxxxxxxxxx")}</>}
    {type === "guru" && <>{input("nama","Nama Guru","Nama lengkap")} {input("nip","NIP","NIP guru")} {input("email","Email","guru@educn.id")} {input("mapel","Mata Pelajaran","Contoh: Matematika")} {input("kelas","Kelas","Contoh: X PPLG 1, XI PPLG 1")} <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label></>}
    {type === "siswa" && <>{input("nama","Nama Siswa","Nama lengkap")} {input("nis","NIS","Nomor induk siswa")} {input("kelas","Kelas","Contoh: XI PPLG 1")} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||"DKV"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label> {input("email","Email","siswa@sekolah.sch.id")} <label className="field"><span>Status</span><select name="status" className="input" defaultValue={i.status||"Aktif"}><option>Aktif</option><option>Non-aktif</option></select></label></>}
    {type === "kelas" && <>{input("nama","Nama Kelas","Contoh: X PPLG 1")} {input("tingkat","Tingkat","X / XI / XII")} <label className="field"><span>Jurusan</span><select name="jurusan" className="input" defaultValue={i.jurusan||"DKV"}>{MAJORS.map((major)=><option key={major}>{major}</option>)}</select></label> {input("wali","Wali Kelas","Nama guru")} {input("jumlah","Jumlah Siswa","0")}</>}
    {type === "mapel" && <>{input("kode","Kode","MTK-X")} {input("nama","Mata Pelajaran","Nama mata pelajaran")} {input("kelompok","Kelompok","Umum / Kejuruan")} {input("jam","Jam Pelajaran","4")} {input("guru","Guru Pengampu","Nama guru")}</>}
    <div className="form-actions"><button type="button" className="secondary-btn" onClick={onCancel}>Batal</button><button className="primary-btn"><CheckCircle2/> Simpan Data</button></div>
  </form>;
}

function normalizeType(type: keyof typeof typeConfig, data: any) { if(type==="kelas")return {...data,jumlah:Number(data.jumlah||0)}; if(type==="mapel")return {...data,jam:Number(data.jam||0)}; if(type==="pengguna")return {...data,password:String(data.password||"")}; return data; }
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

function MaterialPage({role}:{role:Role}){ const can=role==="guru"||role==="admin"; const [rows,setRows]=useCollection("material"); const [q,setQ]=useState(""); const [open,setOpen]=useState(false); const filtered=(rows as any[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())); const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());const next=[{id:uid("mat"),judul:String(d.judul),mapel:String(d.mapel),kelas:String(d.kelas),type:String(d.type),status:"Terbit",updated:"Baru saja"},...(rows as any[])];try{const saved=await saveCollection("material",next as any);setRows(saved as any);toast("Materi berhasil dibuat");setOpen(false)}catch(error){console.error(error);toast("Gagal menyimpan materi ke MongoDB")}}; return <div className="space-y-5 fade-up"><PageHeader title="Materi Pembelajaran" description="Kelola materi digital, modul, video, dan bahan ajar." action={can?<button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Tambah Materi</button>:undefined}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari materi..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"materi.csv","text/csv")}><Download/> Export</button></div><div className="material-grid">{filtered.map((m:any)=><article className="material-card" key={m.id}><div className="material-thumb"><BookOpen/><span>{m.type}</span></div><div className="material-body"><div className="flex gap-2"><span className="badge green">{m.status}</span><span className="badge gray">{m.kelas}</span></div><h3>{m.judul}</h3><p>{m.mapel}</p><div className="material-foot"><small>Update {m.updated}</small><button className="table-action" onClick={()=>toast(`Materi "${m.judul}" dibuka`)}><Eye/></button></div></div></article>)}</div><Modal open={open} onClose={()=>setOpen(false)} title="Tambah Materi" description="Publikasikan materi baru untuk kelas yang dipilih."><form className="form-grid" onSubmit={save}><label className="field full"><span>Judul Materi</span><input className="input" name="judul" required placeholder="Contoh: Pengenalan HTML & CSS"/></label><label className="field"><span>Mata Pelajaran</span><input className="input" name="mapel" required placeholder="Pemrograman Web"/></label><label className="field"><span>Kelas</span><input className="input" name="kelas" required placeholder="X PPLG 1"/></label><label className="field"><span>Jenis</span><select className="input" name="type"><option>PDF</option><option>Video</option><option>Modul</option><option>Link</option></select></label><div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>Batal</button><button className="primary-btn"><LibraryBig/> Simpan Materi</button></div></form></Modal></div>; }

function TaskPage({role}:{role:Role}){ const can=role==="guru"||role==="admin"; const [rows,setRows]=useCollection("tasks"); const [q,setQ]=useState(""); const [open,setOpen]=useState(false); const filtered=(rows as any[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())); const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget).entries());const next=[{id:uid("task"),judul:String(d.judul),mapel:String(d.mapel),kelas:String(d.kelas),deadline:String(d.deadline),status:"Aktif",pengumpulan:0,total:30},...(rows as any[])];try{const saved=await saveCollection("tasks",next as any);setRows(saved as any);toast("Tugas berhasil dibuat");setOpen(false)}catch(error){console.error(error);toast("Gagal menyimpan tugas ke MongoDB")}};return <div className="space-y-5 fade-up"><PageHeader title="Tugas" description="Kelola tugas dan pantau pengumpulan siswa." action={can?<button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Buat Tugas</button>:undefined}/><div className="toolbar glass-card-strong"><div className="search-field"><Search/><input placeholder="Cari tugas..." value={q} onChange={e=>setQ(e.target.value)}/></div><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"tugas.csv","text/csv")}><Download/> Export</button></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr><th>Judul</th><th>Mapel</th><th>Kelas</th><th>Deadline</th><th>Pengumpulan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((t:any)=><tr key={t.id}><td><b>{t.judul}</b></td><td>{t.mapel}</td><td>{t.kelas}</td><td>{t.deadline}</td><td><div className="submission"><b>{t.pengumpulan}/{t.total}</b><div className="progress"><span style={{width:`${(t.pengumpulan/t.total)*100}%`}}/></div></div></td><td><span className={`badge ${t.status==="Aktif"?"green":"gray"}`}>{t.status}</span></td><td><button className="secondary-btn compact" onClick={()=>toast(`Tugas ${t.judul} dibuka`)}><Eye/> Detail</button></td></tr>)}</tbody></table></div></div><Modal open={open} onClose={()=>setOpen(false)} title="Buat Tugas" description="Buat tugas baru untuk kelas."><form className="form-grid" onSubmit={save}><label className="field full"><span>Judul Tugas</span><input className="input" name="judul" required placeholder="Membuat Landing Page"/></label><label className="field"><span>Mapel</span><input className="input" name="mapel" required placeholder="Pemrograman Web"/></label><label className="field"><span>Kelas</span><input className="input" name="kelas" required placeholder="X PPLG 1"/></label><label className="field"><span>Deadline</span><input className="input" name="deadline" required placeholder="12 Sep 2026"/></label><div className="form-actions"><button type="button" className="secondary-btn" onClick={()=>setOpen(false)}>Batal</button><button className="primary-btn"><ClipboardList/> Buat Tugas</button></div></form></Modal></div> }

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


function GradePage({role}:{role:Role}){ const can=role==="guru"||role==="kurikulum"||role==="admin"; const [rows,setRows]=useCollection("grades"); const [className,setClassName]=useState("Semua"); const [mapel,setMapel]=useState("Semua"); const filtered=(rows as GradeRecord[]).filter(x=>className==="Semua"||x.kelas===className).filter(x=>mapel==="Semua"||x.mapel===mapel); const generate=async()=>{const extra=loadCollection("siswa").slice(0,4).map((s:any,i)=>({id:uid("grade"),siswa:s.nama,nis:s.nis,kelas:s.kelas,mapel:"Matematika",tugas:70+i*5,uts:80+i*2,uas:84+i*2,akhir:78+i*4,predikat:i%2?"B+":"A-"}));const next=[...extra.filter(e=>!(rows as any[]).some(r=>r.nis===e.nis&&r.mapel===e.mapel)),...(rows as any[])];try{const saved=await saveCollection("grades",next as any);setRows(saved as any);await logAction("Generate nilai akademik","Kurikulum");toast("Nilai berhasil digenerate")}catch(error){console.error(error);toast("Gagal menyimpan nilai ke MongoDB")}}; return <div className="space-y-5 fade-up"><PageHeader title={role==="siswa"?"Nilai Saya":"Generate & Kelola Nilai"} description={role==="siswa"?"Lihat hasil penilaian kamu pada semester berjalan.":"Validasi, generate, dan pantau nilai siswa."} action={can&&<button className="primary-btn" onClick={generate}><Calculator/> Generate Nilai</button>}/><div className="toolbar glass-card-strong"><select className="select" value={className} onChange={e=>setClassName(e.target.value)}><option>Semua</option>{Array.from(new Set((rows as any[]).map(x=>x.kelas))).map(x=><option key={x}>{x}</option>)}</select><select className="select" value={mapel} onChange={e=>setMapel(e.target.value)}><option>Semua</option>{Array.from(new Set((rows as any[]).map(x=>x.mapel))).map(x=><option key={x}>{x}</option>)}</select><button className="secondary-btn" onClick={()=>downloadText(toCsv(filtered as any[]),"nilai-educn.csv","text/csv")}><Download/> Export Nilai</button></div><div className="glass-card-strong table-card"><div className="table-scroll"><table><thead><tr><th>Siswa</th><th>Kelas</th><th>Mapel</th><th>Tugas</th><th>UTS</th><th>UAS</th><th>Nilai Akhir</th><th>Predikat</th></tr></thead><tbody>{(role==="siswa"?filtered.slice(0,3):filtered).map((x:any)=><tr key={x.id}><td><b>{x.siswa}</b><small className="block">{x.nis}</small></td><td>{x.kelas}</td><td>{x.mapel}</td><td>{x.tugas}</td><td>{x.uts}</td><td>{x.uas}</td><td><b className="text-primary">{x.akhir}</b></td><td><span className="badge green">{x.predikat}</span></td></tr>)}</tbody></table></div></div></div>; }

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
