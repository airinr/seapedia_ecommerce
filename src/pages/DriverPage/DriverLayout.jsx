import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";

export default function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading: roleLoading } = useRole();

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  };

  const driverMenus = [
    {
      name: "Daftar Pengiriman",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      path: "/driver/dashboard",
    },
    {
      name: "Pendapatan",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      path: "/driver/revenue",
    },
  ];

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#23263B] font-poppins antialiased">
      {/* SIDEBAR PANEL */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0 h-screen sticky top-0">
        <div className="space-y-7">
          <div>
            <h2 className="text-sm font-black text-[#0D241F] tracking-wider uppercase">
              Panel Kurir
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Sistem Logistik Seapedia
            </p>
          </div>

          <nav className="space-y-1">
            {driverMenus.map((menu, i) => {
              const isSelected = location.pathname === menu.path;
              return (
                <button
                  key={i}
                  onClick={() => navigate(menu.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition text-left cursor-pointer border-none block ${
                    isSelected
                      ? "bg-[#0D241F] text-white shadow-md font-black" // Pastikan bg gelap dan teks putih saat aktif
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#0D241F]"
                  }`}
                >
                  <span
                    className={
                      isSelected ? "text-emerald-400" : "text-slate-400"
                    }
                  >
                    {menu.icon}
                  </span>
                  {/* ⚠️ Solusi teks hilang: Bungkus teks dengan span agar pewarnaan text-white mengunci sempurna */}
                  <span className={isSelected ? "text-white" : ""}>
                    {menu.name}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 hover:text-[#0D241F] transition text-left cursor-pointer border-none bg-transparent"
            >
              <span className="text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>{" "}
              Kembali ke Beranda
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 rounded-xl hover:bg-red-50 transition text-left cursor-pointer border-none bg-transparent group"
          >
            <span className="group-hover:translate-x-1 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </span>{" "}
            Keluar
          </button>
        </div>
      </aside>

      {/* DRIVER MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        <Outlet />

        <footer className="border-t border-slate-200 mt-12 pt-6 text-[10px] text-slate-400 font-mono text-center">
          &copy; {new Date().getFullYear()} SEAPEDIA Logistics Driver Inc. All
          rights reserved.
        </footer>
      </main>
    </div>
  );
}
