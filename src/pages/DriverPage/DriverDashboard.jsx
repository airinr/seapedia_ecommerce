/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";
import toast from "react-hot-toast";

export default function DriverDashboard() {
  const { user } = useRole();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("normal"); // 'normal' atau 'retur'

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchDriverOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      let data = [];
      let error = null;

      if (activeTab === "normal") {
        // 📦 TAB NORMAL: Mengambil pesanan reguler
        const response = await supabase
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
            ),
            stores (
              store_name,
              address
            ),
            profiles:buyer_id (
              full_name,
              delivery_address,
              phone_number
            )
          `,
          )
          .or(
            `current_status.eq.Menunggu Pengirim,` +
              `and(current_status.eq.Sedang Dikirim,driver_id.eq.${user.id})`,
          )
          .order("created_at", { ascending: false });

        data = response.data;
        error = response.error;
      } else {
        // 🔄 TAB RETUR: Mengambil pesanan dengan komplain retur yang statusnya 'Disetujui'
        const { data: returnsData, error: returnsError } = await supabase
          .from("order_returns")
          .select("order_id, status, reason")
          .eq("status", "Disetujui");

        if (returnsError) throw returnsError;

        if (!returnsData || returnsData.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const approvedOrderIds = returnsData.map((r) => r.order_id);

        // 🚀 PERBAIKAN STRUKTUR FILTER: Memisahkan penulisan logic OR dan AND agar valid dibaca PostgREST Supabase
        const response = await supabase
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
            ),
            stores (
              store_name,
              address
            ),
            profiles:buyer_id (
              full_name,
              delivery_address,
              phone_number
            )
          `,
          )
          .in("id", approvedOrderIds)
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false });

        if (response.data) {
          // Singkronisasi data reasons komplain ke objek orders utama untuk mapping UI
          data = response.data.map((order) => {
            const matchedReturn = returnsData.find(
              (r) => r.order_id === order.id,
            );
            return {
              ...order,
              order_returns: matchedReturn ? [matchedReturn] : [],
            };
          });
        }
        error = response.error;
      }

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Gagal memuat pesanan driver:", err.message);
      toast.error("Gagal memuat pesanan: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    if (user?.id) {
      fetchDriverOrders();
    }
  }, [user?.id, fetchDriverOrders]);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    try {
      setActionLoading(orderId);
      let nextStatus = "";
      let updatePayload = {};
      let isFinalizingReturn = false;

      // Alur Logistik Normal
      if (currentStatus === "Menunggu Pengirim") {
        nextStatus = "Sedang Dikirim";
        updatePayload = { current_status: nextStatus, driver_id: user.id };
      } else if (currentStatus === "Sedang Dikirim") {
        nextStatus = "Pesanan Selesai";
        updatePayload = { current_status: nextStatus };
      }
      // Alur Logistik Retur
      else if (activeTab === "retur" && currentStatus !== "Retur Sedang Dikirim") {
        nextStatus = "Retur Sedang Dikirim";
        updatePayload = { current_status: nextStatus, driver_id: user.id };
      } else if (currentStatus === "Retur Sedang Dikirim") {
        nextStatus = "Retur Selesai";
        updatePayload = { current_status: nextStatus };
        isFinalizingReturn = true;
      }

      if (!nextStatus) return;

      const { data: driverProfile, error: driverProfileError } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", user.id)
        .maybeSingle();

      if (driverProfileError) throw driverProfileError;

      // 🔄 1. Update status utama pada tabel orders
      const { error: updateOrderError } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", orderId);

      if (updateOrderError) throw updateOrderError;

      // 🔄 2. Jika proses retur selesai, perbarui status di tabel order_returns
      if (isFinalizingReturn) {
        const { error: updateReturnError } = await supabase
          .from("order_returns")
          .update({ status: "Selesai" })
          .eq("order_id", orderId);

        if (updateReturnError) throw updateReturnError;
      }

      // 🚀 3. Masukkan data log historis status pesanan
      const { error: historyError } = await supabase
        .from("order_status_histories")
        .insert([
          {
            order_id: orderId,
            status: nextStatus,
            changed_by: user.id,
            driver_name:
              driverProfile?.full_name ||
              user.user_metadata?.full_name ||
              "Kurir Seapedia",
            driver_phone: driverProfile?.phone_number || "-",
          },
        ]);

      if (historyError) throw historyError;

      toast.success(`Status pesanan diperbarui ke: ${nextStatus}`);
      fetchDriverOrders();
    } catch (err) {
      toast.error("Gagal memperbarui status: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="font-poppins space-y-6 max-w-5xl mx-auto p-4 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
            Tugas Pengiriman Logistik
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Kelola manifestasi pengambilan barang di toko penjual dan drop-off
            paket ke alamat konsumen Seapedia.
          </p>
        </div>
        <button
          onClick={fetchDriverOrders}
          disabled={loading}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer shadow-3xs disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab("normal")}
          className={`pb-3 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer px-1 ${
            activeTab === "normal"
              ? "border-[#0D241F] text-[#0D241F]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Pengiriman Normal
        </button>
        <button
          onClick={() => setActiveTab("retur")}
          className={`pb-3 text-xs font-black tracking-wide uppercase border-b-2 transition-all cursor-pointer px-1 ${
            activeTab === "retur"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Pengambilan Retur
        </button>
      </div>

      {/* DATA VIEW */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center shadow-4xs">
          <h3 className="text-sm font-bold text-[#0D241F]">
            {activeTab === "normal" ? "Normal" : "Retur"} Kosong
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Saat ini belum ada data pesanan yang tersedia di tab ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => {
            const isWaiting = order.current_status === "Menunggu Pengirim";
            const isDelivering = order.current_status === "Sedang Dikirim";
            const isReturnDelivering =
              order.current_status === "Retur Sedang Dikirim";
            const isReturnWaiting =
              activeTab === "retur" && !isReturnDelivering;

            const gmaps = (addr) =>
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr || "")}`;

            let badgeStyle = "bg-blue-50 text-blue-700 border border-blue-100";
            let statusLabel = order.current_status;

            if (isDelivering)
              badgeStyle = "bg-amber-50 text-amber-700 border border-amber-100";
            if (isReturnWaiting) {
              badgeStyle =
                "bg-purple-50 text-purple-700 border border-purple-100";
              statusLabel = "RETUR (DISETUJUI)";
            }
            if (isReturnDelivering)
              badgeStyle = "bg-pink-50 text-pink-700 border border-pink-100";

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row gap-6 transition hover:border-slate-300"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${badgeStyle}`}
                      >
                        {statusLabel}
                      </span>
                      <h3 className="text-xs font-mono font-bold text-slate-400 mt-2.5 uppercase tracking-wide">
                        ID NOTA: #{order.id.slice(0, 8)}...{order.id.slice(-4)}
                      </h3>
                    </div>

                    <div className="text-left md:text-right">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                        {order.delivery_method || "Regular"}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Ongkos Kirim
                      </p>
                      <p className="text-base font-black font-mono text-emerald-700">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(order.delivery_fee || 0)}
                      </p>
                    </div>
                  </div>

                  {/* DAFTAR BARANG */}
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Daftar Barang Manifest:
                    </p>
                    {order.order_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-xs text-[#0D241F]"
                      >
                        <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {item.quantity}x
                        </span>
                        <span className="font-medium">
                          {item.products?.product_name}
                        </span>
                      </div>
                    ))}
                    {activeTab === "retur" && order.order_returns?.[0] && (
                      <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2.5 rounded-xl mt-2 border border-red-100/60">
                        Alasan Komplain: "{order.order_returns[0].reason}"
                      </p>
                    )}
                  </div>

                  {/* ALAMAT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {activeTab === "retur"
                          ? "Alamat Konsumen (Pick-up Retur)"
                          : "Alamat Toko Penjual (Pick-up)"}
                      </p>
                      <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                        <p className="text-xs font-black text-[#0D241F]">
                          {activeTab === "retur"
                            ? order.profiles?.full_name
                            : order.stores?.store_name}
                        </p>
                        {(() => {
                          const addr =
                            activeTab === "retur"
                              ? order.profiles?.delivery_address
                              : order.stores?.address;
                          return addr ? (
                            <a
                              href={gmaps(addr)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block cursor-pointer hover:border-blue-300 transition"
                            >
                              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                                {addr}
                              </p>
                              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                Buka Google Maps
                              </span>
                            </a>
                          ) : (
                            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                              {addr}
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        {activeTab === "retur"
                          ? "Tujuan Pengembalian Toko (Drop-off)"
                          : "Alamat Konsumen (Drop-off)"}
                      </p>
                      <div className="bg-emerald-50/10 p-3.5 rounded-xl border border-emerald-100/40">
                        <p className="text-xs font-black text-[#0D241F]">
                          {activeTab === "retur"
                            ? order.stores?.store_name
                            : order.profiles?.full_name}
                        </p>
                        {(() => {
                          const addr =
                            activeTab === "retur"
                              ? order.stores?.address
                              : order.profiles?.delivery_address;
                          return addr ? (
                            <a
                              href={gmaps(addr)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block cursor-pointer hover:border-emerald-300 transition"
                            >
                              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                                {addr}
                              </p>
                              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                Buka Google Maps
                              </span>
                            </a>
                          ) : (
                            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
                              {addr}
                            </p>
                          );
                        })()}
                        {order.profiles?.phone_number && (
                          <p className="text-[11px] text-emerald-800 font-black mt-1.5 font-mono">
                            No. Telp: {order.profiles.phone_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="md:w-56 flex flex-col justify-center gap-2.5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 shrink-0">
                  {isWaiting && (
                    <button
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleUpdateStatus(order.id, order.current_status)
                      }
                      className="w-full py-3.5 bg-[#0D241F] hover:bg-emerald-950 text-white rounded-xl text-xs font-black transition cursor-pointer border-none shadow-xs disabled:opacity-40"
                    >
                      {actionLoading === order.id
                        ? "Mengunci Paket..."
                        : "Ambil Pesanan"}
                    </button>
                  )}

                  {isDelivering && (
                    <button
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleUpdateStatus(order.id, order.current_status)
                      }
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition cursor-pointer border-none shadow-xs disabled:opacity-40"
                    >
                      {actionLoading === order.id
                        ? "Menyelesaikan..."
                        : "Selesaikan Pengantaran"}
                    </button>
                  )}

                  {isReturnWaiting && (
                    <button
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleUpdateStatus(order.id, order.current_status)
                      }
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition cursor-pointer border-none shadow-xs disabled:opacity-40"
                    >
                      {actionLoading === order.id
                        ? "Memproses Retur..."
                        : "Ambil Barang Retur"}
                    </button>
                  )}

                  {isReturnDelivering && (
                    <button
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleUpdateStatus(order.id, order.current_status)
                      }
                      className="w-full py-3.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black transition cursor-pointer border-none shadow-xs disabled:opacity-40"
                    >
                      {actionLoading === order.id
                        ? "Menyelesaikan..."
                        : "Selesaikan Retur ke Toko"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
