/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function SellerDashboard() {
  const { store, products, orders, revenue, fetchSellerData } =
    useOutletContext();
  const [actionLoading, setActionLoading] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  useEffect(() => {
    if (store) {
      setStoreName(store.store_name || "");
      setStoreDesc(store.description || "");
      setStoreAddress(store.address || "");
    }
  }, [store]);

  const parseImageUrl = (rawUrlData) => {
    const fallbackPlaceholder =
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150";

    if (!rawUrlData) return fallbackPlaceholder;

    let imagePath = "";

    if (Array.isArray(rawUrlData)) {
      imagePath = rawUrlData.length > 0 ? rawUrlData[0] : "";
    } else if (typeof rawUrlData === "string") {
      const trimmed = rawUrlData.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsedArray = JSON.parse(trimmed);
          if (Array.isArray(parsedArray) && parsedArray.length > 0) {
            imagePath = parsedArray[0];
          }
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          imagePath = trimmed;
        }
      } else {
        imagePath = trimmed;
      }
    }

    const cleanUrl = String(imagePath)
      // eslint-disable-next-line no-useless-escape
      .replace(/[\[\]{}""']/g, "")
      .trim();

    return cleanUrl || fallbackPlaceholder;
  };

  // 🚀 PERBAIKAN UTAMA: Integrasi mutasi pembaruan profil toko langsung ke database Supabase
  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from("stores")
        .update({
          store_name: storeName.trim(),
          description: storeDesc.trim(),
          address: storeAddress.trim(),
        })
        .eq("id", store.id);

      if (error) throw error;

      alert("Profil toko berhasil diperbarui di server Supabase!");
      fetchSellerData(); // Memicu re-fetch data context induk agar UI sinkron serentak
    } catch (err) {
      alert(`Gagal memperbarui informasi toko: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-[#0D241F] tracking-tight">
            {store?.store_name || "Merchant"} Control Centre
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Kelola katalog produk, monitor pergerakan inventaris, dan validasi
            transaksi masuk pembeli.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0D241F] text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Total Omset Pendapatan
          </p>
          <h2 className="text-3xl font-black font-mono mt-2">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(revenue)}
          </h2>
        </div>
        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Katalog Produk
          </p>
          <h2 className="text-3xl font-black font-mono text-[#0D241F] mt-2">
            {products?.length || 0}{" "}
            <span className="text-sm font-sans font-bold text-slate-400">
              Items
            </span>
          </h2>
        </div>
        <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pesanan Masuk
          </p>
          <h2 className="text-3xl font-black font-mono text-[#0D241F] mt-2">
            {orders?.filter((o) => {
              const status = (o.current_status || "")
                .toLowerCase()
                .replace(/\s+/g, "");
              return status === "sedangdikemas" || status === "dikemas";
            }).length || 0}{" "}
            <span className="text-sm font-sans font-bold text-amber-600">
              Perlu Dikemas
            </span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
            <h3 className="font-extrabold text-sm text-[#0D241F] uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Manifest Pesanan Terbaru
            </h3>
            {!orders || orders.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-4">
                Belum ada antrean transaksi konsumen yang tercatat.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => {
                  const itemsArray = order.order_items || [];
                  const firstItem = itemsArray[0] || {};
                  const productMaster = firstItem.products || {};

                  const firstItemName =
                    productMaster.product_name ||
                    firstItem.product_name ||
                    firstItem.name ||
                    (itemsArray.length > 0
                      ? `Paket (${itemsArray.length} Barang)`
                      : "Produk Eksklusif");

                  const displayImage = parseImageUrl(
                    productMaster.image_url || firstItem.image_url,
                  );

                  const totalQty =
                    itemsArray.reduce((sum, i) => sum + (i.quantity || 0), 0) ||
                    1;

                  return (
                    <div
                      key={order.id}
                      className="p-4 bg-[#F8F9FA] rounded-xl border border-slate-200/60 text-xs flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-3xs">
                          <img
                            src={displayImage}
                            alt={firstItemName}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150";
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-700 truncate">
                            {firstItemName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {totalQty} Items •{" "}
                            {new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0,
                            }).format(order.final_total)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                          (order.current_status || "")
                            .toLowerCase()
                            .replace(/\s+/g, "")
                            .includes("dikemas")
                            ? "bg-amber-50 text-amber-800 border border-amber-200/40"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200/40"
                        }`}
                      >
                        {order.current_status || "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
            <h3 className="font-extrabold text-sm text-[#0D241F] uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
              Manajemen Profil Toko
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
                className="w-full mt-2 py-2 bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border-none disabled:bg-slate-300"
              >
                {actionLoading
                  ? "Menyimpan Perubahan..."
                  : "Perbarui Informasi Toko"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
