/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRole } from "../hooks/useRole";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, ownedRoles, activeRole, setActiveRole } = useRole();
  const { addToCart, getCartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchLandingData = async (query = "") => {
    try {
      setLoading(true);

      let productQuery = supabase.from("products").select("*");

      if (query.trim()) {
        productQuery = productQuery.ilike("product_name", `%${query}%`);
      } else {
        productQuery = productQuery.limit(8);
      }

      const { data: productData, error: productError } = await productQuery;

      if (productError) throw productError;
      setProducts(productData || []);

      const { data: reviewData, error: reviewError } = await supabase
        .from("app_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (reviewError) throw reviewError;

      const localReviewsKey = "seapedia_local_reviews";
      const savedLocalStr = localStorage.getItem(localReviewsKey);
      const localReviews = savedLocalStr ? JSON.parse(savedLocalStr) : [];

      setReviews([...localReviews, ...(reviewData || [])]);
    } catch (error) {
      console.error("Gagal memuat data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLandingData(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (user && ownedRoles && ownedRoles.length === 1 && !activeRole) {
      setActiveRole(ownedRoles[0]);
    }
  }, [user, ownedRoles, activeRole, setActiveRole]);

  useEffect(() => {
    if (user && user.user_metadata?.full_name && !reviewerName) {
      setReviewerName(user.user_metadata.full_name);
    }
  }, [user, reviewerName]);

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari akun Seapedia?")) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      alert(`Gagal Logout: ${error.message}`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) {
      alert("Harap isi nama peninjau dan teks komentar ulasan.");
      return;
    }

    try {
      setSubmitLoading(true);

      const newReviewItem = {
        reviewer_name: reviewerName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
      };

      const { data: insertedData, error: insertError } = await supabase
        .from("app_reviews")
        .insert([newReviewItem])
        .select()
        .single();

      if (insertError) {
        const fallbackReview = {
          id: `LOCAL-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...newReviewItem,
        };

        const localReviewsKey = "seapedia_local_reviews";
        const currentLocalStr = localStorage.getItem(localReviewsKey);
        const currentLocal = currentLocalStr ? JSON.parse(currentLocalStr) : [];

        currentLocal.unshift(fallbackReview);
        localStorage.setItem(localReviewsKey, JSON.stringify(currentLocal));

        setReviews((prev) => [fallbackReview, ...prev]);
      } else if (insertedData) {
        setReviews((prev) => [insertedData, ...prev]);
      }

      setComment("");
      alert(
        "Ulasan pengalaman Anda berhasil dikirim dan ditambahkan ke daftar testimoni!",
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#23263B] font-sans antialiased">
      <div className="bg-[#0D241F] text-[#F3FDF5] text-xs py-2 px-4 border-b border-emerald-950">
        <div className="container mx-auto flex justify-between items-center overflow-hidden">
          <div className="animate-marquee flex gap-8">
            <span>
              <strong>Announcement:</strong> Fitur simulasi otomatis SLA
              Next-Day diaktifkan untuk pengujian Level 6.
            </span>
          </div>
          <div className="hidden md:block text-[11px] font-mono opacity-80 shrink-0">
            System Time: 2026.06.14
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-10">
            <button
              onClick={() => navigate("/")}
              className="text-xl font-black tracking-tight text-[#0D241F] flex items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className="text-emerald-600 font-extrabold">SEA</span>PEDIA
            </button>
          </div>

          <div className="flex-1 max-w-md relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk di Seapedia..."
              className="w-full bg-[#F5F6F6] text-[13px] rounded-lg py-2.5 pl-4 pr-10 outline-none border border-transparent focus:border-emerald-200 focus:bg-white transition-all font-medium"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm cursor-pointer hover:text-emerald-600 transition-colors">
              {searchQuery ? (
                <svg
                  onClick={() => setSearchQuery("")}
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              )}
            </span>
          </div>

          <div className="flex items-center gap-8 text-sm font-bold text-[#23263B]">
            {user ? (
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-[#0D241F] leading-tight">
                    {user.user_metadata?.full_name || "User SEAPEDIA"}
                  </p>
                  <p className="text-[9px] font-mono text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                    {activeRole || "Buyer"}
                  </p>
                </div>

                <button
                  onClick={() => navigate("/settings")}
                  className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-emerald-100 transition cursor-pointer"
                >
                  {user.user_metadata?.full_name?.charAt(0).toUpperCase() ||
                    "U"}
                </button>

                <div
                  onClick={() => navigate("/wallet")}
                  className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-emerald-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  <span className="text-[10px] hidden lg:inline uppercase tracking-tighter">
                    Dompet
                  </span>
                </div>

                <div
                  onClick={() => navigate("/orders")}
                  className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-emerald-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                    <path d="m3.3 7 8.7 5 8.7-5" />
                    <path d="M12 22V12" />
                  </svg>
                  <span className="text-[10px] hidden sm:inline uppercase tracking-tighter">
                    Pesanan
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-700 bg-transparent border-none text-[11px] font-black uppercase tracking-wider cursor-pointer transition"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <button
                  onClick={() => navigate("/login")}
                  className="hover:text-emerald-600 bg-transparent border-none text-sm font-bold text-[#23263B] cursor-pointer transition-colors"
                >
                  Masuk
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-[#0D241F] text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-emerald-950 transition shadow-sm border-none cursor-pointer"
                >
                  Daftar
                </button>
              </div>
            )}

            <div
              onClick={() => navigate("/cart")}
              className="flex flex-col items-center gap-0.5 cursor-pointer hover:text-emerald-600 relative transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span className="text-[10px] hidden sm:inline uppercase tracking-tighter">
                + Keranjang
              </span>
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">
                {getCartCount()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 lg:px-8 pt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          <button className="bg-[#EBF4F1] text-emerald-800 px-6 py-2.5 rounded-full border border-emerald-100 font-black uppercase tracking-wider flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
            Semua Produk
          </button>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-8">
        <h2 className="text-xl md:text-2xl font-black text-[#0D241F] mb-6">
          {searchQuery.trim() 
            ? `Hasil Pencarian untuk "${searchQuery}"` 
            : "Selamat Berbelanja!"}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Belum ada produk riil yang tersedia di database Anda. Silakan
            tambahkan katalog produk melalui Merchant Dashboard.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const hasImages =
                Array.isArray(product.image_url) &&
                product.image_url.length > 0;
              const displayImage = hasImages
                ? product.image_url[0]
                : typeof product.image_url === "string"
                  ? product.image_url
                  : null;

              return (
                <div
                  key={product.id}
                  className="flex flex-col bg-transparent group relative cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="w-full h-64 bg-[#F5F6F6] rounded-[16px] overflow-hidden relative flex items-center justify-center p-4">
                    <img
                      src={
                        displayImage ||
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
                      }
                      alt={product.product_name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                    />

                    {hasImages && product.image_url.length > 1 && (
                      <span className="absolute bottom-3 left-3 bg-[#0D241F]/80 text-white text-[9px] px-2 py-0.5 rounded-md font-mono backdrop-blur-xs">
                        +{product.image_url.length - 1} Photos
                      </span>
                    )}

                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-red-500 transition border-none cursor-pointer group/fav"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover/fav:fill-red-500 transition-colors"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3 flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-sm text-[#23263B] line-clamp-1 group-hover:text-emerald-700 transition flex-1">
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

                  <div className="flex items-center gap-1 text-amber-500 text-[11px] mt-1.5 font-bold">
                    ★★★★★
                    <span className="text-slate-400 text-[10px] ml-1 font-bold">
                      (0)
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="flex-1 border border-[#0D241F] hover:bg-[#0D241F] hover:text-white text-[#0D241F] font-bold text-[10px] px-3 py-2 rounded-full transition shadow-sm bg-transparent cursor-pointer"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, true);
                        navigate("/cart");
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-2 rounded-full transition shadow-md border-none cursor-pointer"
                    >
                      Beli Sekarang
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-10 border-t border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-2xs">
            <h3 className="text-base font-extrabold text-[#0D241F] uppercase tracking-wider mb-1">
              Kirim Ulasan Aplikasi
            </h3>
            <p className="text-slate-400 text-[11px] mb-4 leading-normal">
              Bagikan pengalaman eksplorasi ekosistem multi-dashboard Anda
              langsung tanpa syarat transaksi.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Peninjau
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  App Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-2.5 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition cursor-pointer font-bold text-slate-700 appearance-none"
                >
                  <option value="5">★★★★★ (5 - Excellent)</option>
                  <option value="4">★★★★ (4 - Very Good)</option>
                  <option value="3">★★★ (3 - Good)</option>
                  <option value="2">★★ (2 - Fair)</option>
                  <option value="1">★ (1 - Poor)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Teks Komentar
                </label>
                <textarea
                  rows="3"
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tulis kritik, komentar, atau saran pengalaman fitur di sini..."
                  className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-2 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600 transition resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs border-none cursor-pointer disabled:bg-slate-300"
              >
                {submitLoading ? "Mengirim Ulasan..." : "Kirim Ulasan Sekarang"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-base font-extrabold text-[#0D241F] uppercase tracking-wider mb-4">
              Application Feedback ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Belum ada feedback yang dikirimkan. Jadilah yang pertama
                memberikan ulasan menggunakan form di samping!
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#F5F6F6] p-4 rounded-[16px] border border-slate-100 flex flex-col justify-between shadow-3xs"
                  >
                    <p className="text-slate-600 text-xs italic leading-relaxed">
                      "{review.comment}"
                    </p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/50">
                      <span className="text-[11px] font-black text-[#0D241F] uppercase tracking-wider">
                        {review.reviewer_name}
                      </span>
                      <span className="text-amber-500 text-[10px] font-bold tracking-widest">
                        {"★".repeat(review.rating)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 pt-12 pb-6 mt-12">
        <div className="container mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-500">
          <div className="md:pr-6">
            <h3 className="text-sm font-black text-[#0D241F] mb-3 flex items-center gap-1">
              SHOPCART
            </h3>
            <p className="leading-relaxed">
              Experience a frictionless, high-end retail environment with the
              world's leading marketplace and lifestyle branch.
            </p>
          </div>
          {["Department", "About Us", "Help"].map((title, idx) => (
            <div key={idx}>
              <h4 className="font-black text-[#23263B] mb-3 text-xs uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-2 font-medium">
                <li className="hover:text-emerald-600 cursor-pointer">
                  Sample Item Link
                </li>
                <li className="hover:text-emerald-600 cursor-pointer">
                  Support Context
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="container mx-auto px-4 lg:px-8 border-t border-slate-100 mt-8 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span>
            &copy; {new Date().getFullYear()} SEAPEDIA Inc. All rights reserved.
          </span>
          <div className="flex gap-4 font-sans font-semibold">
            {["Privacy Policy", "Terms of Service", "Shipping Info"].map(
              (item, idx) => (
                <span key={idx} className="cursor-pointer hover:underline">
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
