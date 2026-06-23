/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function AdminVoucherDashboard() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Voucher"); // "Voucher" atau "Promo"

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🔄 AMBIL DATA: Hanya mengambil data dari basis data Supabase
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
    } catch (err) {
      console.error("Gagal memuat data diskon:", err.message);
      toast.error("Gagal memuat data diskon");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // 🚀 TAMBAH DATA: Murni menyimpan ke Supabase tanpa menulis ke local storage
  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!code || !discount || !usageLimit || !expiryDate) return;

    try {
      setSubmitLoading(true);
      const newVoucher = {
        code: code.toUpperCase().trim(),
        type: activeTab,
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

      if (error) throw error;

      if (data) {
        setVouchers([data, ...vouchers]);
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error("Gagal membuat: " + err.message);
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

  // 🗑️ HAPUS DATA: Murni menghapus dari Supabase tanpa menyentuh local storage
  const deleteVoucher = async (id) => {
    if (!confirm("Hapus data ini secara permanen dari basis data?")) return;
    try {
      const { error } = await supabase.from("discounts").delete().eq("id", id);
      if (error) throw error;

      setVouchers(vouchers.filter((v) => v.id !== id));
    } catch (err) {
      toast.error("Gagal menghapus data: " + err.message);
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    return v.type === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-[#0D241F]">
            Manajemen Voucher & Promo
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Kontrol penuh voucher platform dan promosi spesial langsung dari
            database.
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
          Tambah {activeTab === "Voucher" ? "Voucher" : "Promo"} Baru
        </button>
      </div>

      {/* Rantai Tabs Menu */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("Voucher")}
          className={`px-6 py-3 text-xs font-black transition-all border-b-2 ${
            activeTab === "Voucher"
              ? "border-[#0D241F] text-[#0D241F]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          } cursor-pointer bg-transparent`}
        >
          VOUCHER
        </button>
        <button
          onClick={() => setActiveTab("Promo")}
          className={`px-6 py-3 text-xs font-black transition-all border-b-2 ${
            activeTab === "Promo"
              ? "border-[#0D241F] text-[#0D241F]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          } cursor-pointer bg-transparent`}
        >
          PROMO
        </button>
      </div>

      {/* List Rendering Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <h3 className="text-sm font-bold text-[#0D241F]">
            Belum ada {activeTab}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Mulai dengan membuat {activeTab} pertama untuk platform.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((v) => {
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
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${activeTab === "Voucher" ? "text-emerald-600 bg-emerald-50" : "text-blue-600 bg-blue-50"}`}
                    >
                      {activeTab}
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
                      {new Date(v.expiry_date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Popup Input */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0D241F]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-xl">
            <h2 className="text-xl font-black text-[#0D241F] mb-6">
              Buat {activeTab === "Voucher" ? "Voucher" : "Promo"} Baru
            </h2>
            <form onSubmit={handleCreateVoucher} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Kode {activeTab}
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={`MISAL: ${activeTab === "Voucher" ? "DISKONBARU" : "PROMOAKHIRTAHUN"}`}
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
                    placeholder="100"
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
                  {submitLoading ? "Menyimpan..." : `Simpan ${activeTab}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
