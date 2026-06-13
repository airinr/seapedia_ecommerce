import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";

export default function BuyerOrdersPage() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useRole();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyOrders() {
      if (roleLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
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
              product_name,
              price,
              quantity
            )
          `,
          )
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Gagal memuat pesanan:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMyOrders();
  }, [user, roleLoading]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center">
        <h2 className="text-4xl mb-4">🔐</h2>
        <h1 className="text-2xl font-black text-[#0D241F]">Harap Login</h1>
        <p className="text-slate-400 mt-2 mb-6">
          Anda harus login untuk melihat riwayat pesanan.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#0D241F] text-white px-8 py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-emerald-950 transition shadow-md"
        >
          Ke Halaman Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
            Riwayat Pesanan Saya
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Lacak status pesanan dan pembelian Anda.
          </p>
        </div>
      </div>

      <div className="w-full">
        {orders.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[32px] p-20 text-center flex flex-col items-center">
            <span className="text-6xl block mb-6 opacity-40">🛍️</span>
            <h2 className="text-xl font-black text-[#0D241F] mb-2">
              Belum Ada Pesanan
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              Riwayat belanja Anda masih kosong. Mari temukan barang menarik!
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-[#0D241F] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-950 transition border-none cursor-pointer"
            >
              Mulai Belanja ➔
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const totalItemsCount =
                order.order_items?.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                ) || 0;

              const firstItemName =
                order.order_items?.[0]?.product_name ||
                order.order_items?.[0]?.name ||
                "Produk Eksklusif";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200/60 rounded-[28px] overflow-hidden shadow-xs hover:border-emerald-200 transition"
                >
                  {/* Bagian Atas: Header Pesanan (ID DIHAPUS, MENYISAKAN TANGGAL & NOMINAL) */}
                  <div className="bg-[#F8F9FA] px-6 py-4 flex justify-between items-center gap-4 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Tanggal Transaksi
                      </p>
                      <p className="text-xs font-black text-slate-700 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total Bayar (Bill)
                      </p>
                      <p className="font-mono text-sm font-black text-emerald-700 mt-0.5">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(order.final_total)}
                      </p>
                    </div>
                  </div>

                  {/* Bagian Bawah: Detail & Status */}
                  <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl shrink-0 text-emerald-700 border border-emerald-100">
                        📦
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-[#0D241F] text-base truncate">
                          {firstItemName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          Total kuantitas: {totalItemsCount} Pcs{" "}
                          {order.order_items?.length > 1 &&
                            `(+ ${order.order_items.length - 1} produk lainnya)`}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                          Gudang Merchant: ...
                          {order.store_id?.toString().slice(-6)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full sm:w-auto shrink-0">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${
                          order.current_status === "Pesanan Selesai"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.current_status === "Sedang Dikemas"
                              ? "bg-amber-100 text-amber-800"
                              : order.current_status === "Sedang Dikirim"
                                ? "bg-blue-100 text-blue-800"
                                : order.current_status === "Menunggu Pengirim"
                                  ? "bg-blue-100 text-yellow-900"
                                  : "bg-red-100 text-red-800"
                        }`}
                      >
                        Status: {order.current_status || "pending"}
                      </span>

                      <button
                        onClick={() =>
                          alert(
                            `Status pesanan Anda saat ini adalah [${order.current_status || "Sedang Dikemas"}]. Log perjalanan kurir Seapedia Express akan diperbarui berkala oleh driver.`,
                          )
                        }
                        className="w-full sm:w-auto px-6 py-2 bg-white border-2 border-[#0D241F] text-[#0D241F] rounded-xl font-bold text-xs hover:bg-[#0D241F] hover:text-white transition cursor-pointer shadow-2xs"
                      >
                        Lacak Pesanan
                      </button>
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
