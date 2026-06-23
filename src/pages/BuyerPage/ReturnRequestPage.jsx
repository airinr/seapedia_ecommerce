/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";
import toast from "react-hot-toast";

export default function ReturnRequestPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useRole();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            *,
            order_items (
              product_name,
              quantity,
              price
            ),
            stores:store_id (
              store_name
            )
          `,
          )
          .eq("id", orderId)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error("Gagal memuat pesanan:", err.message);
        setError(err.message);
        toast.error("Gagal memuat data pesanan");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Harap masukkan alasan pengembalian.");
      return;
    }

    if (!user?.id) {
      toast.error("Sesi login Anda tidak ditemukan.");
      return;
    }

    if (
      !confirm(
        "Apakah Anda yakin ingin mengajukan pengembalian untuk pesanan ini?",
      )
    )
      return;

    try {
      setSubmitting(true);

      // 🚀 PERBAIKAN: Mengubah status target kembali menjadi "Dikembalikan" sesuai Enum database
      const targetStatus = "Dikembalikan";

      // 1. SIMPAN DETAIL ALASAN PENGEMBALIAN KE TABEL KUSTOM order_returns
      const { error: returnTableError } = await supabase
        .from("order_returns")
        .insert([
          {
            order_id: orderId,
            buyer_id: user.id,
            reason: reason.trim(),
            refund_amount: Number(order.final_total || 0),
            status: "Diajukan",
          },
        ]);

      if (returnTableError) throw returnTableError;

      // 2. PERBARUI STATUS UTAMA MANIFEST PESANAN DI TABEL ORDERS MENJADI "Dikembalikan"
      const { error: updateError } = await supabase
        .from("orders")
        .update({ current_status: targetStatus })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // 3. AMBIL DATA PROFIL DRIVER JIKA SUDAH PERNAH DIKAITKAN
      let historyDriverPayload = {};
      if (order.driver_id) {
        const { data: driverProfile } = await supabase
          .from("profiles")
          .select("full_name, phone_number")
          .eq("id", order.driver_id)
          .maybeSingle();

        if (driverProfile) {
          historyDriverPayload = {
            driver_name: driverProfile.full_name,
            driver_phone: driverProfile.phone_number,
          };
        }
      }

      // 4. CATAT LOG MANIFEST PENGEMBALIAN KE TABEL order_status_histories
      const { error: historyError } = await supabase
        .from("order_status_histories")
        .insert([
          {
            order_id: orderId,
            status: targetStatus,
            changed_by: user.id,
            ...historyDriverPayload,
          },
        ]);

      if (historyError) throw historyError;

      toast.success("Pengajuan pengembalian berhasil dikirim.");
      navigate("/orders");
    } catch (err) {
      toast.error("Gagal mengajukan pengembalian: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error && !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <h2 className="text-xl font-black text-red-600">Gagal Memuat Pesanan</h2>
        <p className="text-slate-400 text-xs mt-1 mb-4">{error}</p>
        <button onClick={() => navigate("/orders")} className="bg-[#0D241F] text-white px-6 py-2.5 rounded-xl text-xs font-bold border-none hover:bg-emerald-950 transition cursor-pointer">Kembali ke Pesanan Saya</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <h2 className="text-xl font-black text-[#0D241F]">
          Pesanan Tidak Ditemukan
        </h2>
        <button
          onClick={() => navigate("/orders")}
          className="mt-4 text-emerald-600 font-bold bg-transparent border-none cursor-pointer"
        >
          Kembali ke Pesanan Saya
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-slate-400 hover:text-[#0D241F] transition mb-4 bg-transparent border-none cursor-pointer font-bold text-xs uppercase tracking-widest"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Kembali
        </button>
        <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
          Ajukan Pengembalian
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Silakan isi detail alasan pengembalian barang Anda.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-2xs space-y-6">
        {/* Informasi Ringkas Nota Pesanan */}
        <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Informasi Rincian Pesanan
          </p>
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <p className="text-xs font-black text-[#0D241F]">
                ID Nota: #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Nama Toko: {order.stores?.store_name || "Mitra Seapedia"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm font-black text-emerald-800 font-mono">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(order.final_total)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                {order.order_items?.length || 0} Jenis Produk
              </p>
            </div>
          </div>
        </div>

        {/* Formulir Pengisian Alasan */}
        <form onSubmit={handleSubmitReturn} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">
              Alasan Utama Pengembalian
            </label>
            <textarea
              required
              rows="5"
              placeholder="Berikan deskripsi alasan Anda (contoh: isi paket pecah, ukuran produk salah, atau barang malfungsi)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:bg-white focus:border-emerald-600 border-box outline-none transition resize-none leading-relaxed text-[#0D241F]"
            />
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100/70 flex gap-3">
            <span className="text-amber-700 text-sm font-bold">Info:</span>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              Uang Anda akan dikembalikan secara penuh menuju saldo dompet akun
              Seapedia setelah laporan manifes ini divalidasi dan disetujui oleh
              pihak admin atau penjual.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#0D241F] hover:bg-emerald-950 text-white font-black py-4 rounded-2xl shadow-xs transition disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer border-none uppercase tracking-widest text-[10px]"
          >
            {submitting
              ? "Memproses Laporan..."
              : "Kirim Pengajuan Pengembalian"}
          </button>
        </form>
      </div>
    </div>
  );
}
