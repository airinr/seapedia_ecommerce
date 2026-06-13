import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function SellerOrdersPage() {
  const navigate = useNavigate();
  const { orders, fetchSellerData, user } = useOutletContext();
  const [actionLoading, setActionLoading] = useState(false);

  // 🚀 FUNGSI HELPER: Memastikan ekstraksi gambar pertama dari tipe data text[] aman dari error parsing string/array
  const parseImageUrl = (rawUrlData) => {
    const fallbackPlaceholder =
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150";

    if (!rawUrlData) return fallbackPlaceholder;

    // Kasus 1: Jika data sudah otomatis berupa Array []
    if (Array.isArray(rawUrlData)) {
      return rawUrlData.length > 0 ? rawUrlData[0] : fallbackPlaceholder;
    }

    // Kasus 2: Jika data bertipe text[] terbaca sebagai string mentah '["https://..."]'
    if (typeof rawUrlData === "string") {
      const trimmed = rawUrlData.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsedArray = JSON.parse(trimmed);
          if (Array.isArray(parsedArray) && parsedArray.length > 0) {
            return parsedArray[0];
          }
        } catch (e) {
          console.error("Gagal parse string text[] array:", e);
        }
      }
      // Kasus 3: Jika ternyata datanya hanya string URL biasa tunggal tanpa bungkus array
      return trimmed || fallbackPlaceholder;
    }

    return fallbackPlaceholder;
  };

  const handleUpdateOrderStatus = async (orderId) => {
    try {
      setActionLoading(true);

      const targetStatus = "Menunggu Pengirim";

      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ current_status: targetStatus })
        .eq("id", orderId);

      if (orderUpdateError) throw orderUpdateError;

      await supabase.from("order_status_histories").insert([
        {
          order_id: orderId,
          status: targetStatus,
          changed_by: user.id,
        },
      ]);

      alert(
        `Sukses! Pesanan telah diteruskan ke kurir dengan status: [${targetStatus}]`,
      );
      fetchSellerData();
    } catch (err) {
      alert(`Gagal memperbarui status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* SECTION HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-[#0D241F] tracking-tight">
            Manajemen Semua Pesanan
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Pantau ringkasan logistik, validasi pembayaran, dan atur pemenuhan
            pesanan konsumen.
          </p>
        </div>
      </div>

      {/* ORDERS WRAPPER BOX */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
        {!orders || orders.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center text-xl font-mono mb-4">
              0
            </div>
            <p className="text-slate-400 text-sm font-semibold tracking-wide">
              Belum ada pesanan masuk dalam manifest logistik saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => {
              const itemsArray = order.order_items || [];
              const firstItem = itemsArray[0] || {};
              const productMaster = firstItem.products || {};

              // Ekstraksi nama produk live dari database master
              const firstItemName =
                productMaster.product_name ||
                firstItem.product_name ||
                firstItem.name ||
                (itemsArray.length > 0
                  ? `Paket Pesanan (${itemsArray.length} Item)`
                  : "Produk Eksklusif Seapedia");

              // eslint-disable-next-line no-unused-vars
              const displayImage = parseImageUrl(
                productMaster.image_url || firstItem.image_url,
              );

              const totalQty =
                itemsArray.reduce((sum, i) => sum + (i.quantity || 0), 0) ||
                order.quantity ||
                1;

              // Normalisasi string status (Case-Insensitive)
              const statusStr = (order.current_status || "")
                .toLowerCase()
                .replace(/\s+/g, "");
              const isPacking = statusStr.includes("dikemas");
              const isWaitingCourier =
                statusStr.includes("pengirim") ||
                statusStr.includes("kurir") ||
                statusStr.includes("dikirim");

              return (
                <div
                  key={order.id}
                  className="p-5 bg-[#F8F9FA] rounded-xl border border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-emerald-600/30 hover:bg-white"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* MINI CONTAINER IMAGE */}
                    <div className="w-14 h-14 bg-white border border-slate-200/60 rounded-xl overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-3xs">
                      <img
                        src={(() => {
                          const rawUrlData =
                            productMaster.image_url || firstItem.image_url;
                          const fallbackPlaceholder =
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150";

                          if (!rawUrlData) return fallbackPlaceholder;

                          let imagePath = Array.isArray(rawUrlData)
                            ? rawUrlData[0]
                            : rawUrlData;
                          const cleanPath = String(imagePath)
                            // eslint-disable-next-line no-useless-escape
                            .replace(/[\[\]{}""']/g, "")
                            .trim();

                          if (!cleanPath) return fallbackPlaceholder;

                          if (
                            cleanPath.startsWith("http://") ||
                            cleanPath.startsWith("https://")
                          ) {
                            return cleanPath;
                          }

                          const supabaseUrl =
                            supabase.supabaseUrl ||
                            "https://kuemkydndytxahualrw.supabase.co";
                          const NAMA_BUCKET = "products";

                          return `${supabaseUrl}/storage/v1/object/public/${NAMA_BUCKET}/${cleanPath}`;
                        })()}
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
                      <p className="font-extrabold text-[#0D241F] text-sm md:text-base truncate tracking-tight">
                        {firstItemName}
                      </p>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium">
                          {totalQty} Pcs
                        </span>
                        <span className="text-slate-300 text-[10px]">•</span>
                        <span className="font-mono text-emerald-800 font-bold text-xs md:text-sm">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(order.final_total)}
                        </span>
                        {itemsArray.length > 1 && (
                          <>
                            <span className="text-slate-300 text-[10px]">
                              •
                            </span>
                            <span className="text-[10px] bg-slate-200/60 text-slate-600 font-bold px-2 py-0.5 rounded">
                              +{itemsArray.length - 1} Item Lainnya
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono mt-1.5 uppercase tracking-wider font-semibold">
                        UID: {order.id?.slice(0, 8)}...{order.id?.slice(-4)}
                      </p>
                    </div>
                  </div>

                  {/* ACTION LAYOUT CONTROLLER */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2.5 w-full md:w-auto border-t md:border-none border-slate-200/60 pt-3 md:pt-0 shrink-0">
                    <span
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                        isPacking
                          ? "bg-amber-50 text-amber-800 border border-amber-200/50"
                          : isWaitingCourier
                            ? "bg-blue-50 text-blue-800 border border-blue-200/50"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                      }`}
                    >
                      {order.current_status || "Sedang Dikemas"}
                    </span>

                    <div className="flex gap-2 w-auto">
                      <button
                        onClick={() => navigate(`/seller/orders/${order.id}`)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-[#0D241F] hover:bg-slate-50 text-[11px] font-bold rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        Detail Invoice
                      </button>

                      {isPacking && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleUpdateOrderStatus(order.id)}
                          className="px-4 py-2 bg-[#0D241F] hover:bg-emerald-950 text-white text-[11px] font-bold rounded-lg transition cursor-pointer border-none shadow-sm disabled:opacity-40 whitespace-nowrap"
                        >
                          {actionLoading ? "Memproses..." : "Siap Kirim"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
