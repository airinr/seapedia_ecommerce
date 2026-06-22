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
import ReturnRequestPage from "./pages/BuyerPage/ReturnRequestPage";
import BuyerLayout from "./pages/BuyerPage/BuyerLayout";
import LoginPage from "./pages/LoginPage"; // 🚀 Import LoginPage
import AdminLayout from "./pages/AdminPage/AdminLayout";
import AdminVoucherDashboard from "./pages/AdminPage/AdminVoucherDashboard";
import AdminMonitoring from "./pages/AdminPage/AdminMonitoring";
import AdminReturns from "./pages/AdminPage/AdminReturns";
import DriverLayout from "./pages/DriverPage/DriverLayout";
import DriverDashboard from "./pages/DriverPage/DriverDashboard";
import DriverRegistration from "./pages/DriverPage/DriverRegistration";
import DriverRevenuePage from "./pages/DriverPage/DriverRevenuePage";
import MyReviewsApp from "./pages/BuyerPage/MyReviewsApp";

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
          <Route
            path="/orders/return/:orderId"
            element={<ReturnRequestPage />}
          />
          <Route path="/reviews" element={<MyReviewsApp />} />
        </Route>

        {/* Jalur Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/register-seller" element={<SellerRegistration />} />
        <Route path="/register-driver" element={<DriverRegistration />} />

        {/* Panel Seller (dengan Sidebar Khusus Seller) */}
        <Route element={<SellerLayout />}>
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/catalog" element={<ProductCatalog />} />
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
          <Route
            path="/seller/orders/:id"
            element={<SellerOrderDetailPage />}
          />
        </Route>

        {/* Panel Admin */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/vouchers" element={<AdminVoucherDashboard />} />
          <Route path="/admin/monitoring" element={<AdminMonitoring />} />
          <Route path="/admin/returns" element={<AdminReturns />} />
        </Route>

        {/* Panel Driver */}
        <Route element={<DriverLayout />}>
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/revenue" element={<DriverRevenuePage />} />
        </Route>

        {/* Fallback otomatis jika user mengetik alamat asal: lempar kembali ke Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
