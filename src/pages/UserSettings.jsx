import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";

export default function UserSettings() {
  const navigate = useNavigate();
  const { user, activeRole, setActiveRole, loading: roleLoading } = useRole();

  // =========================================================================
  // 💡 1. DEKLARASI HOOKS UTAMA (WAJIB DI PALING ATAS TANPA TERHALANG IF)
  // =========================================================================

  // Ambil data dasar dengan aman kustom fallback string kosong
  const email = user?.email || "";
  const fullName = user?.user_metadata?.full_name || "";
  const names = fullName.split(" ");
  const derivedFirstName = names[0] || "";
  const derivedLastName = names.slice(1).join(" ") || "";

  // Nyalakan seluruh State kustom form dan utility di posisi teratas skrip
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [successMsg, setSuccessMsg] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [errorMsg, setErrorMsg] = useState("");

  // =========================================================================
  // 🔄 2. SINKRONISASI DATA SETELAH PROSES LOADING SELESAI (Mencegah State Kosong)
  // =========================================================================
  useEffect(() => {
    if (!roleLoading && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirstName(derivedFirstName);
      setLastName(derivedLastName);
    }
  }, [roleLoading, user, derivedFirstName, derivedLastName]);

  // =========================================================================
  // 🚀 3. LOGIKA AUTO-REDIRECT KHUSUS SELLER
  // =========================================================================
  useEffect(() => {
    if (!roleLoading && activeRole === "Seller") {
      navigate("/seller/dashboard");
    }
  }, [activeRole, roleLoading, navigate]);

  // =========================================================================
  // 🛡 4. GERBANG EARLY RETURN LOADING (SEKARANG AMAN DI BAWAH DEKLARASI HOOKS)
  // =========================================================================
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  // =========================================================================
  // 🛠 5. FUNGSI AKSI BISNIS (LOGIKA OPERASIONAL)
  // =========================================================================

  // Fungsi Update Profil ke Supabase
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const combinedName = `${firstName} ${lastName}`.trim();

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: combinedName },
      });
      if (authError) throw authError;

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

  // LOGIKA SINGLE-ROLE SWAPPING
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

      if (setActiveRole) {
        setActiveRole(newRole);
      }

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

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  // ADAPTIVE SIDEBAR MENU BERDASARKAN ACTIVE ROLE
  const getSidebarMenus = () => {
    if (activeRole === "Seller") {
      return [
        { name: "Seller Dashboard", icon: "🏪", path: "/seller/dashboard" },
        { name: "Manage Products", icon: "📦", path: "/seller/dashboard" },
        { name: "Incoming Orders", icon: "📥", path: "/seller/dashboard" },
      ];
    }
    return [
      { name: "Dashboard Utama", icon: "📊", path: "/" },
      { name: "My Orders", icon: "📝", path: "/orders" },
      { name: "Wishlist", icon: "❤️", path: "#" },
      { name: "My Reviews", icon: "⭐", path: "#" },
    ];
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#23263B] font-sans antialiased">
      {/* SISI KIRI: SIDEBAR PANEL */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-7">
          <div>
            <h2 className="text-sm font-black text-[#0D241F] tracking-wider uppercase">
              {activeRole || "User"} Panel
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Account Management
            </p>
          </div>

          <nav className="space-y-1">
            {getSidebarMenus().map((menu, i) => (
              <button
                key={i}
                onClick={() => menu.path !== "#" && navigate(menu.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer border-none bg-transparent"
              >
                <span>{menu.icon}</span> {menu.name}
              </button>
            ))}

            <div className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold bg-[#0D241F] text-white rounded-xl shadow-sm">
              <span>⚙️</span> Settings
            </div>
          </nav>

          {activeRole === "Seller" && (
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="w-full bg-white hover:bg-slate-50 text-[#0D241F] border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <span>+</span> Add Product
            </button>
          )}
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-100 text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2 cursor-pointer hover:text-[#0D241F]">
            <span>❓</span> Help Center
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center gap-2 cursor-pointer hover:text-red-600 transition"
          >
            <span>➔</span> Logout
          </div>
        </div>
      </aside>

      {/* SISI KANAN: FORM USER PREFERENCES */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl overflow-y-auto h-screen">
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

        {/* Form area render kustom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                      onClick={() => {
                        if (role === "Seller") {
                          navigate("/register-seller");
                        } else {
                          handleSwitchRole(role);
                        }
                      }}
                      className={`p-4 rounded-xl border text-center relative transition cursor-pointer ${
                        isActive
                          ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 font-bold"
                          : "border-slate-200 bg-white hover:border-slate-300"
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

          <div className="space-y-6">
            <div className="bg-white border border-slate-200/70 rounded-2xl p-6 shadow-xs text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full overflow-hidden relative group border-2 border-slate-200 mb-4">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
