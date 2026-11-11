"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json() as {
        ok?: boolean;
        error?: string;
        user?: { id: string; email: string; nama: string; role: string };
      };

      if (!response.ok || !data.user) throw new Error(data.error || "Login gagal.");

      router.replace(`/${data.user.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-visual">
          <div className="login-school-image" aria-hidden="true" />
          <div className="login-visual-overlay" />
          <div className="login-visual-content">
            <header className="login-brand">
              <div className="login-school-logo">
                <img src="/images/logo-sekolah.png" alt="Logo sekolah" />
              </div>
              <div className="login-brand-text">
                <strong>EduCN</strong>
                <span>Portal Pembelajaran</span>
              </div>
            </header>

            <div className="login-hero">
              <span className="login-kicker">SMK Citra Negara</span>
              <h1>Selamat Datang di Portal Pembelajaran SMK Citra Negara.</h1>
              <p>Akses pembelajaran, informasi akademik, penilaian, materi, tugas, dan layanan sekolah melalui satu portal yang terintegrasi.</p>
            </div>

            <div className="login-feature-row">
              <div className="login-feature"><ShieldCheck size={18}/><div><strong>Akses Terproteksi</strong><span>Hak akses mengikuti role akun di MongoDB.</span></div></div>
              <div className="login-feature"><LockKeyhole size={18}/><div><strong>Satu Akun Sekolah</strong><span>Masuk dengan email dan kata sandi yang diberikan Admin.</span></div></div>
            </div>

            <div className="login-visual-footer">SMK Citra Negara · Sistem Informasi Pembelajaran Terintegrasi</div>
          </div>
        </section>

        <section className="login-form-wrap">
          <div className="login-form-card">
            <div className="login-mobile-brand">
              <div className="login-school-logo"><img src="/images/logo-sekolah.png" alt="Logo sekolah" /></div>
              <div><strong>EduCN</strong><span>SMK Citra Negara</span></div>
            </div>

            <div className="login-heading">
              <p className="eyebrow">PORTAL PEMBELAJARAN</p>
              <h2>Masuk ke EduCN</h2>
              <p>Gunakan email dan kata sandi yang dibuat oleh administrator sekolah.</p>
            </div>

            <form onSubmit={submit}>
              <label className="field">
                <span>Email</span>
                <div className="login-input-wrap">
                  <Mail size={18}/><input type="email" autoComplete="email" placeholder="nama@sekolah.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                </div>
              </label>

              <label className="field">
                <span>Kata Sandi</span>
                <div className="login-input-wrap">
                  <LockKeyhole size={18}/><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Masukkan kata sandi" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                  <button type="button" className="login-password-toggle" onClick={() => setShowPassword((v) => !v)} disabled={loading} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                </div>
              </label>

              {error && <div className="login-error" role="alert">{error}</div>}

              <button type="submit" className="login-submit" disabled={loading}>
                <span>{loading ? "Memeriksa akun..." : "Masuk ke Portal"}</span><ArrowRight size={18}/>
              </button>
            </form>

            <div className="login-info">
              <div className="login-info-icon"><ShieldCheck size={18}/></div>
              <div><strong>Role ditentukan otomatis</strong><span>Setelah login, sistem mengarahkan kamu ke workspace sesuai role yang tersimpan di MongoDB.</span></div>
            </div>

            <div className="login-help"><span>Belum memiliki akun?</span><strong>Hubungi administrator sekolah</strong></div>
          </div>
        </section>
      </div>
    </main>
  );
}
