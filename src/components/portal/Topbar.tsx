"use client";
import Link from "next/link";
import { Bell, Search, X, Menu, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { roleMeta, roleNav, Role, routeLabel } from "@/lib/portal";
import { authKey } from "@/lib/store";

function NoticePopover({ role, onClose }: { role: Role; onClose: () => void }) {
  const [items, setItems] = useState<{ title: string; time: string }[]>([]);
  useEffect(() => {
    let active = true;
    const read = async () => {
      try {
        const endpoints = role === "admin" || role === "guru" || role === "siswa" || role === "kurikulum" || role === "kepsek"
          ? ["/api/data/announcements"]
          : [];
        const results = await Promise.all(endpoints.map(async (endpoint) => {
          const response = await fetch(endpoint, { cache: "no-store" });
          return response.ok ? await response.json() as { data?: any[] } : { data: [] };
        }));
        const merged = results.flatMap((result) => Array.isArray(result.data) ? result.data.slice(0, 4) : []);
        if (active) setItems(merged.map((item: any) => ({ title: String(item.judul || "Pengumuman"), time: String(item.tanggal || "Terbaru") })));
      } catch (error) { console.error("Gagal memuat notifikasi", error); }
    };
    void read();
    const timer = window.setInterval(read, 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [role]);

  return <div className="popover notice-popover"><div className="notice-head"><strong>Notifikasi Terbaru</strong><button className="icon-btn" onClick={onClose}><X/></button></div>{items.length === 0 ? <div className="notice-item"><span className="notice-dot info"/><div><b>Belum ada notifikasi</b><small>Akan muncul dari data yang tersimpan.</small></div></div> : items.map((item, index) => <div className="notice-item" key={`${item.title}-${index}`}><span className="notice-dot success"/><div><b>{item.title}</b><small>{item.time}</small></div></div>)}</div>;
}

export default function Topbar({ role, onMenu }: { role: Role; onMenu: () => void }) {
  const pathname = usePathname(); const router = useRouter();
  const [search, setSearch] = useState(false); const [q, setQ] = useState(""); const [notice, setNotice] = useState(false); const [roleOpen, setRoleOpen] = useState(false);
  const segment = pathname.split("/")[2] || "";
  const title = routeLabel(role, segment);
  const links = useMemo(() => roleNav[role].filter((n) => n.href), [role]);

  return <>
    <header className="portal-topbar">
      <div className="topbar-left">
        <button className="icon-btn lg:hidden" onClick={onMenu} aria-label="Menu"><Menu /></button>
        <div><div className="eyebrow">{roleMeta[role].label}</div><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" onClick={() => setSearch(true)} aria-label="Cari"><Search /></button>
        <button className="icon-btn has-badge" onClick={() => setNotice((v) => !v)} aria-label="Notifikasi"><Bell /><i /></button>
        <div className="role-switch-wrap">
          <button className="profile-chip" onClick={() => setRoleOpen((v) => !v)}><span className="avatar avatar-sm">{roleMeta[role].short.slice(0, 1)}</span><span className="hidden sm:block">{roleMeta[role].short}</span><ChevronDown /></button>
          {roleOpen && <div className="popover role-popover"><Link href={`/${role}/profil`} onClick={() => setRoleOpen(false)}>Profil Saya</Link><Link href={`/${role}/bantuan`} onClick={() => setRoleOpen(false)}>Pusat Bantuan</Link><button onClick={async () => { setRoleOpen(false); try { await fetch("/api/auth/logout", { method: "POST" }); } finally { localStorage.removeItem(authKey); router.push("/login"); } }}>Keluar</button></div>}
        </div>
      </div>
    </header>
    {search && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSearch(false)}><div className="search-panel"><div className="search-box"><Search/><input autoFocus placeholder="Cari menu..." value={q} onChange={(e) => setQ(e.target.value)} /><button className="icon-btn" onClick={() => setSearch(false)}><X/></button></div><div className="search-results">{links.filter((x) => x.label.toLowerCase().includes(q.toLowerCase())).map((item) => { const path = `${role}/${item.href}`; return <Link key={item.href} href={`/${path}`} onClick={() => setSearch(false)}><item.icon/><span>{item.label}</span></Link>; })}</div></div></div>}
    {notice && <NoticePopover role={role} onClose={() => setNotice(false)} />}
  </>;
}
