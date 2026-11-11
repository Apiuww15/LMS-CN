"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

        if (data.user.role !== role) {
          if (active) router.replace(`/${data.user.role}`);
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
        <div className="loading-orb">E</div>
        <p>Memuat EduCN...</p>
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
