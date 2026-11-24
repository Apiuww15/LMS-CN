"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Role } from "@/lib/portal";

export default function PortalShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [mobileOpen]);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          if (active) router.replace("/login");
          return;
        }

        const data = (await response.json()) as {
          authenticated?: boolean;
          user?: { role?: string };
        };

        if (!data.authenticated || !data.user?.role) {
          if (active) router.replace("/login");
          return;
        }

        const sessionRole = String(data.user.role).trim().toLowerCase();
        if (sessionRole !== role.toLowerCase()) {
          if (active) router.replace(`/${sessionRole}`);
          return;
        }

        if (active) setReady(true);
      } catch {
        if (active) router.replace("/login");
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [role, router]);

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-orb"><Image src="/images/logo-sekolah.png" alt="Logo SMK Citra Negara" width={38} height={38} priority /></div>
        <p>Memuat EduCN</p>
      </div>
    );
  }

  return (
    <div className="portal-shell">
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="portal-main">
        <Topbar role={role} onMenu={() => setMobileOpen(true)} />
        <main className="portal-content">{children}</main>
      </div>
    </div>
  );
}
