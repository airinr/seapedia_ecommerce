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

        // 🚀 DISESUAIKAN: Menggunakan buyer_id dan melakukan JOIN dengan tabel order_items
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            *,
            order_items (*)
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
    <div className="min-h-screen bg-[#FDFDFD] text-[#23263B] font-sans antialiased">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 p-4 shadow-xs">
        <div className="container mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/settings")}
            className="text-slate-400 hover:text-[#0D241F] transition text-xl font-bold bg-transparent border-none cursor-pointer"
          >
            ⬅
          </button>
          <h1 className="text-lg font-black text-[#0D241F] uppercase tracking-widest">
            Riwayat Pesanan Saya
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">
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
              // Hitung total kuantitas item dari tabel relasi order_items
              const totalItemsCount =
                order.order_items?.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                ) || 0;
              // Ambil nama produk pertama untuk ditampilkan sebagai ringkasan utama teks kartu
              const firstItemName =
                order.order_items?.[0]?.product_name || "Produk Eksklusif";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200/60 rounded-[28px] overflow-hidden shadow-xs hover:border-emerald-200 transition"
                >
                  {/* Bagian Atas: Header Pesanan */}
                  <div className="bg-[#F8F9FA] px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Order ID
                      </p>
                      <p className="font-mono text-sm font-black text-[#0D241F]">
                        ...{order.id.slice(-8)}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
                          Tanggal
                        </p>
                        <p className="text-xs font-bold text-slate-700">
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
                        <p className="font-mono text-sm font-black text-emerald-700">
                          {/* 🚀 DISESUAIKAN: Menggunakan final_total dari properti skema database baru */}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(order.final_total)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Bawah: Detail & Status */}
                  <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 text-emerald-700 border border-emerald-100">
                        📦
                      </div>
                      <div className="min-w-0 flex-1">
                        {/* Menampilkan rangkuman nama produk item pertama dan jumlah item lainnya */}
                        <h4 className="font-black text-[#0D241F] text-base truncate">
                          {firstItemName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          Total kuantitas: {totalItemsCount} Pcs{" "}
                          {order.order_items?.length > 1 &&
                            `(+ ${order.order_items.length - 1} produk lainnya)`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Gudang Merchant: ...
                          {order.store_id?.toString().slice(-6)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 w-full sm:w-auto shrink-0">
                      {/* 🚀 DISESUAIKAN: Menyesuaikan pemetaan nama enum database berhuruf kecil kustom */}
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${
                          order.current_status === "selesai"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.current_status === "dikemas"
                              ? "bg-amber-100 text-amber-800"
                              : order.current_status === "dikirim"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        Status: {order.current_status || "pending"}
                      </span>

                      <button
                        onClick={() =>
                          alert(
                            `Fitur pelacakan pengiriman kurir untuk resi order ${order.id} sedang diverifikasi oleh driver.`,
                          )
                        }
                        className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-[#0D241F] text-[#0D241F] rounded-xl font-bold text-xs hover:bg-[#0D241F] hover:text-white transition cursor-pointer"
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
      </main>
    </div>
  );
}
