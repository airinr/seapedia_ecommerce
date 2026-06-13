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
import SellerLayout from "./pages/SellerPage/SellerLayout";
import SellerDashboard from "./pages/SellerPage/SellerDashboard";
import SellerOrdersPage from "./pages/SellerPage/SellerOrdersPage";
import SellerOrderDetailPage from "./pages/SellerPage/SellerOrderDetailPage"; // 🚀 Import SellerOrderDetailPage
import ProductCatalog from "./pages/SellerPage/ProductCatalog";
import CartPage from "./pages/BuyerPage/CartPage";
import ProductDetailPage from "./pages/BuyerPage/ProductDetailPage";
import BuyerOrdersPage from "./pages/BuyerPage/BuyerOrdersPage";
import WalletPage from "./pages/BuyerPage/WalletPage";
import BuyerLayout from "./pages/BuyerPage/BuyerLayout"; 
import LoginPage from "./pages/LoginPage"; // 🚀 Import LoginPage

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Jalur Utama: Landing Page SEAPEDIA */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />

        {/* Panel Buyer (dengan Sidebar Khusus Buyer) */}
        <Route element={<BuyerLayout />}>
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<BuyerOrdersPage />} />
          <Route path="/wallet" element={<WalletPage />} />
        </Route>

        {/* Jalur Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/register-seller" element={<SellerRegistration />} />

        {/* Panel Seller (dengan Sidebar Khusus Seller) */}
        <Route element={<SellerLayout />}>
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/catalog" element={<ProductCatalog />} />
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
          <Route path="/seller/orders/:id" element={<SellerOrderDetailPage />} />
        </Route>

        {/* Fallback otomatis jika user mengetik alamat asal: lempar kembali ke Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
