import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";

export default function BuyerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRole } = useRole();

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  const buyerMenus = [
    {
      name: "Dasbor Utama",
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
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      path: "/",
    },
    {
      name: "Dompet Saya",
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
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      ),
      path: "/wallet",
    },
    {
      name: "Pesanan Saya",
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
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
      path: "/orders",
    },
    {
      name: "Keranjang",
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
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
      path: "/cart",
    },
    {
      name: "Ulasan Saya",
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
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      path: "/reviews",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#23263B] font-sans antialiased">
      {/* SISI KIRI: SIDEBAR PANEL */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0 sticky top-0 h-screen">
        <div className="space-y-7">
          <div>
            <h2 className="text-sm font-black text-[#0D241F] tracking-wider uppercase">
              Panel {activeRole === "Buyer" ? "Pembeli" : activeRole}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Manajemen Akun
            </p>
          </div>

          <nav className="space-y-1">
            {buyerMenus.map((menu, i) => {
              const isActive =
                menu.path !== "#" && location.pathname === menu.path;
              return (
                <button
                  key={i}
                  onClick={() => menu.path !== "#" && navigate(menu.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition text-left cursor-pointer border-none ${
                    isActive
                      ? "!bg-[#0D241F] !text-white shadow-sm font-black"
                      : "text-slate-500 hover:bg-[#EBF4F1] hover:text-[#0D241F] bg-transparent"
                  }`}
                >
                  <span
                    className={
                      isActive
                        ? "!text-emerald-400"
                        : "text-slate-400 group-hover:text-[#0D241F]"
                    }
                  >
                    {menu.icon}
                  </span>{" "}
                  {menu.name}
                </button>
              );
            })}

            <button
              onClick={() => navigate("/settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition text-left cursor-pointer border-none ${
                location.pathname === "/settings"
                  ? "!bg-[#0D241F] !text-white shadow-sm font-black"
                  : "text-slate-500 hover:bg-[#EBF4F1] hover:text-[#0D241F] bg-transparent"
              }`}
            >
              <span
                className={
                  location.pathname === "/settings"
                    ? "!text-emerald-400"
                    : "text-slate-400"
                }
              >
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
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>{" "}
              Pengaturan
            </button>
          </nav>
        </div>

        <div className="space-y-1 pt-6 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 hover:text-[#0D241F] rounded-xl transition group">
            <span className="group-hover:text-emerald-600 text-slate-400">
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
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" x2="12.01" y1="17" y2="17" />
              </svg>
            </span>{" "}
            Pusat Bantuan
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-red-50 text-red-500 rounded-xl transition group"
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
            Keluar Akun
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto h-screen">
        <Outlet />
      </div>
    </div>
  );
}
