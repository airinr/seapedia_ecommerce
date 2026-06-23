/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";
import toast from "react-hot-toast";

export default function BuyerOrdersPage() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useRole();
  const [orders, setOrders] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigasi tab internal: "running" (Berjalan), "completed" (Selesai), atau "returned" (Pengembalian)
  const [activeTab, setActiveTab] = useState("running");

  useEffect(() => {
    async function fetchMyOrdersAndReturns() {
      if (roleLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Mengambil data dari dua tabel secara paralel (orders & order_returns)
        const [ordersRes, returnsRes] = await Promise.all([
          supabase
            .from("orders")
            .select(
              `
              id,
              buyer_id,
              store_id,
              final_total,
              delivery_method,
              current_status,
              created_at,
              order_items (
                id,
                product_name,
                quantity,
                products:product_id (image_url)
              )
            `,
            )
            .eq("buyer_id", user.id)
            .order("created_at", { ascending: false }),

          supabase
            .from("order_returns")
            .select(
              `
              id,
              order_id,
              reason,
              status,
              created_at,
              orders:order_id (
                final_total,
                order_items (
                  id,
                  product_name,
                  quantity,
                  products:product_id (image_url)
                )
              )
            `,
            )
            .eq("buyer_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (returnsRes.error) throw returnsRes.error;

        setOrders(ordersRes.data || []);
        setReturnsList(returnsRes.data || []);
      } catch (err) {
        console.error("Gagal memuat data transaksional pembeli:", err.message);
        setError(err.message);
        toast.error("Gagal memuat data pesanan");
      } finally {
        setLoading(false);
      }
    }

    fetchMyOrdersAndReturns();
  }, [user, roleLoading]);

  // 📊 PEMBAGIAN KATEGORI PESANAN DENGAN FILTERING KETAT UNTUK BARANG RETUR
  const groupedOrders = useMemo(() => {
    const running = [];
    const completed = [];

    // Membuat Set kumpulan ID pesanan yang sudah diajukan retur agar pencarian lebih cepat
    const returnedOrderIds = new Set(returnsList.map((ret) => ret.order_id));

    orders.forEach((order) => {
      // 🚀 KUNCI PERBAIKAN: Jika ID pesanan ada di order_returns atau statusnya 'Dikembalikan',
      // keluarkan dari riwayat normal agar tidak muncul ganda
      if (
        order.current_status === "Dikembalikan" ||
        returnedOrderIds.has(order.id)
      ) {
        return;
      }

      if (order.current_status === "Pesanan Selesai") {
        completed.push(order);
      } else {
        running.push(order);
      }
    });

    return { running, completed };
  }, [orders, returnsList]);

  // Fungsi pembantu memuat gambar produk utama
  const parseProductImage = (orderItem) => {
    const fallback =
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150";
    const rawUrl = orderItem?.products?.image_url;

    if (!rawUrl) return fallback;
    if (Array.isArray(rawUrl)) return rawUrl[0] || fallback;
    return rawUrl;
  };

  // Gaya warna lencana khusus untuk status pelacakan order_returns asli
  const getReturnStatusBadgeStyle = (status) => {
    switch (status) {
      case "Selesai":
      case "Disetujui":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Ditolak":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200"; // Status 'Diajukan'
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-xs text-red-600 font-bold">
            Gagal memuat data: {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#0D241F] text-white rounded-xl text-xs font-bold border-none cursor-pointer hover:bg-emerald-950 transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* JUDUL HALAMAN */}
      <div>
        <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
          Pesanan Saya
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Pantau status pengiriman barang belanjaan Anda atau kelola berkas
          pelaporan retur aktif.
        </p>
      </div>

      {/* NAVIGASI 3 TAB KATEGORI OPERASIONAL */}
      <div className="flex gap-1 border-b border-slate-100 pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("running")}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 uppercase tracking-wider bg-transparent cursor-pointer ${
            activeTab === "running"
              ? "border-[#0D241F] text-[#0D241F]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Sedang Berjalan ({groupedOrders.running.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 uppercase tracking-wider bg-transparent cursor-pointer ${
            activeTab === "completed"
              ? "border-[#0D241F] text-[#0D241F]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Riwayat Selesai ({groupedOrders.completed.length})
        </button>
        <button
          onClick={() => setActiveTab("returned")}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 uppercase tracking-wider bg-transparent cursor-pointer ${
            activeTab === "returned"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-400 hover:text-red-500"
          }`}
        >
          Pengembalian ({returnsList.length})
        </button>
      </div>

      {/* SECTION TAMPILAN UTAMA TABEL BERDASARKAN TAB */}
      <div className="w-full">
        {/* ==================== 1 & 2: RENDER TAB PESANAN NORMAL JALAN / SELESAI ==================== */}
        {activeTab !== "returned" && (
          <div className="space-y-4">
            {(activeTab === "running"
              ? groupedOrders.running
              : groupedOrders.completed
            ).length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-[32px] p-16 text-center shadow-3xs">
                <h2 className="text-sm font-bold text-[#0D241F]">
                  Daftar Pesanan Kosong
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  {activeTab === "running"
                    ? "Tidak ada transaksi belanja Anda yang sedang dikemas toko atau dikirim kurir."
                    : "Anda belum memiliki riwayat penyelesaian transaksi belanja."}
                </p>
              </div>
            ) : (
              (activeTab === "running"
                ? groupedOrders.running
                : groupedOrders.completed
              ).map((order) => {
                const totalItemsCount =
                  order.order_items?.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  ) || 0;
                const firstItem = order.order_items?.[0];

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-2xs"
                  >
                    <div className="bg-slate-50/60 px-5 py-3.5 flex justify-between items-center border-b border-slate-100">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Tanggal Transaksi
                        </p>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Total Pembayaran
                        </p>
                        <p className="font-mono text-xs font-black text-emerald-800 mt-0.5">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(order.final_total)}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-5">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <img
                          src={parseProductImage(firstItem)}
                          alt={firstItem?.product_name}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-[#0D241F] text-sm truncate">
                            {firstItem?.product_name || "Produk Eksklusif"}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            Kuantitas: {totalItemsCount} Unit{" "}
                            {order.order_items?.length > 1 &&
                              `(+ ${order.order_items.length - 1} produk lainnya)`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
                        <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-100">
                          {order.current_status}
                        </span>
                        {activeTab === "completed" ? (
                          <button
                            onClick={() =>
                              navigate(`/orders/return/${order.id}`)
                            }
                            className="w-full sm:w-auto px-5 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-xs hover:bg-red-50 transition cursor-pointer shadow-3xs"
                          >
                            Ajukan Pengembalian
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              toast(`Status pesanan: ${order.current_status}`)
                            }
                            className="w-full sm:w-auto px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer shadow-3xs"
                          >
                            Lacak Pesanan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ==================== 3: RENDER KHUSUS DATA AMBIL DARI TABEL order_returns ==================== */}
        {activeTab === "returned" && (
          <div className="space-y-4">
            {returnsList.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-[32px] p-16 text-center shadow-3xs">
                <h2 className="text-sm font-bold text-[#0D241F]">
                  Tidak Ada Pengembalian
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Anda tidak memiliki berkas pengajuan komplain atau retur
                  barang aktif.
                </p>
              </div>
            ) : (
              returnsList.map((retItem) => {
                const targetOrder = retItem.orders;
                const totalItemsCount =
                  targetOrder?.order_items?.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  ) || 0;
                const firstItem = targetOrder?.order_items?.[0];

                return (
                  <div
                    key={retItem.id}
                    className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-2xs hover:border-red-200 transition"
                  >
                    {/* Atas: Rincian invoice pesanan asal */}
                    <div className="bg-red-50/20 px-5 py-3.5 flex justify-between items-center border-b border-red-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Tanggal Komplain
                        </p>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">
                          {new Date(retItem.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Estimasi Refund Dana
                        </p>
                        <p className="font-mono text-xs font-black text-red-700 mt-0.5">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(targetOrder?.final_total || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Bawah: Info barang & Alasan serta Status Terkini Retur dari Admin */}
                    <div className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-5">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <img
                            src={parseProductImage(firstItem)}
                            alt={firstItem?.product_name}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-[#0D241F] text-sm truncate">
                              {firstItem?.product_name || "Produk Eksklusif"}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                              Kuantitas: {totalItemsCount} Unit{" "}
                              {targetOrder?.order_items?.length > 1 &&
                                `(+ ${targetOrder.order_items.length - 1} produk lainnya)`}
                            </p>
                          </div>
                        </div>

                        {/* Status terakhir pelacakan komplain */}
                        <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                          <span
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border w-fit sm:w-auto ${getReturnStatusBadgeStyle(
                              retItem.status,
                            )}`}
                          >
                            Status Retur: {retItem.status || "Diajukan"}
                          </span>
                          {/* <button
                            onClick={() =>
                              alert(
                                `Detail Berkas Komplain:\n\nAlasan Anda: "${retItem.reason}"\nStatus Terakhir Admin: [Laporan ${
                                  retItem.status || "Sedang Ditinjau"
                                }]`,
                              )
                            }
                            className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition cursor-pointer border-none shadow-3xs"
                          >
                            Detail Kasus
                          </button> */}
                        </div>
                      </div>

                      {/* Teks Box Alasan Pengguna */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Alasan Pengembalian Anda:
                        </p>
                        <p className="text-xs text-slate-600 mt-1 italic leading-relaxed">
                          "{retItem.reason}"
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
