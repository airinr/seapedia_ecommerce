import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";

export default function RoleSelection() {
  const { user, ownedRoles, activeRole, setActiveRole, loading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Jika tidak ada user login, kembalikan ke halaman login
      if (!user) {
        navigate("/login");
        return;
      }

      // Jika user hanya punya 1 role, activeRole otomatis terisi di Context, langsung arahkan ke dashboard
      if (ownedRoles.length === 1 && activeRole) {
        navigate("/");
      }
    }
  }, [user, ownedRoles, activeRole, loading, navigate]);

  const handleSelectRole = (role) => {
    setActiveRole(role);
    navigate("/"); // Lempar ke shell dashboard utama
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-[24px] p-8 shadow-sm text-center">
        <h2 className="text-2xl font-black text-[#0D241F] tracking-tight">
          Pilih Role Aktif
        </h2>
        <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
          Akun Anda memiliki beberapa role yang terdaftar. Silakan pilih role yang ingin Anda gunakan untuk sesi ini.
        </p>

        <div className="mt-8 space-y-3">
          {ownedRoles.map((role) => (
            <button
              key={role}
              onClick={() => handleSelectRole(role)}
              className="w-full py-3.5 px-5 bg-slate-50 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-300 rounded-xl font-bold text-sm text-[#23263B] hover:text-emerald-900 transition flex items-center justify-between group cursor-pointer"
            >
              <span className="uppercase tracking-wide">
                {role === "Buyer"
                  ? "Masuk sebagai Pembeli"
                  : role === "Seller"
                    ? "Masuk sebagai Penjual"
                    : role === "Driver"
                      ? "Masuk sebagai Kurir"
                      : `Masuk sebagai ${role}`}
              </span>
              <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-200 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
