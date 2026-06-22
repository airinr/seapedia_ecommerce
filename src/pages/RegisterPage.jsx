/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";

export default function Register() {
  const navigate = useNavigate();

  // State untuk form input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State untuk melihat/menyembunyikan kata sandi
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State untuk feedback user
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Ambil fungsi pengubah role aktif dari context utama
  const { setActiveRole } = useRole();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg("Semua kolom wajib diisi ya, Kak!");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Kata sandi tidak cocok, silakan periksa kembali.");
      return;
    }

    try {
      setLoading(true);

      // 1. Daftarkan akun baru ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData?.user) {
        setSuccessMsg(
          "Pendaftaran sukses! Mengotentikasi akun Anda secara otomatis...",
        );

        // 2. Pasang peran dasar 'Buyer' secara instan di sisi klien
        if (setActiveRole) {
          setActiveRole("Buyer");
        }

        // 3. 🚀 OTOMATIS LOGIN: Jika Supabase mengembalikan sesi baru (karena konfirmasi email mati),
        // paksa setSession lokal agar Auth Listener di App.jsx langsung mendeteksi user aktif.
        if (authData.session) {
          await supabase.auth.setSession(authData.session);
        }

        // 4. Alihkan langsung ke halaman utama beranda
        setTimeout(() => {
          navigate("/");
          // Reload opsional untuk memastikan seluruh navbar dan context memuat ulang data profil baru dari Supabase
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setErrorMsg("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setErrorMsg(error.message || "Gagal mendaftar menggunakan Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-0 m-0 overflow-hidden">
      {/* SISI KIRI: BRANDING & VISUAL ELEGAN */}
      <div
        className="hidden lg:flex w-1/2 h-screen p-16 flex-col justify-between text-white relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(13, 36, 31, 0.4), rgba(13, 36, 31, 0.85)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80')`,
        }}
      >
        <div>
          <div className="flex items-center gap-2.5 text-2xl font-black tracking-wider text-white">
            <div className="bg-white text-[#0D241F] w-8 h-8 rounded-lg flex items-center justify-center shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            SEAPEDIA
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white drop-shadow-xs">
            Satu Sentuhan untuk Semua Kebutuhan Kelautan.
          </h1>
          <p className="text-[#EBF4F1] text-[15px] leading-relaxed font-medium">
            Jelajahi ekosistem e-commerce maritim modern terlengkap di
            Indonesia. Nikmati jaminan transaksi instan, aman, dan harga terbaik
            langsung dari tangan pertama.
          </p>
        </div>

        <div className="text-[10px] text-white/50 font-mono tracking-widest uppercase font-bold">
          &copy; {new Date().getFullYear()} SEAPEDIA
        </div>
      </div>

      {/* SISI KANAN: FORM REGISTRASI */}
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#0D241F] tracking-tight">
              Mulai Langkahmu!
            </h2>
            <p className="text-slate-400 text-xs font-semibold tracking-wide mt-1.5 uppercase">
              Daftar sekarang dan nikmati pengalaman belanja premium.
            </p>
          </div>

          {/* Alert Error / Success */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl mb-4 flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl mb-4 flex items-center gap-2">
              <span>✓</span> {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Input Nama Lengkap */}
            <div>
              <label className="block text-[10px] font-black text-[#0D241F] uppercase tracking-wider mb-1.5 ml-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-[#23263B] focus:bg-white focus:border-emerald-600 outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-[10px] font-black text-[#0D241F] uppercase tracking-wider mb-1.5 ml-1">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-[#23263B] focus:bg-white focus:border-emerald-600 outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Grid Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-[#0D241F] uppercase tracking-wider mb-1.5 ml-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-[#23263B] focus:bg-white focus:border-emerald-600 outline-none transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition cursor-pointer border-none bg-transparent flex items-center"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#0D241F] uppercase tracking-wider mb-1.5 ml-1">
                  Konfirmasi
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-3 pl-4 pr-10 text-xs font-bold text-[#23263B] focus:bg-white focus:border-emerald-600 outline-none transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition cursor-pointer border-none bg-transparent flex items-center"
                  >
                    {showConfirmPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D241F] hover:bg-emerald-950 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 rounded-xl mt-6 flex items-center justify-center gap-2 transition duration-200 text-xs uppercase tracking-widest cursor-pointer border-none shadow-sm"
            >
              {loading ? "Memproses Akun..." : "Gabung Sekarang ➔"}
            </button>
          </form>

          {/* Pemisah Berbentuk Garis */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full h-px bg-slate-100"></div>
            <span className="absolute bg-white px-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Atau Daftar Instan Dengan
            </span>
          </div>

          {/* Tombol Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full bg-white border border-slate-200 hover:border-[#0D241F] font-black py-3 rounded-xl flex items-center justify-center gap-2.5 transition duration-200 text-[11px] uppercase tracking-wider text-slate-700 cursor-pointer shadow-3xs"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="w-3.5 h-3.5"
              alt="Google"
            />
            Masuk Cepat dengan Google
          </button>

          {/* Opsi Login Kembali */}
          <p className="text-center text-xs font-bold text-slate-400 mt-8">
            Sudah punya akun di Seapedia?{" "}
            <a
              href="/login"
              className="text-emerald-700 font-black hover:text-emerald-950 underline transition-colors"
            >
              Masuk di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
