import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useRole();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);

  // State Form Produk (Tambah / Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState(""); // 🚀 BARU: State untuk menampung Image URL

  // State Form Toko
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

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

      // 1. Ambil Informasi Toko
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

        // 2. Ambil Produk Milik Toko Ini
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });

        if (prodError) throw prodError;
        setProducts(prodData || []);

        // 3. Ambil Pesanan Masuk
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });

        if (orderError) throw orderError;
        setOrders(orderData || []);

        // 4. Hitung Ringkasan Pendapatan
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

  // =========================================================================
  // 🏪 1. MANAJEMEN UPDATE PROFIL TOKO
  // =========================================================================
  const handleUpdateStore = async (e) => {
    e.preventDefault();
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

  // =========================================================================
  // 📦 2. MANAJEMEN CRUD PRODUK (Sinkron dengan image_url database)
  // =========================================================================
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      setActionLoading(true);
      const payload = {
        store_id: store.id,
        product_name: prodName,
        description: prodDesc,
        price: Number(prodPrice),
        stock: Number(prodStock),
        image_url: prodImageUrl || null, // 🚀 Memetakan data ke kolom image_url Supabase
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", currentProductId);
        if (error) throw error;
        alert("Produk berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
        alert("Produk baru berhasil ditambahkan!");
      }

      // Reset Form Input
      setProdName("");
      setProdDesc("");
      setProdPrice("");
      setProdStock("");
      setProdImageUrl("");
      setIsEditing(false);
      setCurrentProductId(null);

      fetchSellerData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setCurrentProductId(product.id);
    setProdName(product.product_name);
    setProdDesc(product.description || "");
    setProdPrice(product.price);
    setProdStock(product.stock);
    setProdImageUrl(product.image_url || ""); // Load data image_url lama saat edit
    setActiveTab("Katalog Produk");
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini dari katalog?"))
      return;
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      alert("Produk sukses dihapus.");
      fetchSellerData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // 📝 3. PEMROSESAN PESANAN
  // =========================================================================
  const handleUpdateOrderStatus = async (orderId) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("orders")
        .update({ status: "Menunggu Pengirim" })
        .eq("id", orderId)
        .eq("status", "Sedang Dikemas");

      if (error) throw error;
      alert("Status pesanan diperbarui! Menunggu Driver mengambil paket.");
      fetchSellerData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-xl font-black text-[#0D241F]">
          Toko Belum Terdaftar
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          Anda harus mendaftarkan toko terlebih dahulu sebelum menggunakan panel
          ini.
        </p>
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

          <button
            onClick={() => {
              setIsEditing(false);
              setProdName("");
              setProdPrice("");
              setProdStock("");
              setProdImageUrl("");
              setActiveTab("Katalog Produk");
            }}
            className="w-full bg-white hover:bg-slate-50 text-[#0D241F] border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <span>+</span> Add Product
          </button>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 cursor-pointer hover:text-[#0D241F]">
            <span>❓</span> Help Center
          </div>
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition"
          >
            <span>➔</span> Exit Dashboard
          </div>
        </div>
      </aside>

      {/* DASHBOARD MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
              {store.store_name} Control Centre
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage your products, monitor inventory, and process orders.
            </p>
          </div>
        </div>

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
            <p className="text-[10px] text-emerald-100/60 mt-1">
              *Hanya dari pesanan sukses 'Selesai'
            </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* FORM FORM TAMBAH/EDIT PRODUK */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
              <h3 className="font-black text-base text-[#0D241F] mb-4">
                {isEditing
                  ? "📝 Edit Informasi Produk"
                  : "✨ Tambah Produk ke Katalog"}
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                      placeholder="Contoh: AirPods Max Pro"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Deskripsi Singkat
                    </label>
                    <input
                      type="text"
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                      placeholder="Tulis deskripsi atau spesifikasi produk"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Harga (Rupiah)
                    </label>
                    <input
                      type="number"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                      placeholder="Contoh: 1250000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      required
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                      placeholder="Contoh: 15"
                    />
                  </div>
                </div>

                {/* 🚀 FIELD BARU: INPUT URL GAMBAR PRODUK */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    URL Gambar Produk (Opsional)
                  </label>
                  <input
                    type="url"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                    placeholder="Contoh: https://images.unsplash.com/photo-xxx..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setProdName("");
                        setProdPrice("");
                        setProdStock("");
                        setProdImageUrl("");
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:underline border-none bg-transparent cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition border-none cursor-pointer"
                  >
                    {isEditing ? "Simpan Perubahan" : "Masukkan ke Toko"}
                  </button>
                </div>
              </form>
            </div>

            {/* LIST DAFTAR KATALOG */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
              <h3 className="font-black text-base text-[#0D241F] mb-4">
                📦 Daftar Katalog Toko Anda
              </h3>
              {products.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Katalog Anda masih kosong.
                </p>
              ) : (
                <div className="space-y-3">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-xl border border-slate-100 text-xs gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {/* Preview Gambar Mini Terintegrasi */}
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.product_name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-400 text-lg">
                            📦
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-[#0D241F]">
                            {prod.product_name}
                          </h4>
                          <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                            {prod.description || "Tanpa deskripsi."}
                          </p>
                          <p className="font-mono text-emerald-700 font-bold mt-1">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0,
                            }).format(prod.price)}
                            <span className="text-slate-400 font-sans font-medium text-[10px] ml-2">
                              | Stok: {prod.stock}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleEditClick(prod)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold transition text-[11px] border-none cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold transition text-[11px] border-none cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SEGMEN KANAN */}
          <div className="space-y-8">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
              <h3 className="font-black text-base text-[#0D241F] mb-4">
                📥 Manajemen Pesanan Masuk
              </h3>
              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Belum ada pesanan masuk.
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-[#F8F9FA] rounded-xl border border-slate-200/60 text-xs flex flex-col justify-between gap-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            ID: ...{order.id.slice(-8)}
                          </p>
                          <p className="font-bold text-slate-700 mt-0.5">
                            Jumlah Item: {order.quantity} Pcs
                          </p>
                          <p className="font-bold font-mono text-[#0D241F] mt-0.5">
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0,
                            }).format(order.total_price)}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${order.status === "Sedang Dikemas" ? "bg-amber-100 text-amber-800" : order.status === "Menunggu Pengirim" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      {order.status === "Sedang Dikemas" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id)}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer text-center border-none"
                        >
                          Ubah Jadi "Menunggu Pengirim" ➔
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
              <h3 className="font-black text-base text-[#0D241F] mb-3">
                🏪 Manajemen Profil Toko
              </h3>
              <form onSubmit={handleUpdateStore} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Nama Toko Unik
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
                    Alamat Gudang Pengambilan
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

        <footer className="border-t border-slate-200 mt-12 pt-6 text-[10px] text-slate-400 font-mono text-center">
          &copy; {new Date().getFullYear()} SEAPEDIA Commerce Merchant Inc. All
          rights reserved.
        </footer>
      </main>
    </div>
  );
}
