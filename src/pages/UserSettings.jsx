import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";

export default function UserSettings() {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const {
    user,
    ownedRoles,
    activeRole,
    setActiveRole,
    loading: roleLoading,
  } = useRole();

  // =========================================================================
  // 💡 SEPERTI PEER REVIEW SEBELUMNYA: GUNAKAN DERIVED STATE (DILUAR EFFECT)
  // =========================================================================
  const email = user?.email || "";
  const fullName = user?.user_metadata?.full_name || "";
  const names = fullName.split(" ");
  const derivedFirstName = names[0] || "";
  const derivedLastName = names.slice(1).join(" ") || "";

  // State Form Profil (Diinisialisasi langsung dari Derived State dasar)
  const [firstName, setFirstName] = useState(derivedFirstName);
  const [lastName, setLastName] = useState(derivedLastName);
  const [bio, setBio] = useState("");

  // State Utility
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fungsi Update Profil ke Supabase
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const combinedName = `${firstName} ${lastName}`.trim();

      // 1. Update user metadata di Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: combinedName },
      });
      if (authError) throw authError;

      // 2. Update data ke tabel profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: combinedName })
        .eq("id", user.id);
      if (profileError) throw profileError;

      setSuccessMsg("Perubahan profil berhasil disimpan!");
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Request Role Baru (Misal mendaftar jadi Seller/Driver)
  const handleRequestNewRole = async (newRole) => {
    if (ownedRoles.includes(newRole)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: user.id, role: newRole }]);

      if (error) throw error;

      alert(
        `Selamat! Anda sekarang resmi memiliki akses sebagai ${newRole}. Silakan ganti role aktif Anda.`,
      );
      window.location.reload(); // Reload untuk merefresh ownedRoles di context
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#23263B] font-sans antialiased">
      {/* =========================================================================
          SISI KIRI: SIDEBAR PANEL (PERSIS GAMBAR REFERENSI)
          ========================================================================= */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-7">
          {/* Brand Heading */}
          <div>
            <h2 className="text-sm font-black text-[#0D241F] tracking-wider uppercase">
              {activeRole} Panel
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Account Management
            </p>
          </div>

          {/* Navigasi Menu */}
          <nav className="space-y-1">
            {[
              { name: "Dashboard", icon: "📊", path: "/" },
              { name: "My Orders", icon: "📝", path: "#" },
              { name: "Wishlist", icon: "❤️", path: "#" },
              { name: "My Reviews", icon: "⭐", path: "#" },
            ].map((menu, i) => (
              <a
                key={i}
                href={menu.path}
                className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition"
              >
                <span>{menu.icon}</span> {menu.name}
              </a>
            ))}
            {/* Active State Settings */}
            <div className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold bg-[#0D241F] text-white rounded-xl shadow-sm">
              <span>⚙️</span> Settings
            </div>
          </nav>

          {/* Tambah Produk Quick Button */}
          <button className="w-full bg-white hover:bg-slate-50 text-[#0D241F] border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer">
            <span>+</span> Add Product
          </button>
        </div>

        {/* Footer Sidebar */}
        <div className="space-y-3 pt-6 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 cursor-pointer hover:text-[#0D241F]">
            <span>❓</span> Help Center
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition">
            <span>➔</span> Logout
          </div>
        </div>
      </aside>

      {/* =========================================================================
          SISI KANAN: UTAMA / DASHBOARD CONTAINER
          ========================================================================= */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl overflow-y-auto h-screen">
        {/* Header Konten Atas */}
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
            <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200/60 rounded-xl transition cursor-pointer">
              Discard Changes
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={loading}
              className="bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm transition cursor-pointer disabled:bg-slate-300"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
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
          <span className="hover:text-[#0D241F] cursor-pointer transition">
            Payment Methods
          </span>
        </div>

        {/* Notifikasi Feedback */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl mb-4">
            ✅ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl mb-4">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Layout Split: Form & Ringkasan Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Form Kelompok Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* Box 1: Personal Information */}
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
                    value={firstName || derivedFirstName}
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
                    value={lastName || derivedLastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>
              </div>

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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Bio
                </label>
                <textarea
                  rows="3"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your professional background or focus..."
                  className="w-full bg-[#F8F9FA] border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-medium outline-none focus:bg-white focus:border-emerald-600 transition resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Box 2: FITUR UTAMA - ACTIVE ROLE SELECTION (Multi-Role Requirement) */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#0D241F]">
                  Active Role Management
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Pilih peran aktif untuk mengonfigurasi dasbor sesi ini secara
                  dinamis.
                </p>
              </div>

              {/* Baris Tombol Pilih Peran Aktif */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {["Buyer", "Seller", "Driver", "Admin"].map((role) => {
                  const isOwned = ownedRoles?.includes(role);
                  const isActive = activeRole === role;

                  return (
                    <div
                      key={role}
                      onClick={() => isOwned && setActiveRole(role)}
                      className={`p-4 rounded-xl border text-center relative transition ${
                        isActive
                          ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 font-bold"
                          : isOwned
                            ? "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
                            : "border-slate-100 bg-slate-50/50 opacity-60"
                      }`}
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

                      {/* Badge Indikator Status Peran */}
                      {isActive ? (
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white font-mono text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold">
                          Active
                        </span>
                      ) : isOwned ? (
                        <span className="absolute top-2 right-2 bg-slate-200 text-slate-600 font-mono text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold">
                          Owned
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestNewRole(role);
                          }}
                          className="mt-2 text-[9px] bg-[#0D241F] text-white px-2 py-0.5 rounded-md font-bold hover:bg-emerald-900 transition block mx-auto cursor-pointer"
                        >
                          Daftar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan Profil Card */}
          <div className="space-y-6">
            {/* Card Ringkasan Visual (Persis Gambar Referensi) */}
            <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full overflow-hidden relative group border-2 border-slate-200 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
                <button className="absolute inset-0 bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center font-bold cursor-pointer">
                  ✏️
                </button>
              </div>
              <h3 className="font-extrabold text-sm text-[#0D241F]">
                {firstName || derivedFirstName}{" "}
                {lastName || derivedLastName || "User"}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                {activeRole || "Buyer"}
              </p>

              <div className="w-full border-t border-slate-100 mt-4 pt-3 flex justify-between text-[11px] font-semibold text-slate-400">
                <span>Status Akun</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Active Account
                </span>
              </div>
            </div>

            {/* Card Informasi Account Security */}
            <div className="bg-[#0D241F] border border-emerald-950 text-white rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 text-6xl translate-x-3 translate-y-3">
                🛡️
              </div>
              <h4 className="font-bold text-xs flex items-center gap-1.5 text-emerald-300">
                <span>🛡️</span> Account Security
              </h4>
              <p className="text-emerald-100/70 text-[11px] leading-relaxed">
                Your account is currently protected by 2FA. We recommend
                updating your password every 90 days.
              </p>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] py-2 rounded-xl transition cursor-pointer">
                Review Security
              </button>
            </div>
          </div>
        </div>

        {/* Footer Hak Cipta */}
        <footer className="border-t border-slate-200 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span>
            &copy; {new Date().getFullYear()} SEAPEDIA Inc. All rights reserved.
          </span>
          <div className="flex gap-4 font-sans font-semibold">
            <span className="hover:underline cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:underline cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:underline cursor-pointer">Contact Us</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
