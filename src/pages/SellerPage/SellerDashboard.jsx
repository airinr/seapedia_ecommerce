import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";
import ProductCatalog from "./ProductCatalog";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useRole();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);

  // State Form Toko
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("sellerActiveTab") || "Dashboard";
  });

  useEffect(() => {
    localStorage.setItem("sellerActiveTab", activeTab);
  }, [activeTab]);

  // =========================================================================
  // 💡 AMBIL DATA TOKO, PRODUK, PESANAN, DAN PENDAPATAN
  // =========================================================================
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
        setStoreName(storeData.store_name);
        setStoreDesc(storeData.description || "");
        setStoreAddress(storeData.address || "");

        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });

        if (prodError) throw prodError;
        setProducts(prodData || []);

        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });

        if (orderError) throw orderError;
        setOrders(orderData || []);

        const totalRevenue = (orderData || [])
          .filter((ord) => ord.status === "Selesai")
          .reduce((sum, ord) => sum + Number(ord.total_price), 0);
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

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("stores")
        .update({
          store_name: storeName,
          description: storeDesc,
          address: storeAddress,
        })
        .eq("id", store.id);

      if (error) throw error;
      alert("Profil toko berhasil diperbarui!");
      fetchSellerData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("orders")
        .update({ status: "Menunggu Pengirim" })
        .eq("id", orderId)
        .eq("status", "Sedang Dikemas");

      if (error) throw error;
      alert("Status pesanan diperbarui!");
      fetchSellerData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

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
            {[
              { name: "Dashboard", icon: "📊" },
              { name: "Katalog Produk", icon: "📦" },
              { name: "Pesanan Masuk", icon: "📥" },
            ].map((menu, i) => {
              const isSelected = activeTab === menu.name;
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(menu.name)}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
              {activeTab === "Dashboard"
                ? `${store?.store_name} Control Centre`
                : activeTab}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {activeTab === "Dashboard" &&
                "Manage your products, monitor inventory, and process orders."}
              {activeTab === "Katalog Produk" &&
                "Tambah, edit, atau hapus produk dari katalog toko Anda."}
              {activeTab === "Pesanan Masuk" &&
                "Pantau dan proses pesanan dari pelanggan Anda."}
            </p>
          </div>
        </div>

        {activeTab === "Dashboard" && (
          <div className="animate-in fade-in duration-500">
            {/* STATS BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-[#0D241F] text-white p-6 rounded-[24px] shadow-sm relative overflow-hidden">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Total Pendapatan Toko
                </p>
                <h2 className="text-3xl font-black font-mono mt-2">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(revenue)}
                </h2>
              </div>
              <div className="bg-white border border-slate-200/60 p-6 rounded-[24px] shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Katalog Produk
                </p>
                <h2 className="text-3xl font-black font-mono text-[#0D241F] mt-2">
                  {products.length}{" "}
                  <span className="text-sm font-sans font-bold text-slate-400">
                    Items
                  </span>
                </h2>
              </div>
              <div className="bg-white border border-slate-200/60 p-6 rounded-[24px] shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pesanan Masuk
                </p>
                <h2 className="text-3xl font-black font-mono text-[#0D241F] mt-2">
                  {orders.filter((o) => o.status === "Sedang Dikemas").length}{" "}
                  <span className="text-sm font-sans font-bold text-amber-600">
                    Perlu Dikemas
                  </span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                  <h3 className="font-black text-base text-[#0D241F] mb-4">
                    📥 Pesanan Terbaru
                  </h3>
                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      Belum ada pesanan masuk.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="p-4 bg-[#F8F9FA] rounded-xl border border-slate-200/60 text-xs flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-700">
                              Order ...{order.id.slice(-6)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {order.quantity} Items •{" "}
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                              }).format(order.total_price)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.status === "Sedang Dikemas" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      ))}
                      {orders.length > 3 && (
                        <button
                          onClick={() => setActiveTab("Pesanan Masuk")}
                          className="w-full text-center py-2 text-xs font-bold text-[#0D241F] hover:underline cursor-pointer border-none bg-transparent"
                        >
                          Lihat Semua Pesanan ➔
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                  <h3 className="font-black text-base text-[#0D241F] mb-3">
                    🏪 Manajemen Profil Toko
                  </h3>
                  <form onSubmit={handleUpdateStore} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Nama Toko
                      </label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Slogan / Deskripsi
                      </label>
                      <textarea
                        rows="2"
                        value={storeDesc}
                        onChange={(e) => setStoreDesc(e.target.value)}
                        className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Alamat Gudang
                      </label>
                      <input
                        type="text"
                        required
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full mt-2 py-2 bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border-none"
                    >
                      Perbarui Informasi Toko
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Katalog Produk" && (
          <ProductCatalog
            products={products}
            store={store}
            fetchSellerData={fetchSellerData}
            user={user}
            actionLoading={actionLoading}
            setActionLoading={setActionLoading}
          />
        )}

        {activeTab === "Pesanan Masuk" && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
              <h3 className="font-black text-base text-[#0D241F] mb-4">
                📥 Manajemen Semua Pesanan
              </h3>
              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Belum ada pesanan masuk.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-[#F8F9FA] rounded-xl border border-slate-200/60 text-xs flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: ...{order.id.slice(-8)}
                          </p>
                          <p className="font-bold text-slate-700 mt-0.5">
                            {order.quantity} Pcs •{" "}
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                            }).format(order.total_price)}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${order.status === "Sedang Dikemas" ? "bg-amber-100 text-amber-800" : order.status === "Menunggu Pengirim" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      {order.status === "Sedang Dikemas" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id)}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition cursor-pointer border-none"
                        >
                          Ubah Jadi "Menunggu Pengirim" ➔
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="border-t border-slate-200 mt-12 pt-6 text-[10px] text-slate-400 font-mono text-center">
          &copy; {new Date().getFullYear()} SEAPEDIA Commerce Merchant Inc. All
          rights reserved.
        </footer>
      </main>
    </div>
  );
}
