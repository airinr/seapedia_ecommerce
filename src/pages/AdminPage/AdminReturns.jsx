/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function AdminReturns() {
  const [returnedOrders, setReturnedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);

      // 🚀 DISESUAIKAN: Menggunakan status logistik yang terdaftar resmi di order_status_type (image_50fafc.png)
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles:buyer_id (
            full_name,
            phone_number
          ),
          stores (
            store_name
          ),
          order_returns!inner (
            id,
            reason,
            status,
            refund_amount
          )
        `,
        )
        .in("current_status", [
          "Menunggu Pick-up Retur",
          "Retur Sedang Dikirim",
          "Retur Selesai",
          "Dikembalikan",
        ])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReturnedOrders(data || []);
    } catch (err) {
      console.error("Gagal memuat pesanan retur:", err.message);
      toast.error("Gagal memuat pesanan retur");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefund = async (order) => {
    if (
      !confirm(
        `Proses refund sebesar Rp ${Number(order.final_total).toLocaleString()} ke dompet ${order.profiles?.full_name}?`,
      )
    )
      return;

    try {
      setLoading(true);

      // 1. Ambil saldo saat ini
      const { data: profile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", order.buyer_id)
        .single();

      if (profileFetchError) throw profileFetchError;

      const newBalance =
        (profile.wallet_balance || 0) + Number(order.final_total);

      // 2. Update saldo
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", order.buyer_id);

      if (balanceError) throw balanceError;

      // 3. Catat transaksi
      await supabase.from("wallet_transactions").insert([
        {
          user_id: order.buyer_id,
          type: "REFUND",
          amount: Number(order.final_total),
          description: `Refund pesanan #${order.id.slice(0, 8)}`,
        },
      ]);

      // 4. Update status pesanan ke status akhir yang valid di enum (Dikembalikan)
      const targetStatus = "Dikembalikan";
      await supabase
        .from("orders")
        .update({ current_status: targetStatus })
        .eq("id", order.id);

      // 5. Update status di order_returns menjadi 'Selesai' sesuai return_status_type (image_50fafc.png)
      await supabase
        .from("order_returns")
        .update({ status: "Selesai" })
        .eq("order_id", order.id);

      await supabase.from("order_status_histories").insert([
        {
          order_id: order.id,
          status: targetStatus,
          changed_by: "ADMIN",
        },
      ]);

      toast.success("Refund berhasil diproses!");
      fetchReturns();
    } catch (err) {
      toast.error("Gagal memproses refund: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return (
    <div className="font-poppins space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#0D241F]">
            Pesanan Retur & Batal
          </h1>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Monitoring pesanan yang dikembalikan oleh pembeli atau dibatalkan
          </p>
        </div>
        <button
          onClick={fetchReturns}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition cursor-pointer shadow-3xs"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
        </div>
      ) : returnedOrders.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-[32px] p-20 text-center">
          <h3 className="text-lg font-black text-[#0D241F]">Tidak Ada Retur</h3>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Belum ada pesanan yang masuk dalam kategori pengembalian atau
            pembatalan.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Informasi Toko & Buyer
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Komplain Retur
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {returnedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#0D241F]">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono font-bold mt-1">
                          {new Date(order.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            TOKO
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {order.stores?.store_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            BUYER
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {order.profiles?.full_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 max-w-[240px]">
                        <span className="text-xs font-medium text-red-600 bg-red-50/60 px-2 py-1 rounded-lg border border-red-100/40">
                          "{order.order_returns?.[0]?.reason || "-"}"
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">
                          Status Komplain:{" "}
                          <strong className="text-[#0D241F]">
                            {order.order_returns?.[0]?.status || "-"}
                          </strong>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          order.current_status === "Dikembalikan"
                            ? "bg-red-50 text-red-700 border-red-100"
                            : order.current_status === "Retur Selesai"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}
                      >
                        {order.current_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.current_status === "Retur Selesai" ||
                      order.current_status === "Retur Disetujui" ? (
                        <button
                          onClick={() => handleRefund(order)}
                          className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition cursor-pointer border-none uppercase tracking-widest shadow-xs"
                        >
                          Proses Refund
                        </button>
                      ) : (
                        <span className="text-xs font-black text-slate-700 font-mono">
                          Rp {Number(order.final_total).toLocaleString("id-ID")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
