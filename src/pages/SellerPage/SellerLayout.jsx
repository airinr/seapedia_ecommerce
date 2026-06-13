import { useState, useCallback, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";

export default function SellerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: roleLoading } = useRole();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchSellerData = useCallback(async () => {
    if (roleLoading) return;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (storeError) throw storeError;

      if (storeData) {
        setStore(storeData);

        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });

        if (prodError) throw prodError;
        setProducts(prodData || []);

        // =========================================================================
        // Wajib ubah di file Induk/Layout Pembungkus Dashboard (fetchSellerData)
        // =========================================================================
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            `
    *,
    order_items (
      *,
      products (
        product_name,
        image_url
      )
    )
  `,
          )
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });

        if (orderError) throw orderError;
        setOrders(orderData || []);

        const totalRevenue = (orderData || [])
          .filter((ord) => ord.current_status === "Pesanan Selesai")
          .reduce((sum, ord) => sum + Number(ord.final_total), 0);
        setRevenue(totalRevenue);
      }
    } catch (err) {
      console.error("Gagal memuat data dasbor seller:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user, roleLoading]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSellerData();
  }, [fetchSellerData]);

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

  const sellerMenus = [
    { name: "Dashboard", icon: "📊", path: "/seller/dashboard" },
    { name: "Katalog Produk", icon: "📦", path: "/seller/catalog" },
    { name: "Pesanan Masuk", icon: "📥", path: "/seller/orders" },
  ];

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#23263B] font-sans antialiased">
      {/* SIDEBAR PANEL */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0 h-screen sticky top-0">
        <div className="space-y-7">
          <div>
            <h2 className="text-sm font-black text-[#0D241F] tracking-wider uppercase">
              🏪 Seller Panel
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Store & Product System
            </p>
          </div>

          <nav className="space-y-1">
            {sellerMenus.map((menu, i) => {
              const isSelected = location.pathname === menu.path;
              return (
                <button
                  key={i}
                  onClick={() => navigate(menu.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition text-left cursor-pointer border-none bg-transparent ${
                    isSelected
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
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer border-none bg-transparent"
            >
              <span>⚙️</span> Back to Settings
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 rounded-xl hover:bg-red-50 transition text-left cursor-pointer border-none bg-transparent"
          >
            <span>➔</span> Logout
          </button>
        </div>
      </aside>

      {/* DASHBOARD MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        <Outlet
          context={{ store, products, orders, revenue, fetchSellerData, user }}
        />

        <footer className="border-t border-slate-200 mt-12 pt-6 text-[10px] text-slate-400 font-mono text-center">
          &copy; {new Date().getFullYear()} SEAPEDIA Commerce Merchant Inc. All
          rights reserved.
        </footer>
      </main>
    </div>
  );
}
