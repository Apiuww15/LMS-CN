"use client";
import { useParams } from "next/navigation";
import PortalShell from "@/components/portal/PortalShell";
import Workspace from "@/components/portal/Workspace";
import { Role } from "@/lib/portal";
const roles: Role[] = ["admin", "guru", "siswa", "kurikulum", "kepsek"];
export default function RolePage(){ const params=useParams<{role:string;segments:string[]}>(); const r=(roles.includes(params.role as Role)?params.role:"admin") as Role; const segment=Array.isArray(params.segments)?params.segments[0]:""; return <PortalShell role={r}><Workspace role={r} segment={segment}/></PortalShell>; }
