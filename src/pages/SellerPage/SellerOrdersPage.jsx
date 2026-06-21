/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function SellerOrdersPage() {
  const navigate = useNavigate();
  const { orders, fetchSellerData, user } = useOutletContext();
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [updatingReturnId, setUpdatingReturnId] = useState(null);

  // State utama penampung data relasi order_returns
  const [returnsMeta, setReturnsMeta] = useState({});

  // State navigasi tab internal merchant
  const [activeTab, setActiveTab] = useState("running");

  // Ambil semua manifest dari order_returns secara independently
  useEffect(() => {
    async function fetchAllReturnsMetadata() {
      try {
        const { data, error } = await supabase
          .from("order_returns")
          .select(
            "id, order_id, reason, status, created_at, buyer_id, refund_amount",
          );

        if (error) throw error;

        const metaMapping = {};
        data?.forEach((item) => {
          metaMapping[item.order_id] = item;
        });

        setReturnsMeta(metaMapping);
      } catch (err) {
        console.error(
          "Gagal memuat dokumen alasan order_returns:",
          err.message,
        );
      }
    }

    fetchAllReturnsMetadata();
  }, [orders]);

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

  const handleUpdateOrderStatus = async (orderId) => {
    try {
      setLoadingOrderId(orderId);
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

      alert(`Sukses! Pesanan dialihkan ke status: [${targetStatus}]`);
      await fetchSellerData();
    } catch (err) {
      alert(`Gagal memperbarui status: ${err.message}`);
    } finally {
      setLoadingOrderId(null);
    }
  };

  // Update Status Retur + Automasi Pengembalian Uang Saldo Buyer
  const handleUpdateReturnStatus = async (returnId, newStatus) => {
    try {
      setUpdatingReturnId(returnId);

      const matchedOrder = orders.find(
        (o) => returnsMeta[o.id]?.id === returnId,
      );

      if (!matchedOrder) {
        throw new Error("Data manifes pesanan penunjang tidak ditemukan.");
      }

      const returnRowInfo = returnsMeta[matchedOrder.id];
      const buyerId = returnRowInfo?.buyer_id || matchedOrder.buyer_id;
      const refundAmount = Number(
        returnRowInfo?.refund_amount || matchedOrder.final_total || 0,
      );

      // 1. Update status utama pada tabel order_returns
      const { error: returnUpdateError } = await supabase
        .from("order_returns")
        .update({ status: newStatus })
        .eq("id", returnId);

      if (returnUpdateError) throw returnUpdateError;

      // 2. Jika status berubah menjadi "Disetujui", proses pemindahan dana dompet dijalankan
      if (newStatus === "Disetujui") {
        if (!buyerId) throw new Error("ID Pengguna Pembeli tidak terdeteksi.");

        const { data: profileData, error: profileFetchError } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", buyerId)
          .single();

        if (profileFetchError) throw profileFetchError;

        const currentBalance = Number(profileData?.wallet_balance || 0);
        const nextBalance = currentBalance + refundAmount;

        const { error: walletUpdateError } = await supabase
          .from("profiles")
          .update({ wallet_balance: nextBalance })
          .eq("id", buyerId);

        if (walletUpdateError) throw walletUpdateError;

        const { error: transactionLogError } = await supabase
          .from("wallet_transactions")
          .insert([
            {
              user_id: buyerId,
              amount: refundAmount,
              type: "REFUND",
              description: `Pengembalian dana (Refund) sukses untuk Nota #${matchedOrder.id.slice(0, 8).toUpperCase()}`,
            },
          ]);

        if (transactionLogError) throw transactionLogError;
      }

      // 3. Sinkronisasi status manifest ke tabel orders utama
      let orderStatus = "";
      if (newStatus === "Disetujui") orderStatus = "Retur Disetujui";
      else if (newStatus === "Ditolak") orderStatus = "Retur Ditolak";
      else if (newStatus === "Selesai") orderStatus = "Dikembalikan";
      else if (newStatus === "Diajukan")
        orderStatus = "Menunggu Persetujuan Retur";

      if (orderStatus) {
        await supabase
          .from("orders")
          .update({ current_status: orderStatus })
          .eq("id", matchedOrder.id);

        await supabase.from("order_status_histories").insert([
          {
            order_id: matchedOrder.id,
            status: orderStatus,
            changed_by: user.id,
          },
        ]);
      }

      alert(
        `Sukses! Status diperbarui menjadi [${newStatus}] ${newStatus === "Disetujui" ? "dan dana berhasil dikembalikan ke saldo dompet pembeli." : ""}`,
      );
      await fetchSellerData();
    } catch (err) {
      alert(`Gagal memproses aksi operasional status retur: ${err.message}`);
    } finally {
      setUpdatingReturnId(null);
    }
  };

  const groupedOrders = useMemo(() => {
    const running = [];
    const completed = [];
    const returned = [];
    const orderList = orders || [];

    orderList.forEach((order) => {
      const status = (order.current_status || "").trim();

      if (
        status === "Dikembalikan" ||
        status === "Menunggu Persetujuan Retur" ||
        status === "Retur Disetujui" ||
        status === "Retur Ditolak" ||
        !!returnsMeta[order.id]
      ) {
        returned.push(order);
      } else if (status === "Pesanan Selesai") {
        completed.push(order);
      } else {
        running.push(order);
      }
    });

    return { running, completed, returned };
  }, [orders, returnsMeta]);

  const currentDisplayList = useMemo(() => {
    if (activeTab === "completed") return groupedOrders.completed;
    if (activeTab === "returned") return groupedOrders.returned;
    return groupedOrders.running;
  }, [activeTab, groupedOrders]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Dikembalikan":
      case "Retur Ditolak":
      case "Ditolak":
        return "bg-red-50 text-red-700 border border-red-200/50";
      case "Pesanan Selesai":
      case "Retur Disetujui":
      case "Disetujui":
      case "Selesai":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
      case "Sedang Dikirim":
        return "bg-amber-50 text-amber-700 border border-amber-200/50";
      case "Menunggu Pengirim":
      case "Menunggu Persetujuan Retur":
      case "Diajukan":
        return "bg-blue-50 text-blue-700 border border-blue-200/50";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200/50";
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-[#0D241F] tracking-tight">
            Manajemen Semua Pesanan Toko
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Pantau ringkasan logistik, validasi pembayaran, dan atur pemenuhan
            pesanan konsumen.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
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
          Selesai ({groupedOrders.completed.length})
        </button>
        <button
          onClick={() => setActiveTab("returned")}
          className={`px-5 py-3 text-xs font-black transition-all border-b-2 uppercase tracking-wider bg-transparent cursor-pointer ${
            activeTab === "returned"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-400 hover:text-red-500"
          }`}
        >
          Pengembalian Retur ({groupedOrders.returned.length})
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
        {currentDisplayList.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-300 rounded-full flex items-center justify-center text-xs font-mono mb-3">
              0
            </div>
            <p className="text-slate-400 text-xs font-bold tracking-wide">
              {activeTab === "running" &&
                "Tidak ada pesanan masuk dalam manifes pemrosesan kemas atau kurir saat ini."}
              {activeTab === "completed" &&
                "Belum ditemukan adanya catatan riwayat transaksi nota yang telah sukses diselesaikan."}
              {activeTab === "returned" &&
                "Bagus! Tidak ada ajuan berkas kasus barang retur yang dikembalikan pembeli saat ini."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentDisplayList.map((order) => {
              const itemsArray = order.order_items || [];
              const firstItem = itemsArray[0] || {};
              const productMaster = firstItem.products || {};

              const firstItemName =
                productMaster.product_name ||
                firstItem.product_name ||
                firstItem.name ||
                (itemsArray.length > 0
                  ? `Paket Pesanan (${itemsArray.length} Item)`
                  : "Produk Eksklusif Seapedia");

              const displayImage = parseImageUrl(
                productMaster.image_url || firstItem.image_url,
              );
              const totalQty =
                itemsArray.reduce((sum, i) => sum + (i.quantity || 0), 0) ||
                order.quantity ||
                1;
              const isPacking =
                (order.current_status || "").trim() === "Sedang Dikemas";
              const matchedReturnRow = returnsMeta[order.id];

              return (
                <div
                  key={order.id}
                  className={`p-5 rounded-xl border flex flex-col gap-4 transition ${
                    activeTab === "returned"
                      ? "bg-red-50/10 border-red-100 hover:border-red-200"
                      : "bg-[#F8F9FA] border-slate-200/60 hover:border-emerald-600/30 hover:bg-white"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-14 h-14 bg-white border border-slate-200/60 rounded-xl overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-3xs">
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
                        </div>

                        <p className="text-[10px] text-slate-400 font-mono mt-1.5 uppercase tracking-wider font-semibold">
                          Nota ID: #{order.id?.slice(0, 8).toUpperCase()}...
                          {order.id?.slice(-4).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2.5 w-full md:w-auto border-t md:border-none border-slate-200/60 pt-3 md:pt-0 shrink-0">
                      <span
                        className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getStatusBadgeStyle(activeTab === "returned" && matchedReturnRow ? matchedReturnRow.status : order.current_status)}`}
                      >
                        {activeTab === "returned" && matchedReturnRow
                          ? `Status: ${matchedReturnRow.status || "Diajukan"}`
                          : order.current_status || "Sedang Dikemas"}
                      </span>

                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => navigate(`/seller/orders/${order.id}`)}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-[#0D241F] hover:bg-slate-50 text-[11px] font-bold rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          Detail Invoice
                        </button>

                        {activeTab === "returned" && matchedReturnRow ? (
                          <select
                            disabled={updatingReturnId === matchedReturnRow.id}
                            value={matchedReturnRow.status || "Diajukan"}
                            onChange={(e) =>
                              handleUpdateReturnStatus(
                                matchedReturnRow.id,
                                e.target.value,
                              )
                            }
                            className="bg-slate-900 border border-slate-800 text-white text-[11px] font-bold py-2 px-3 rounded-lg outline-none cursor-pointer focus:border-red-500 transition shadow-2xs"
                          >
                            {/* 🚀 PERBAIKAN: Hanya munculkan opsi Diajukan jika status database memang sedang Diajukan, tapi hapus opsi ini dari pilihan interaktif manual */}
                            {matchedReturnRow.status === "Diajukan" && (
                              <option value="Diajukan">Diajukan</option>
                            )}
                            <option value="Disetujui">Disetujui</option>
                            <option value="Ditolak">Ditolak</option>
                            <option value="Selesai">Selesai</option>
                          </select>
                        ) : activeTab === "running" && isPacking ? (
                          <button
                            disabled={loadingOrderId !== null}
                            onClick={() => handleUpdateOrderStatus(order.id)}
                            className="px-4 py-2 bg-[#0D241F] hover:bg-emerald-950 text-white text-[11px] font-bold rounded-lg transition cursor-pointer border-none shadow-sm disabled:opacity-40 whitespace-nowrap"
                          >
                            {loadingOrderId === order.id
                              ? "Memproses..."
                              : "Siap Kirim"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {activeTab === "returned" && matchedReturnRow && (
                    <div className="bg-red-50/30 rounded-xl p-3.5 border border-red-100/60 w-full">
                      <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">
                        Alasan Komplain Konsumen (order_returns):
                      </p>
                      <p className="text-xs text-slate-600 mt-1 italic font-medium leading-relaxed">
                        "{matchedReturnRow.reason}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
