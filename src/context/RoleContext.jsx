// src/context/RoleContext.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { RoleContext } from "./RoleContextBase"; // Import dari file base

export const RoleProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ownedRoles, setOwnedRoles] = useState([]);
  const [activeRole, setActiveRole] = useState(
    localStorage.getItem("seapedia_active_role") || null,
  );
  const [loading, setLoading] = useState(true);

  // Helper untuk set role aktif sekaligus simpan ke localStorage
  const handleSetActiveRole = (role) => {
    setActiveRole(role);
    if (role) {
      localStorage.setItem("seapedia_active_role", role);
    } else {
      localStorage.removeItem("seapedia_active_role");
    }
  };

  async function fetchUserRoles(userId) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      let roles = data.map((r) => r.role);

      // 💡 LOGIKA EKSKLUSIVITAS:
      // Jika user punya role spesialis (Seller, Driver, atau Admin), 
      // maka role "Buyer" akan dihilangkan/dinonaktifkan.
      const hasSpecializedRole = roles.some((r) =>
        ["Seller", "Driver", "Admin"].includes(r),
      );

      if (hasSpecializedRole) {
        // Hapus "Buyer" dari daftar jika user sudah naik tingkat
        roles = roles.filter((r) => r !== "Buyer");
      } else {
        // Jika belum punya role apa-apa, baru berikan role "Buyer" sebagai default
        if (roles.length === 0) {
          roles = ["Buyer"];
        }
      }

      setOwnedRoles(roles);

      // Validasi activeRole: Jika role yang tersimpan di localStorage sudah tidak dimiliki 
      // (misal: "Buyer" yang baru saja di-upgrade ke "Seller"), maka reset ke role pertama yang tersedia.
      const savedRole = localStorage.getItem("seapedia_active_role");
      if (!savedRole || !roles.includes(savedRole)) {
        handleSetActiveRole(roles[0] || "Buyer");
      }
    } catch (err) {
      console.error("Gagal mengambil role user:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchUserRoles(session.user.id);
      } else {
        setUser(null);
        setOwnedRoles([]);
        handleSetActiveRole(null); // Gunakan helper untuk hapus storage
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <RoleContext.Provider
      value={{
        user,
        ownedRoles,
        activeRole,
        setActiveRole: handleSetActiveRole, // Inject helper persistence
        loading,
      }}
    >
      {!loading && children}
    </RoleContext.Provider>
  );
};
