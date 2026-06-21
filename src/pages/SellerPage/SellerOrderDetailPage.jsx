/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchOrderDetail() {
      try {
        setLoading(true);

        // Ambil data orders & order_items sekaligus join dengan table products untuk mengambil image_url
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
              id,
              order_id,
              product_id,
              price,
              quantity,
              products (
                product_name,
                image_url
              )
            )
          `,
          )
          .eq("id", id)
          .maybeSingle();

        if (orderError) throw orderError;

        if (!orderData) {
          setOrder(null);
          return;
        }

        setOrder(orderData);

        // Ambil data profil buyer secara terpisah
        if (orderData.buyer_id) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, phone_number")
            .eq("id", orderData.buyer_id)
            .maybeSingle();

          if (profileError) {
            console.error("Gagal memuat profil pembeli:", profileError.message);
          } else if (profileData) {
            setBuyerProfile(profileData);
          }
        }
      } catch (err) {
        console.error("Gagal memuat detail pesanan:", err.message);
        alert(`Gagal memuat detail pesanan: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchOrderDetail();
  }, [id]);

  const handleUpdateOrderStatus = async (targetStatus) => {
    try {
      setActionLoading(true);

      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ current_status: targetStatus })
        .eq("id", order.id);

      if (orderUpdateError) throw orderUpdateError;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("order_status_histories").insert([
        {
          order_id: order.id,
          status: targetStatus,
          changed_by: user.id,
        },
      ]);

      alert(`Status pesanan berhasil diubah menjadi: ${targetStatus}`);
      setOrder({ ...order, current_status: targetStatus });
    } catch (err) {
      alert(`Gagal memperbarui status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper parser URL gambar produk
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
        } catch (e) {
          imagePath = trimmed;
          console.log(e);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] text-center p-6">
        <h1 className="text-xl font-black text-[#0D241F]">
          Pesanan Tidak Ditemukan
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 bg-[#0D241F] text-white px-6 py-2.5 rounded-xl text-xs font-bold border-none hover:bg-emerald-950 transition cursor-pointer"
        >
          Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  // Normalisasi string status untuk penentuan warna lencana
  const currentStatusClean = (order.current_status || "").trim();
  const isPacking = currentStatusClean === "Sedang Dikemas";
  const isWaitingCourier = currentStatusClean === "Menunggu Pengirim";
  const isReturned = currentStatusClean === "Dikembalikan";

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto p-4 md:p-8">
      {/* Header Page */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0D241F] hover:bg-slate-50 transition cursor-pointer font-bold"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
            Detail Transaksi Nota
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: INFO STATUS & PENGIRIMAN */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <h3 className="font-black text-sm text-[#0D241F] uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Status Pesanan
            </h3>
            <div className="flex items-center justify-between mb-4">
              {/* 🚀 PERBAIKAN: Jika status Dikembalikan, ubah menjadi warna merah tegas */}
              <span
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                  isReturned
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : isPacking
                      ? "bg-amber-100 text-amber-800"
                      : isWaitingCourier
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {order.current_status || "Sedang Dikemas"}
              </span>
            </div>

            {/* Tombol Aksi Perubahan Status */}
            <div className="space-y-2 mt-4">
              {isPacking && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateOrderStatus("Menunggu Pengirim")}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer border-none shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Memproses..." : "Tandai Menunggu Pengirim"}
                </button>
              )}
              {isWaitingCourier && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleUpdateOrderStatus("Pesanan Selesai")}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer border-none shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Memproses..." : "Tandai Pesanan Selesai"}
                </button>
              )}
              {isReturned && (
                <div className="p-4 bg-red-50/50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl leading-relaxed">
                  Pesanan ini telah diajukan retur oleh pembeli. Silakan periksa
                  berkas pelaporan pengembalian pada tab Pengembalian.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <h3 className="font-black text-sm text-[#0D241F] uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Informasi Pembeli
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nama Pembeli
                </p>
                <p className="text-sm font-black text-[#0D241F] mt-0.5">
                  {buyerProfile?.full_name || "Nama Tidak Tersedia"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nomor Telepon
                </p>
                <p className="text-sm font-mono font-bold text-slate-600 mt-0.5">
                  {buyerProfile?.phone_number || "Nomor Tidak Tersedia"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Alamat Pengiriman Lengkap
                </p>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1 font-medium">
                  {order.delivery_address ||
                    "Alamat tidak tercantum pada transaksi ini."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: RINCIAN PRODUK (DENGAN FOTO) & ESTIMASI BIAYA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
            <h3 className="font-black text-sm text-[#0D241F] uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
              Rincian Produk (
              {order.order_items?.reduce(
                (sum, item) => sum + (item.quantity || 0),
                0,
              ) || 0}{" "}
              Items)
            </h3>

            <div className="space-y-4">
              {order.order_items?.map((item) => {
                const productMaster = item.products || {};
                const liveProductName =
                  productMaster.product_name ||
                  item.product_name ||
                  "Produk Eksklusif";

                // 🚀 PERBAIKAN: Parsing gambar produk asli untuk ditampilkan di list item detail invoice
                const displayProductImage = parseImageUrl(
                  productMaster.image_url,
                );

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-center"
                  >
                    {/* Mengganti icon emoji dengan element gambar produk asli */}
                    <img
                      src={displayProductImage}
                      alt={liveProductName}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-white p-0.5 shrink-0 shadow-3xs"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150";
                      }}
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-black text-sm text-[#0D241F] truncate">
                        {liveProductName}
                      </h4>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-slate-400 font-bold">
                          {item.quantity} x{" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(item.price)}
                        </p>
                        <p
                          className={`font-mono font-black text-sm shrink-0 ${isReturned ? "text-red-600" : "text-emerald-700"}`}
                        >
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format((item.quantity || 0) * (item.price || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rincian Finansial Belanja */}
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-3 font-semibold">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal Kuantitas Produk</span>
                <span className="font-mono text-slate-700">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(order.subtotal || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  Ongkos Kirim Logistik ({order.delivery_method || "Regular"})
                </span>
                <span className="font-mono text-slate-700">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(order.delivery_fee || 0)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Pajak Transaksi Aplikasi (PPN)</span>
                <span className="font-mono text-slate-700">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(order.tax_amount || 0)}
                </span>
              </div>

              {/* Total pembayaran dengan penyesuaian warna jika berstatus retur */}
              <div className="flex justify-between text-sm font-black text-[#0D241F] pt-4 border-t border-slate-100 mt-2 items-center">
                <span className="uppercase tracking-widest text-xs">
                  {isReturned ? "Total Dana Diretur" : "Total Pembayaran Buyer"}
                </span>
                <span
                  className={`font-mono text-xl ${isReturned ? "text-red-600" : "text-emerald-700"}`}
                >
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(order.final_total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
