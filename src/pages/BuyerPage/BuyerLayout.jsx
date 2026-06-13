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
    { name: "Dashboard Utama", icon: "📊", path: "/" },
    { name: "My Wallet", icon: "💳", path: "/wallet" },
    { name: "My Orders", icon: "📝", path: "/orders" },
    { name: "Shopping Cart", icon: "🛒", path: "/cart" },
    { name: "Wishlist", icon: "❤️", path: "#" },
    { name: "My Reviews", icon: "⭐", path: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#23263B] font-sans antialiased">
      {/* SISI KIRI: SIDEBAR PANEL */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0 sticky top-0 h-screen">
        <div className="space-y-7">
          <div>
            <h2 className="text-sm font-black text-[#0D241F] tracking-wider uppercase">
              {activeRole || "Buyer"} Panel
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Account Management
            </p>
          </div>

          <nav className="space-y-1">
            {buyerMenus.map((menu, i) => {
              const isActive = location.pathname === menu.path;
              return (
                <button
                  key={i}
                  onClick={() => menu.path !== "#" && navigate(menu.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition text-left cursor-pointer border-none bg-transparent ${
                    isActive 
                      ? "bg-[#0D241F] text-white shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span>{menu.icon}</span> {menu.name}
                </button>
              );
            })}

            <button 
              onClick={() => navigate("/settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition text-left cursor-pointer border-none bg-transparent ${
                location.pathname === "/settings" 
                  ? "bg-[#0D241F] text-white shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span>⚙️</span> Settings
            </button>
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 cursor-pointer hover:text-[#0D241F]">
            <span>❓</span> Help Center
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition"
          >
            <span>➔</span> Logout
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
