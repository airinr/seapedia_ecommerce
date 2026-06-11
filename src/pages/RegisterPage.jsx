import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole"; // ✅ Ditambahkan agar useRole bisa diakses

export default function Register() {
  const navigate = useNavigate();

  // State untuk form input
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

    // 1. Validasi Input Sederhana (Level 7: Input Validation)
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg("Semua field wajib diisi!");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Password tidak cocok!");
      return;
    }

    try {
      setLoading(true);

      // 2. Daftarkan User ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName, // Ditangkap oleh trigger database untuk tabel profiles
          },
        },
      });

      if (authError) throw authError;

      if (authData?.user) {
        setSuccessMsg(
          "Registrasi sukses! Menyiapkan pengalaman belanja Anda...",
        );

        // 💡 Langsung paksa role aktif menjadi Buyer di sisi client
        setActiveRole("Buyer");

        // 🚀 Redirect langsung ke Landing Page (akar rute "/")
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Fungsi Registrasi / Login via Google OAuth
  const handleGoogleRegister = async () => {
    try {
      setErrorMsg("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // 🚀 Begitu sukses login Google, langsung kembalikan ke Landing Page ("/")
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
      {/* SISI KIRI: BRANDING & VISUAL */}
      <div
        className="hidden lg:flex w-1/2 h-screen p-16 flex-col justify-between text-white relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(13, 36, 31, 0.6), rgba(13, 36, 31, 0.9)), url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800')`,
        }}
      >
        <div>
          <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <span className="bg-white text-[#0D241F] w-8 h-8 rounded-lg flex items-center justify-center text-lg">
              🛒
            </span>
            SEAPEDIA
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-5xl font-black leading-tight tracking-tight mb-6">
            Empowering your sustainable journey.
          </h1>
          <p className="text-emerald-100/80 text-base leading-relaxed">
            Join a marketplace built on trust, efficiency, and stable role-based
            ecosystems tailored for developers and smart shoppers.
          </p>
        </div>

        <div className="text-xs text-emerald-100/40 font-mono">
          &copy; {new Date().getFullYear()} SEAPEDIA INC. • COMPFEST 18 Academy
        </div>
      </div>

      {/* SISI KANAN: FORM REGISTRASI */}
      <div className="w-full lg:w-1/2 h-screen flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h2 className="text-3xl font-black text-[#0D241F] tracking-tight">
              Create Account
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Start your premium shopping experience today.
            </p>
          </div>

          {/* Alert Error / Success */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-3 rounded-xl mb-4">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold p-3 rounded-xl mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Input Nama Lengkap */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  👤
                </span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ✉️
                </span>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 pl-11 pr-4 text-sm focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Grid Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 outline-none transition duration-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Confirm
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl py-3 px-4 text-sm focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/5 outline-none transition duration-200"
                />
              </div>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D241F] hover:bg-emerald-900 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl mt-4 flex items-center justify-center gap-2 transition duration-200 shadow-md cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account ➔"}
            </button>
          </form>

          {/* Pemisah Berbentuk Garis */}
          <div className="relative flex items-center justify-center my-5">
            <div className="w-full h-px bg-slate-100"></div>
            <span className="absolute bg-white px-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Or Register With
            </span>
          </div>

          {/* Tombol Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            className="w-full border border-slate-200/80 hover:bg-slate-50 font-bold py-3 rounded-xl flex items-center justify-center gap-2.5 transition duration-200 text-xs text-slate-600 cursor-pointer shadow-sm"
          >
            <img
              src="https://www.google.com/favicon.ico"
              className="w-4 h-4"
              alt="Google"
            />
            Sign up with Google
          </button>

          {/* Opsi Login Kembali */}
          <p className="text-center text-xs font-semibold text-slate-400 mt-8">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-emerald-600 font-bold hover:underline"
            >
              Log in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
