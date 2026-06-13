/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";

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

  // 🚀 BARU: State untuk menampung alamat dan nomor telepon sesuai skema tabel profiles
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
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
            setPhoneNumber(profile.phone_number || "");
            setWalletBalance(profile.wallet_balance || 0);
          }
        } catch (err) {
          console.error("Gagal mengambil data profiles:", err.message);
        }
      }
    }

    loadProfileData();
  }, [roleLoading, user, derivedFirstName, derivedLastName]);

  // Logika auto-redirect khusus Seller
  useEffect(() => {
    if (!roleLoading && activeRole === "Seller") {
      navigate("/seller/dashboard");
    }
  }, [activeRole, roleLoading, navigate]);

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
  const handleSaveChanges = async () => {
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

      // B. 💡 GANTI .update() MENJADI .upsert() AGAR JIKA DATA BELUM ADA AKAN DIBUAT BARU
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id, // Wajib menyertakan Primary Key id untuk pengecekan konflik data
          full_name: combinedName,
          delivery_address: deliveryAddress.trim(),
          phone_number: phoneNumber.trim(),
        },
        { onConflict: "id" }, // Jika ID bentrok/sudah ada, lakukan update data saja
      );

      if (profileError) throw profileError;

      setSuccessMsg("Perubahan profil berhasil disimpan!");
      alert("Profil dan alamat pengiriman Anda sukses diperbarui!");
    } catch (error) {
      setErrorMsg(error.message);
      alert(`Gagal menyimpan: ${error.message}`);
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

      alert(`Selamat! Peran Anda kini telah diubah menjadi ${newRole}.`);
      if (newRole !== "Seller") {
        window.location.reload();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      {/* WARNING BANNER JIKA ALAMAT MASIH KOSONG */}
      {!deliveryAddress.trim() && (
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
            User Settings
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage your account preferences and security settings.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200/60 rounded-xl transition cursor-pointer border-none bg-transparent">
            Discard Changes
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading}
            className="bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm transition cursor-pointer disabled:bg-slate-300 border-none"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-200 pb-3 text-xs font-bold text-slate-400 mb-6">
        <span className="text-[#0D241F] border-b-2 border-[#0D241F] pb-3 cursor-pointer">
          Account Profile
        </span>
        <span className="hover:text-[#0D241F] cursor-pointer transition">
          Security
        </span>
        <span className="hover:text-[#0D241F] cursor-pointer transition">
          Notifications
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* PERSONAL INFORMATION FORM */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#0D241F] border-b border-slate-50 pb-2">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  First Name
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
                  Last Name
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
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-100/70 border border-slate-200 text-slate-400 rounded-xl py-2.5 px-4 text-xs font-medium cursor-not-allowed outline-none"
                />
              </div>
              <div>
                {/* 🚀 FIELD BARU: NOMOR TELEPON */}
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Phone Number
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

            {/* 🚀 FIELD BARU: INPUT ALAMAT RUMAH / PENGIRIMAN */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Delivery Address (Alamat Rumah)
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Masukkan alamat lengkap rumah Anda untuk keperluan logistik kurir"
                className={`w-full border rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition ${!deliveryAddress.trim() ? "bg-amber-50/40 border-amber-300" : "bg-[#F8F9FA] border-slate-200"}`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Bio
              </label>
              <textarea
                rows="2"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your professional background..."
                className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* ROLE SWITCHER */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-[#0D241F]">
                Account Role Switcher
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Pilih peran kustom untuk beralih fungsi akun secara permanen.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {["Buyer", "Seller", "Driver", "Admin"].map((role) => {
                const isActive = activeRole === role;
                return (
                  <div
                    key={role}
                    onClick={() =>
                      role === "Seller"
                        ? navigate("/register-seller")
                        : handleSwitchRole(role)
                    }
                    className={`p-4 rounded-xl border text-center relative transition cursor-pointer ${isActive ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 font-bold" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="text-xl mb-1">
                      {role === "Buyer"
                        ? "🛍️"
                        : role === "Seller"
                          ? "🏪"
                          : role === "Driver"
                            ? "🚴"
                            : "🛡️"}
                    </div>
                    <h4 className="text-xs font-extrabold">{role}</h4>
                    {isActive && (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDE CARD PROFILE PREVIEW */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full overflow-hidden relative border-2 border-slate-200 mb-4">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-extrabold text-sm text-[#0D241F]">
              {firstName || derivedFirstName}{" "}
              {lastName || derivedLastName || "User"}
            </h3>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
              {activeRole || "Buyer"}
            </p>

            {/* MINI CARD SALDO E-WALLET */}
            <div className="mt-4 w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">
                Seapedia Pay Balance
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
