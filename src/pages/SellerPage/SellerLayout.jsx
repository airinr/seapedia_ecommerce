/* eslint-disable react-hooks/set-state-in-effect */
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

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            `
            id,
            buyer_id,
            store_id,
            subtotal,
            discount_amount,
            delivery_fee,
            tax_amount,
            final_total,
            delivery_method,
            delivery_address,
            current_status,
            created_at,
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
    {
      name: "Dashboard",
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
      path: "/seller/dashboard",
    },
    {
      name: "Katalog Produk",
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
          <path d="m7.5 4.27 9 5.15" />
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
      path: "/seller/catalog",
    },
    {
      name: "Pesanan Masuk",
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
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
      path: "/seller/orders",
    },
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
              Panel Penjual
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Sistem Toko & Produk
            </p>
          </div>
          <nav className="space-y-1">
            {sellerMenus.map((menu, i) => {
              // 🚀 PERBAIKAN 1: Menggunakan startsWith agar sub-route dasbor tetap mendeteksi menu aktif
              const isSelected = location.pathname.startsWith(menu.path);

              return (
                <button
                  key={i}
                  onClick={() => navigate(menu.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition text-left cursor-pointer border-none ${
                    isSelected
                      ? "!bg-[#0D241F] !text-white shadow-sm font-black"
                      : "text-slate-500 hover:bg-[#EBF4F1] hover:text-[#0D241F] bg-transparent"
                  }`}
                >
                  <span
                    className={
                      isSelected
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
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 rounded-xl hover:bg-red-50/60 transition text-left cursor-pointer border-none bg-transparent group"
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
            Keluar akun
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
