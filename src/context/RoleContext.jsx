// src/context/RoleContext.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { RoleContext } from "./RoleContextBase"; // Import dari file base

export const RoleProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ownedRoles, setOwnedRoles] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserRoles(userId) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      let roles = data.map((r) => r.role);

      // Pastikan "Buyer" selalu ada sebagai role dasar
      if (!roles.includes("Buyer")) {
        roles = ["Buyer", ...roles];
      }

      setOwnedRoles(roles);

      // Jika activeRole belum diset, default ke "Buyer"
      if (!activeRole) {
        setActiveRole("Buyer");
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
        setActiveRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <RoleContext.Provider
      value={{ user, ownedRoles, activeRole, setActiveRole, loading }}
    >
      {!loading && children}
    </RoleContext.Provider>
  );
};
