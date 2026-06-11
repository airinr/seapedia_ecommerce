// src/hooks/useRole.js
import { useContext } from "react";
import { RoleContext } from "../context/RoleContextBase";

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole harus digunakan di dalam komponen RoleProvider");
  }
  return context;
};
