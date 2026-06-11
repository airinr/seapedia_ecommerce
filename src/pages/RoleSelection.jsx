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
        navigate("/dashboard");
      }
    }
  }, [user, ownedRoles, activeRole, loading, navigate]);

  const handleSelectRole = (role) => {
    setActiveRole(role);
    navigate("/dashboard"); // Lempar ke shell dashboard utama
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
        <span className="text-2xl">🔐</span>
        <h2 className="text-2xl font-black text-[#0D241F] tracking-tight mt-3">
          Pilih Role Sesi Ini
        </h2>
        <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
          Akun kamu terdeteksi memiliki beberapa role sekaligus. Pilih role
          aktif untuk memulai sesi ini.
        </p>

        <div className="mt-6 space-y-3">
          {ownedRoles.map((role) => (
            <button
              key={role}
              onClick={() => handleSelectRole(role)}
              className="w-full py-3.5 px-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200/60 hover:border-emerald-300 rounded-xl font-bold text-sm text-[#23263B] hover:text-emerald-900 transition flex items-center justify-between group cursor-pointer"
            >
              <span>
                {role === "Buyer"
                  ? "🛍️ Bertindak sebagai Buyer"
                  : role === "Seller"
                    ? "🏪 Bertindak sebagai Seller"
                    : role === "Driver"
                      ? "🚴 Bertindak sebagai Driver"
                      : "🛡️ Bertindak sebagai Admin"}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition duration-200">
                ➔
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
