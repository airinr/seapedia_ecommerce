import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function StoreDiscounts() {
  const { store } = useOutletContext();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchVouchers = async () => {
    if (!store?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (error) {
        const localVouchers = JSON.parse(
          localStorage.getItem(`vouchers_${store.id}`) || "[]",
        );
        setVouchers(localVouchers);
      } else {
        setVouchers(data || []);
      }
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      toast.error("Gagal memuat voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVouchers();
  }, [store?.id]);

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!code || !discount || !usageLimit || !expiryDate) return;

    try {
      setSubmitLoading(true);
      const newVoucher = {
        store_id: store.id,
        code: code.toUpperCase().trim(),
        type: "FIXED_AMOUNT",
        value_amount: Number(discount),
        remaining_usage: Number(usageLimit),
        expiry_date: new Date(expiryDate).toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("discounts")
        .insert([newVoucher])
        .select()
        .single();

      if (error) {
        const localVouchers = JSON.parse(
          localStorage.getItem(`vouchers_${store.id}`) || "[]",
        );
        // eslint-disable-next-line react-hooks/purity
        const voucherWithId = { ...newVoucher, id: `local_${Date.now()}` };
        const updatedVouchers = [voucherWithId, ...localVouchers];
        localStorage.setItem(
          `vouchers_${store.id}`,
          JSON.stringify(updatedVouchers),
        );
        setVouchers(updatedVouchers);
      } else {
        setVouchers([data, ...vouchers]);
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error("Gagal membuat voucher: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setCode("");
    setDiscount("");
    setUsageLimit("");
    setExpiryDate("");
  };

  const deleteVoucher = async (id) => {
    if (!confirm("Hapus voucher ini?")) return;
    try {
      const { error } = await supabase.from("discounts").delete().eq("id", id);
      if (error) {
        const updatedVouchers = vouchers.filter((v) => v.id !== id);
        localStorage.setItem(
          `vouchers_${store.id}`,
          JSON.stringify(updatedVouchers),
        );
        setVouchers(updatedVouchers);
      } else {
        setVouchers(vouchers.filter((v) => v.id !== id));
      }
    } catch (err) {
      toast.error("Gagal menghapus voucher");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#0D241F]">Diskon Toko</h1>
          <p className="text-xs text-slate-400 font-medium">
            Kelola voucher dan promosi toko Anda
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0D241F] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-950 transition border-none cursor-pointer flex items-center gap-2"
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
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Buat Voucher Baru
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-300"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-[#0D241F]">
            Belum ada voucher
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Mulai dengan membuat voucher promosi pertama Anda
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((v) => {
            const isExpired = new Date(v.expiry_date) < new Date();
            const isFull = (v.remaining_usage ?? 0) <= 0;
            return (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden"
              >
                {(isExpired || isFull) && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-2 py-1 font-black uppercase">
                    {isExpired ? "Kedaluwarsa" : "Kuota Habis"}
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                      Kode Voucher
                    </span>
                    <h3 className="text-lg font-black text-[#0D241F] mt-1">
                      {v.code}
                    </h3>
                  </div>
                  <button
                    onClick={() => deleteVoucher(v.id)}
                    className="text-slate-300 hover:text-red-500 transition cursor-pointer bg-transparent border-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Nominal Potongan
                    </span>
                    <span className="text-sm font-black text-[#0D241F]">
                      Rp {Number(v.value_amount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Sisa Kuota
                    </span>
                    <span className="text-sm font-black text-[#0D241F]">
                      {v.remaining_usage ?? 0} Kali
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Berakhir Pada
                    </span>
                    <span className="text-sm font-black text-[#0D241F]">
                      {new Date(v.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-[#0D241F]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-[#0D241F] mb-6">
              Buat Voucher Baru
            </h2>
            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Kode Voucher
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="MISAL: RAMADAN2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none transition uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Potongan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="10000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Kuota
                  </label>
                  <input
                    type="number"
                    required
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Tanggal Kedaluwarsa
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold focus:bg-white focus:border-emerald-600 outline-none transition"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:bg-slate-50 transition cursor-pointer bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-3 bg-[#0D241F] text-white rounded-xl text-xs font-black hover:bg-emerald-950 transition cursor-pointer border-none shadow-sm disabled:bg-slate-300"
                >
                  {submitLoading ? "Menyimpan..." : "Simpan Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
