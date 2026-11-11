"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Settings2 } from "lucide-react";
import { roleMeta, roleNav, Role } from "@/lib/portal";
import { authKey } from "@/lib/store";

export default function Sidebar({ role, mobileOpen, onClose }: { role: Role; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname(); const router = useRouter();
  const base = `/${role}`;
  const logout = async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } finally { localStorage.removeItem(authKey); localStorage.removeItem("educn-admin-auth"); router.push("/login"); } };
  return (
    <>
      {mobileOpen && <button className="drawer-backdrop lg:hidden" aria-label="Tutup menu" onClick={onClose} />}
      <aside className={`portal-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">E</div>
          <div><p className="brand-name">EduCN</p><p className="brand-sub">{roleMeta[role].label}</p></div>
          <button className="icon-btn ml-auto lg:hidden" onClick={onClose} aria-label="Tutup"><Menu /></button>
        </div>
        <div className="role-pill"><span className="role-dot" /> {roleMeta[role].label}</div>
        <nav className="sidebar-nav">
          {roleNav[role].map(({ href, label, icon: Icon }) => {
            const link = href ? `${base}/${href}` : base;
            const active = href ? pathname.startsWith(link) : pathname === base;
            return <Link key={link} href={link} onClick={onClose} className={`sidebar-link ${active ? "active" : ""}`}><Icon /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-footer">
          <Link href={`${base}/pengaturan`} className="sidebar-link"><Settings2 /><span>Pengaturan</span></Link>
          <button className="sidebar-logout" onClick={logout}><LogOut /><span>Keluar dari Akun</span></button>
        </div>
      </aside>
    </>
  );
}
