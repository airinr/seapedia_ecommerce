/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";
import toast from "react-hot-toast";

export default function UserSettings() {
  const navigate = useNavigate();
  const { user, activeRole, setActiveRole, loading: roleLoading } = useRole();

  // =========================================================================
  // 💡 1. DEKLARASI HOOKS UTAMA
  // =========================================================================
  const email = user?.email || "";
  const fullName = user?.user_metadata?.full_name || "";
  const names = fullName.split(" ");
  const derivedFirstName = names[0] || "";
  const derivedLastName = names.slice(1).join(" ") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  // State untuk menampung alamat dan nomor telepon sesuai skema tabel profiles
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  // State dropdown wilayah (API emsifa)
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [loadingAddress, setLoadingAddress] = useState(false);

  const selectedProvinceName = provinces.find((p) => p.id === selectedProvince)?.name || "";
  const selectedCityName = cities.find((c) => c.id === selectedCity)?.name || "";
  const selectedDistrictName = districts.find((d) => d.id === selectedDistrict)?.name || "";
  const fullAddress = [detailAddress, selectedDistrictName, selectedCityName, selectedProvinceName].filter(Boolean).join(", ");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // =========================================================================
  // 🔄 2. SINKRONISASI DATA DAN FETCH PROFIL DARI TABEL PROFILES SUPABASE
  // =========================================================================
  useEffect(() => {
    async function loadProfileData() {
      if (!roleLoading && user) {
        setFirstName(derivedFirstName);
        setLastName(derivedLastName);

        try {
          // Ambil data alamat, telepon, dan saldo e-wallet asli dari tabel profiles
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("delivery_address, phone_number, wallet_balance")
            .eq("id", user.id)
            .maybeSingle();

          if (error) throw error;

          if (profile) {
            setDeliveryAddress(profile.delivery_address || "");
            setDetailAddress(profile.delivery_address || "");
            setPhoneNumber(profile.phone_number || "");
            setWalletBalance(profile.wallet_balance || 0);
          }

          // Fetch daftar provinsi
          const provRes = await fetch(
            "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json",
          );
          setProvinces(await provRes.json());
        } catch (err) {
          console.error("Gagal mengambil data profiles:", err.message);
          toast.error("Gagal memuat data profil");
        }
      }
    }

    loadProfileData();
  }, [roleLoading, user, derivedFirstName, derivedLastName]);

  // Logika auto-redirect khusus Seller, Admin, & Driver
  useEffect(() => {
    if (!roleLoading && activeRole === "Seller") {
      navigate("/seller/dashboard");
    } else if (!roleLoading && activeRole === "Admin") {
      navigate("/admin/vouchers");
    } else if (!roleLoading && activeRole === "Driver") {
      navigate("/driver/dashboard");
    }
  }, [activeRole, roleLoading, navigate]);

  useEffect(() => {
    if (!selectedProvince) return;
    setLoadingAddress(true);
    setSelectedCity("");
    setSelectedDistrict("");
    setCities([]);
    setDistricts([]);
    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince}.json`,
    )
      .then((r) => r.json())
      .then((data) => setCities(data))
      .finally(() => setLoadingAddress(false));
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedCity) return;
    setLoadingAddress(true);
    setSelectedDistrict("");
    setDistricts([]);
    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity}.json`,
    )
      .then((r) => r.json())
      .then((data) => setDistricts(data))
      .finally(() => setLoadingAddress(false));
  }, [selectedCity]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  // =========================================================================
  // FUNGSI UPDATE DATA PROFIL & ALAMAT KE SUPABASE (UPSERT)
  // =========================================================================
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const combinedName = `${firstName} ${lastName}`.trim();

      // A. Update metadata nama di auth bawaan Supabase
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: combinedName },
      });
      if (authError) throw authError;

      // B. Jalankan Upsert data profil
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: combinedName,
          delivery_address: fullAddress.trim(),
          phone_number: phoneNumber.trim(),
        },
        { onConflict: "id" },
      );

      if (profileError) throw profileError;

      setSuccessMsg("Perubahan profil berhasil disimpan!");
      toast.success("Profil dan alamat pengiriman Anda sukses diperbarui!");
    } catch (error) {
      setErrorMsg(error.message);
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchRole = async (newRole) => {
    if (activeRole === newRole) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("user_roles")
        .upsert([{ user_id: user.id, role: newRole }], {
          onConflict: "user_id",
        });

      if (error) throw error;
      if (setActiveRole) setActiveRole(newRole);

      toast.success(
        `Selamat! Peran Anda kini telah diubah menjadi ${newRole}.`,
      );
      if (newRole !== "Seller") {
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      {/* WARNING BANNER JIKA ALAMAT MASIH KOSONG */}
      {!fullAddress.trim() && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-center animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-xl">⚠️</span>
          <div className="text-xs">
            <p className="font-extrabold text-amber-900">
              Alamat Pengiriman Belum Ditambahkan
            </p>
            <p className="text-amber-700/90 mt-0.5">
              Anda wajib melengkapi kolom alamat di bawah sebelum dapat
              melakukan proses checkout belanja di Seapedia.
            </p>
          </div>
        </div>
      )}

      {/* JUDUL HALAMAN UTAMA */}
      <div className="mb-8">
        <h1 className="text-xl font-black text-[#0D241F] tracking-tight">
          Pengaturan Pengguna
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">
          Kelola preferensi akun dan data informasi profil Anda.
        </p>
      </div>

      <div className="flex gap-6 border-b border-slate-200 pb-3 text-xs font-bold text-slate-400 mb-6">
        <span className="text-[#0D241F] border-b-2 border-[#0D241F] pb-3 cursor-pointer">
          Profil Akun
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* PERSONAL INFORMATION FORM */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-xs text-[#0D241F] uppercase tracking-wider border-b border-slate-50 pb-2">
              Informasi Pribadi
            </h3>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    Nama Depan
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    Nama Belakang
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full bg-slate-100/70 border border-slate-200 text-slate-400 rounded-xl py-2.5 px-4 text-xs font-medium cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Alamat Pengiriman (Rumah)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div className="relative">
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 pl-3 pr-8 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition appearance-none cursor-pointer"
                    >
                      <option value="">Pilih Provinsi</option>
                      {provinces
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={!selectedProvince || loadingAddress}
                      className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 pl-3 pr-8 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition appearance-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Kota/Kabupaten</option>
                      {cities
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedCity || loadingAddress}
                      className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 pl-3 pr-8 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition appearance-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Kecamatan</option>
                      {districts
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="Masukkan nama jalan, nomor rumah/gedung, RT/RW, patokan"
                  className={`w-full border rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition ${
                    !fullAddress.trim()
                      ? "bg-amber-50/40 border-amber-300"
                      : "bg-[#F8F9FA] border-slate-200"
                  }`}
                />
                {fullAddress.trim() && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Cek di Google Maps
                  </a>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer border-none bg-transparent"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer disabled:bg-slate-300 border-none"
                >
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>

          {/* ROLE SWITCHER */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-xs text-[#0D241F] uppercase tracking-wider border-b border-slate-50 pb-2">
                Pengubah Peran Akun
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Pilih peran kustom untuk beralih fungsi dasbor akun secara
                langsung.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {["Buyer", "Seller", "Driver"].map((role) => {
                const isActive = activeRole === role;

                let roleLabelIndo = role;
                if (role === "Buyer") roleLabelIndo = "Pembeli";
                if (role === "Seller") roleLabelIndo = "Penjual";
                if (role === "Driver") roleLabelIndo = "Kurir";

                return (
                  <div
                    key={role}
                    onClick={() =>
                      role === "Seller"
                        ? navigate("/register-seller")
                        : role === "Driver"
                          ? navigate("/register-driver")
                          : handleSwitchRole(role)
                    }
                    className={`p-4 rounded-xl border text-center relative transition cursor-pointer ${
                      isActive
                        ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 font-bold"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <h4 className="text-xs font-extrabold uppercase tracking-wide py-2">
                      {roleLabelIndo}
                    </h4>
                    {isActive && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider">
                        Aktif
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDE CARD PROFILE PREVIEW */}
        {/* 🚀 PERBAIKAN: Menghapus kontainer foto profil (Avatar) agar terlihat minimalis */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs text-center flex flex-col items-center">
            <h3 className="font-extrabold text-sm text-[#0D241F] mt-2">
              {firstName || derivedFirstName}{" "}
              {lastName || derivedLastName || "User"}
            </h3>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
              {activeRole === "Buyer"
                ? "Pembeli"
                : activeRole === "Seller"
                  ? "Penjual"
                  : activeRole === "Driver"
                    ? "Kurir"
                    : activeRole}
            </p>

            {/* MINI CARD SALDO E-WALLET */}
            <div className="mt-4 w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
                Saldo Seapedia Pay
              </span>
              <span className="font-mono text-sm font-black text-emerald-700 block mt-0.5">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(walletBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
