/* eslint-disable react-hooks/set-state-in-effect */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // State untuk melihat/menyembunyikan kata sandi
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Mohon masukkan alamat email dan kata sandi Anda.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/");
    } catch (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-0 m-0 overflow-hidden font-sans antialiased">
      {/* SISI KIRI: BRANDING & VISUAL MARITIM PREMIUM */}
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
            Selamat Datang Kembali di Seapedia.
          </h1>
          <p className="text-[#EBF4F1] text-[15px] leading-relaxed font-medium">
            Masuk dan lanjutkan penjelajahan Anda di dalam ekosistem perdagangan
            maritim modern serta platform multi-dashboard terlengkap.
          </p>
        </div>

        <div className="text-[10px] text-white/50 font-mono tracking-widest uppercase font-bold">
          &copy; {new Date().getFullYear()} SEAPEDIA
        </div>
      </div>

      {/* SISI KANAN: FORM MASUK AKUN */}
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#0D241F] tracking-tight">
              Masuk Akun
            </h2>
            <p className="text-slate-400 text-xs font-semibold tracking-wide mt-1.5 uppercase">
              Silakan akses akun Seapedia Anda kembali.
            </p>
          </div>

          {/* Pesan Kesalahan */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-3.5 pl-11 pr-5 text-xs font-bold text-[#23263B] focus:bg-white focus:border-emerald-600 transition"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1 mr-1">
                <label className="text-[10px] font-black text-[#0D241F] uppercase tracking-wider">
                  Kata Sandi
                </label>
                <span className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 transition-colors cursor-pointer">
                  Lupa Password?
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-3.5 pl-5 pr-12 text-sm font-bold text-[#23263B] focus:bg-white focus:border-emerald-600 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700 transition cursor-pointer border-none bg-transparent flex items-center"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D241F] hover:bg-emerald-950 text-white font-black py-3.5 rounded-xl transition mt-6 flex items-center justify-center border-none disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-xs shadow-xs"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Akun"}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <div className="w-full h-px bg-slate-100"></div>
            <span className="absolute bg-white px-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Atau Masuk Dengan
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-slate-200 hover:border-[#0D241F] font-black py-3 rounded-xl flex items-center justify-center gap-2.5 transition text-[11px] uppercase tracking-wider text-slate-700 cursor-pointer shadow-3xs"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-4 h-4"
            />
            <span>Akun Google</span>
          </button>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-bold">
              Belum memiliki akun?{" "}
              <a
                href="/register"
                className="text-emerald-700 font-black hover:text-emerald-950 underline cursor-pointer transition-colors"
              >
                Daftar Sekarang
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
