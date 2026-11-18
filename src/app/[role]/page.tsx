"use client";
import { useParams } from "next/navigation";
import PortalShell from "@/components/portal/PortalShell";
import Workspace from "@/components/portal/Workspace";
import { Role } from "@/lib/portal";

const roles: Role[] = ["admin", "guru", "siswa", "kurikulum", "kepsek"];
export default function RoleHome(){ const { role } = useParams<{ role:string }>(); const r=(roles.includes(role as Role)?role:"admin") as Role; return <PortalShell role={r}><Workspace role={r} segment=""/></PortalShell>; }
