import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { RoleProvider } from "./context/RoleContext"; // 🚀 Import RoleProvider
import { CartProvider } from "./context/CartContext";
import "./index.css";
// Design tokens (font Poppins + palette warna) — dipakai global
import "./styles/tokens.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RoleProvider>
      <CartProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "Poppins, sans-serif",
              fontSize: "14px",
            },
          }}
        />
      </CartProvider>
    </RoleProvider>
  </React.StrictMode>,
);
