// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Register from "./pages/RegisterPage";
import RoleSelection from "./pages/RoleSelection";
import UserSettings from "./pages/UserSettings";
import SellerRegistration from "./pages/SellerRegistration";
import SellerDashboard from "./pages/SellerPage/SellerDashboard";

// Dummy placeholder untuk halaman login & register sebelum kamu buat kodenya
const LoginPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="bg-white p-8 rounded-xl shadow border border-slate-200 text-center">
      <h2 className="text-xl font-bold mb-2">Halaman Login</h2>
      <p className="text-slate-500 text-sm mb-4">
        Fitur Auth akan diintegrasikan menggunakan Supabase Auth.
      </p>
      <a href="/" className="text-blue-600 hover:underline text-sm">
        ⬅ Kembali ke Landing Page
      </a>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Jalur Utama: Landing Page SEAPEDIA */}
        <Route path="/" element={<LandingPage />} />

        {/* Jalur Auth (Placeholder awal) */}
        <Route path="/login" element={<LoginPlaceholder />} />
        <Route path="/register" element={<Register />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/register-seller" element={<SellerRegistration />} />

        <Route path="/seller/dashboard" element={<SellerDashboard />} />

        {/* Fallback otomatis jika user mengetik alamat asal: lempar kembali ke Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
