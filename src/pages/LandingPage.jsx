import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, ownedRoles, activeRole, setActiveRole } = useRole();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // 💡 EFFECT 1: AMBIL DATA KATALOG & ULASAN DARI SUPABASE
  // =========================================================================
  useEffect(() => {
    async function fetchLandingData() {
      try {
        setLoading(true);

        // 1. Ambil data produk asli dari Supabase
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .limit(4);

        if (productError) throw productError;

        // 2. Ambil data ulasan aplikasi publik dari Supabase (Level 1)
        const { data: reviewData, error: reviewError } = await supabase
          .from("app_reviews")
          .select("*")
          .limit(4);

        if (reviewError) throw reviewError;

        // --- Pengkondisian State Produk ---
        if (productData && productData.length > 0) {
          setProducts(productData);
        } else {
          setProducts([
            {
              id: 1,
              product_name: "Wireless Earbuds IPX8",
              price: 1320000,
              stock: 12,
              description: "Organic cotton, fair trade certified.",
              image_url:
                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
            },
            {
              id: 2,
              product_name: "AirPods Max",
              price: 8235000,
              stock: 5,
              description:
                "A perfect balance of exhilarating high-fidelity audio.",
              image_url:
                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500",
            },
            {
              id: 3,
              product_name: "Bose BT Earphones",
              price: 4335000,
              stock: 8,
              description: "Relax with noise isolation extra-bass black.",
              image_url:
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
            },
            {
              id: 4,
              product_name: "VIVEFOX Headphones",
              price: 585000,
              stock: 25,
              description: "Wired stereo headsets with mic control.",
              image_url:
                "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500",
            },
          ]);
        }

        // --- Pengkondisian State Review ---
        if (reviewData && reviewData.length > 0) {
          setReviews(reviewData);
        } else {
          setReviews([
            {
              id: 1,
              reviewer_name: "Budi S.",
              rating: 5,
              comment: "Pengalaman multi-role yang luar biasa dan transparan!",
            },
            {
              id: 2,
              reviewer_name: "Siti R.",
              rating: 4,
              comment: "Navigasi antar dashboard sangat responsif.",
            },
          ]);
        }
      } catch (error) {
        console.error("Gagal memuat data:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLandingData();
  }, []);

  // =========================================================================
  // 💡 EFFECT 2: RE-TRIGGER OTOMATIS PEMASANGAN ROLE SEBAGAI BUYER
  // =========================================================================
  useEffect(() => {
    // Jika user sudah masuk, data role dari supabase sudah ter-load (length === 1),
    // dan activeRole masih kosong, langsung paksa isi dengan peran pertamanya (Buyer).
    if (user && ownedRoles && ownedRoles.length === 1 && !activeRole) {
      setActiveRole(ownedRoles[0]);
    }
  }, [user, ownedRoles, activeRole, setActiveRole]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#23263B] font-sans antialiased">
      {/* =========================================================================
          1. ANNOUNCEMENT BAR (PENGGANTI DISKON - STRUKTUR BANNER ATAS)
          ========================================================================= */}
      <div className="bg-[#0D241F] text-[#F3FDF5] text-xs py-2 px-4 border-b border-emerald-950">
        <div className="container mx-auto flex justify-between items-center overflow-hidden">
          <div className="animate-marquee flex gap-8">
            <span>
              📢 <strong>Pengumuman Ekosistem SEAPEDIA:</strong> Fitur simulasi
              otomatis SLA Next-Day diaktifkan untuk pengujian Level 6.
            </span>
            <span>
              🚀 Selamat datang di kompetisi Software Engineering Academy
              COMPFEST 18.
            </span>
          </div>
          <div className="hidden md:block text-[11px] font-mono opacity-80 shrink-0">
            System Time: 2026.06.11
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. HEADER / NAVBAR
          ========================================================================= */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-xs">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center gap-4">
          {/* Logo & Menu Kiri */}
          <div className="flex items-center gap-8">
            <a
              href="/"
              className="text-xl font-black tracking-tight text-[#0D241F] flex items-center gap-2"
            >
              <span className="text-emerald-600">🛒</span> SEAPEDIA
            </a>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#4A4E5A]">
              <div className="cursor-pointer hover:text-emerald-600 flex items-center gap-1">
                Categories <span className="text-[10px]">▼</span>
              </div>
              <div className="cursor-pointer hover:text-emerald-600">Deals</div>
              <div className="cursor-pointer hover:text-emerald-600">
                What's New
              </div>
              <div className="cursor-pointer hover:text-emerald-600">
                Delivery
              </div>
            </nav>
          </div>

          {/* Kolom Pencarian Tengah */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <input
              type="text"
              placeholder="Search Product"
              className="w-full bg-[#F5F6F6] text-xs rounded-full py-2.5 pl-4 pr-10 outline-none border border-transparent focus:border-slate-200"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm cursor-pointer">
              🔍
            </span>
          </div>

          {/* Navigasi Sesi / Akun Kanan */}
          <div className="flex items-center gap-6 text-sm font-semibold text-[#23263B]">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Menampilkan Nama & Role Secara Dinamis */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-[#0D241F]">
                    {user.user_metadata?.full_name || "User SEAPEDIA"}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                    {activeRole || "Buyer"}
                  </p>
                </div>

                {/* Avatar Bulat Berfungsi Sebagai Tombol Navigasi Settings */}
                <button
                  onClick={() => navigate("/settings")} // ✅ Atribut onClick dipindahkan ke dalam tag pembuka
                  className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-emerald-100 transition cursor-pointer"
                >
                  {user.user_metadata?.full_name?.charAt(0).toUpperCase() ||
                    "U"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <a href="/login" className="hover:text-emerald-600">
                  Login
                </a>
                <a
                  href="/register"
                  className="bg-[#0D241F] text-white px-4 py-2 rounded-full text-xs hover:bg-emerald-950 transition"
                >
                  Register
                </a>
              </div>
            )}

            {/* Ikon Keranjang Belanja */}
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-600 relative">
              <span className="text-lg">🛒</span>
              <span className="text-xs hidden sm:inline">Cart</span>
              <span className="absolute -top-1.5 left-3 bg-emerald-600 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. HERO HERO BANNER
          ========================================================================= */}
      <section className="container mx-auto px-4 lg:px-8 pt-6">
        <div className="w-full bg-[#EBF4F1] rounded-[24px] overflow-hidden relative min-h-[260px] md:min-h-[420px] flex items-center shadow-sm">
          <div className="p-8 md:p-16 max-w-md md:max-w-xl z-10 relative">
            <h1 className="text-3xl md:text-5xl font-black text-[#0D241F] tracking-tight leading-none">
              Grab Up to 50% Off On Selected Headphone
            </h1>
            <div className="mt-6">
              <button className="bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs md:text-sm px-6 py-3 rounded-full shadow transition">
                Buy Now
              </button>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-full md:w-[60%] h-full z-0 opacity-40 md:opacity-100">
            <img
              src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800"
              alt="SEAPEDIA Hero Banner"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#EBF4F1] via-[#EBF4F1]/70 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. BARISAN FILTER TOMBOL
          ========================================================================= */}
      <section className="container mx-auto px-4 lg:px-8 pt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          <button className="bg-[#F5F6F6] hover:bg-slate-200 px-4 py-2 rounded-full border border-slate-100">
            Headphone Type ▼
          </button>
          <button className="bg-[#F5F6F6] hover:bg-slate-200 px-4 py-2 rounded-full border border-slate-100">
            Price ▼
          </button>
          <button className="bg-[#F5F6F6] hover:bg-slate-200 px-4 py-2 rounded-full border border-slate-100">
            Review ▼
          </button>
          <button className="bg-[#F5F6F6] hover:bg-slate-200 px-4 py-2 rounded-full border border-slate-100">
            Color ▼
          </button>
          <button className="bg-[#F5F6F6] hover:bg-slate-200 px-4 py-2 rounded-full border border-slate-100">
            Material ▼
          </button>
          <button className="bg-[#F5F6F6] hover:bg-slate-200 px-4 py-2 rounded-full border border-slate-100">
            Other ▼
          </button>
          <button className="bg-[#EBF4F1] text-emerald-800 px-4 py-2 rounded-full border border-emerald-100 font-bold">
            All Filters 🎛️
          </button>
        </div>
        <div className="text-xs font-semibold bg-[#F5F6F6] px-4 py-2 rounded-full border border-slate-100">
          Sort by: <span className="text-slate-900 font-bold">Newest ▼</span>
        </div>
      </section>

      {/* =========================================================================
          5. PRODUCT GRID CATALOGUE
          ========================================================================= */}
      <section className="container mx-auto px-4 lg:px-8 py-8">
        <h2 className="text-xl md:text-2xl font-black text-[#0D241F] mb-6">
          Headphones For You!
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col bg-transparent group relative"
              >
                <div className="w-full h-64 bg-[#F5F6F6] rounded-[16px] overflow-hidden relative flex items-center justify-center p-4">
                  <img
                    src={
                      product.image_url ||
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
                    }
                    alt={product.product_name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                  />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-red-500 transition text-sm">
                    🤍
                  </button>
                </div>

                <div className="mt-3 flex justify-between items-start gap-2">
                  <h3 className="font-extrabold text-sm text-[#23263B] line-clamp-1 group-hover:text-emerald-700 transition cursor-pointer flex-1">
                    {product.product_name}
                  </h3>
                  <span className="font-black text-sm text-[#23263B] shrink-0 font-mono">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(product.price)}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] line-clamp-2 mt-1 leading-normal">
                  {product.description ||
                    "No description provided for this product catalogue entry."}
                </p>

                <div className="flex items-center gap-1 text-amber-400 text-xs mt-1.5">
                  {"★".repeat(5)}
                  <span className="text-slate-400 text-[10px] ml-1 font-semibold">
                    (121)
                  </span>
                </div>

                <div className="mt-3">
                  <button className="w-full sm:w-auto border border-[#23263B] hover:bg-[#0D241F] hover:text-white text-[#23263B] font-bold text-xs px-4 py-2 rounded-full transition shadow-sm">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =========================================================================
          6. POPULAR CATEGORIES SECTION
          ========================================================================= */}
      <section className="container mx-auto px-4 lg:px-8 py-8 border-t border-slate-100">
        <h2 className="text-xl md:text-2xl font-black text-[#0D241F] mb-6">
          Popular Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { name: "Furniture", icon: "🪑", count: "240 Items" },
            { name: "Shoe", icon: "👟", count: "180 Items" },
            { name: "Laptop", icon: "💻", count: "95 Items" },
            { name: "Headphone", icon: "🎧", count: "1.2k Items" },
            { name: "Bag", icon: "👜", count: "310 Items" },
            { name: "Book", icon: "📚", count: "450 Items" },
          ].map((cat, i) => (
            <div
              key={i}
              className="bg-[#F5F6F6] p-5 rounded-[16px] text-center border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer transition"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <h4 className="font-bold text-xs text-[#23263B]">{cat.name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          7. PUBLIC APPLICATION REVIEWS
          ========================================================================= */}
      <section className="container mx-auto px-4 lg:px-8 py-8 border-t border-slate-100">
        <h2 className="text-xl md:text-2xl font-black text-[#0D241F] mb-6">
          Application Feedback
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-[#F5F6F6] p-4 rounded-[16px] border border-slate-100 flex flex-col justify-between"
            >
              <p className="text-slate-600 text-xs italic">
                "{review.comment}"
              </p>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/50">
                <span className="text-[11px] font-bold text-[#23263B]">
                  {review.reviewer_name}
                </span>
                <span className="text-amber-400 text-xs">
                  {"★".repeat(review.rating)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          8. FOOTER MULTI-KOLOM
          ========================================================================= */}
      <footer className="bg-white border-t border-slate-200 pt-12 pb-6 mt-12">
        <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-500">
          <div className="md:pr-6">
            <h3 className="text-sm font-black text-[#0D241F] mb-3 flex items-center gap-1">
              <span className="text-emerald-600">🛒</span> Shopcart
            </h3>
            <p className="leading-relaxed">
              Experience a frictionless, high-end retail environment with the
              world's leading marketplace and lifestyle branch.
            </p>
            <div className="flex gap-3 text-sm mt-4 text-slate-400">
              <span className="cursor-pointer hover:text-emerald-600">🌐</span>
              <span className="cursor-pointer hover:text-emerald-600">📷</span>
              <span className="cursor-pointer hover:text-emerald-600">📞</span>
            </div>
          </div>

          <div>
            <h4 className="font-black text-[#23263B] mb-3 text-xs uppercase tracking-wider">
              Department
            </h4>
            <ul className="space-y-2 font-medium">
              <li className="hover:text-emerald-600 cursor-pointer">Fashion</li>
              <li className="hover:text-emerald-600 cursor-pointer">
                Electronics
              </li>
              <li className="hover:text-emerald-600 cursor-pointer">
                Home & Living
              </li>
              <li className="hover:text-emerald-600 cursor-pointer">Beauty</li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[#23263B] mb-3 text-xs uppercase tracking-wider">
              About Us
            </h4>
            <ul className="space-y-2 font-medium">
              <li className="hover:text-emerald-600 cursor-pointer">
                News & Blog
              </li>
              <li className="hover:text-emerald-600 cursor-pointer">Careers</li>
              <li className="hover:text-emerald-600 cursor-pointer">
                Sustainability
              </li>
              <li className="hover:text-emerald-600 cursor-pointer">
                Partnerships
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[#23263B] mb-3 text-xs uppercase tracking-wider">
              Help
            </h4>
            <ul className="space-y-2 font-medium">
              <li className="hover:text-emerald-600 cursor-pointer">
                Shopcart Help
              </li>
              <li className="hover:text-emerald-600 cursor-pointer">Returns</li>
              <li className="hover:text-emerald-600 cursor-pointer">
                Track Order
              </li>
              <li className="hover:text-emerald-600 cursor-pointer">
                Contact Us
              </li>
            </ul>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 border-t border-slate-100 mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span>
            &copy; {new Date().getFullYear()} SEAPEDIA Inc. All rights reserved.
          </span>
          <div className="flex gap-4 font-sans font-semibold">
            <span className="cursor-pointer hover:underline">
              Privacy Policy
            </span>
            <span className="cursor-pointer hover:underline">
              Terms of Service
            </span>
            <span className="cursor-pointer hover:underline">
              Shipping Info
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
