import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Mohon masukkan email dan password Anda.");
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

      // Jika sukses, role handling di RoleSelection atau Auth Listener akan take over,
      // tetapi untuk keamanan kita arahkan langsung ke root
      navigate("/");
    } catch (error) {
      setErrorMsg(error.message);
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center font-sans antialiased p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-50/60 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white border border-slate-100 shadow-2xl rounded-[32px] p-8 md:p-12 w-full max-w-md relative z-10">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4 border border-emerald-100 text-3xl shadow-sm">
            🛒
          </div>
          <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">Selamat Datang</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">Masuk ke akun SEAPEDIA Anda.</p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
              Alamat Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-medium outline-none focus:bg-white focus:border-emerald-600 transition"
              placeholder="nama@email.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1 mr-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Password
              </label>
              <span className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">Lupa Password?</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-medium outline-none focus:bg-white focus:border-emerald-600 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D241F] hover:bg-emerald-950 text-white font-black py-4 rounded-2xl transition shadow-lg mt-2 cursor-pointer border-none disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Akun"}
          </button>
        </form>

        <div className="flex items-center my-6 opacity-60">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atau masuk dengan</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-[#0D241F] font-bold py-3.5 rounded-2xl transition cursor-pointer disabled:opacity-70"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm">Akun Google</span>
        </button>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Belum memiliki akun?{" "}
            <a href="/register" className="text-emerald-600 font-black hover:underline cursor-pointer">
              Daftar Sekarang
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
