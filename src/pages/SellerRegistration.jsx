import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";

export default function SellerRegistration() {
  const navigate = useNavigate();
  const { user, ownedRoles, setActiveRole } = useRole();

  // State Form
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [address, setAddress] = useState("");

  // State UI
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegisterSeller = async (e) => {
    e.preventDefault();

    // Validasi Keamanan Keberadaan Sesi User
    if (!user?.id) {
      setErrorMsg(
        "Sesi login Anda tidak ditemukan. Silakan masuk akun kembali.",
      );
      return;
    }

    if (ownedRoles?.includes("Seller")) {
      alert("Anda sudah terdaftar sebagai Seller!");
      navigate("/seller/dashboard");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Terapkan Single-Role: Timpa peran lama menjadi Seller menggunakan UPSERT
      const { error: roleError } = await supabase.from("user_roles").upsert(
        [{ user_id: user.id, role: "Seller" }],
        { onConflict: "user_id" }, // Menimpa baris lama jika user_id sudah ada
      );

      if (roleError) throw roleError;

      // 2. Tambahkan data toko ke tabel 'stores'
      const { error: storeError } = await supabase.from("stores").insert([
        {
          owner_id: user.id,
          store_name: shopName,
          description: shopDescription,
          address: address,
        },
      ]);

      if (storeError) throw storeError;

      // 3. Set active role ke Seller di sisi client global state
      if (setActiveRole) {
        setActiveRole("Seller");
      }

      alert(
        "Selamat! Toko Anda berhasil didaftarkan dan peran Anda kini menjadi Seller.",
      );

      // 🚀 Karena menggunakan Single-Role, langsung arahkan ke Dashboard Seller kustom
      navigate("/seller/dashboard");
    } catch (error) {
      setErrorMsg(error.message || "Terjadi kesalahan saat mendaftarkan toko.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-sm">
        <div className="text-center mb-10">
          <span className="text-3xl">🏪</span>
          <h1 className="text-3xl font-black text-[#0D241F] tracking-tight mt-4">
            Buka Toko Seapedia
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Mulai langkah suksesmu sebagai seller premium hari ini.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-4 rounded-2xl mb-6">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegisterSeller} className="space-y-6">
          {/* Nama Toko */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Nama Toko
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Seapedia Official Store"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition duration-200"
            />
          </div>

          {/* Deskripsi Toko */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Deskripsi Singkat
            </label>
            <textarea
              required
              rows="3"
              placeholder="Ceritakan apa yang toko Anda tawarkan..."
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition duration-200 resize-none"
            />
          </div>

          {/* Alamat Toko */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Alamat Pengambilan / Gudang
            </label>
            <input
              type="text"
              required
              placeholder="Alamat lengkap lokasi pengiriman"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition duration-200"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="w-full bg-white border border-slate-200 text-slate-500 font-bold py-3.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D241F] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl shadow-md transition disabled:bg-slate-300 cursor-pointer"
            >
              {loading ? "Mendaftarkan..." : "Daftar Sekarang ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
