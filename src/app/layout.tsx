import type { Metadata } from "next";
import "./globals.css";
import ToastHost from "@/components/portal/ToastHost";

export const metadata: Metadata = { title: "EduCN · Learning Management System", description: "EduCN LMS dengan workspace Admin, Guru, Siswa, Kurikulum, dan Kepala Sekolah." };
export default function RootLayout({children}:{children:React.ReactNode}){ return <html lang="id"><body>{children}<ToastHost/></body></html>; }
