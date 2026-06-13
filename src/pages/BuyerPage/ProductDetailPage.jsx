import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useCart } from "../../context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, getCartCount } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true);

        // 1. 🚀 PERBAIKAN QUERY: Ambil data produk sekaligus JOIN dengan tabel 'stores'
        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select(
            `
            *,
            stores (
              id,
              store_name,
              description,
              address
            )
          `,
          )
          .eq("id", id)
          .single();

        if (prodError) throw prodError;
        setProduct(prodData);

        if (prodData?.image_url && prodData.image_url.length > 0) {
          setMainImage(prodData.image_url[0]);
        } else {
          setMainImage(
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          );
        }

        // 2. Ambil Ulasan Produk
        const { data: revData, error: revError } = await supabase
          .from("app_reviews")
          .select("*")
          .limit(5);

        if (!revError && revData && revData.length > 0) {
          setReviews(revData);
        } else {
          setReviews([
            {
              id: 1,
              reviewer_name: "Ahmad Ristiana",
              rating: 5,
              comment:
                "Kualitas rancang bangun sangat kokoh, suara high-fidelity jernih sekali!",
            },
            {
              id: 2,
              reviewer_name: "Budi Santoso",
              rating: 4,
              comment:
                "Pengiriman instan kilat, respon seller ramah dan cepat.",
            },
          ]);
        }
      } catch (error) {
        console.error("Gagal memuat detail produk:", error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProductDetails();
  }, [id]);

  const handleQuantityChange = (amount) => {
    const nextQty = quantity + amount;
    if (nextQty > 0 && nextQty <= (product?.stock || 1)) {
      setQuantity(nextQty);
    }
  };

  const handleAddMultipleToCart = (redirect = false) => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    if (redirect) navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-center p-6">
        <span className="text-5xl mb-4">🔍</span>
        <h1 className="text-xl font-black text-[#0D241F]">
          Katalog Produk Tidak Ditemukan
        </h1>
        <p className="text-slate-400 text-xs mt-1 max-w-sm mb-6">
          Barang mungkin telah dihapus oleh merchant atau tautan URL salah.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#0D241F] text-white px-6 py-2.5 rounded-xl text-xs font-bold border-none hover:bg-emerald-950 transition cursor-pointer"
        >
          Kembali ke Beranda SEAPEDIA
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#23263B] font-sans antialiased pb-24">
      {/* HEADER / NAVBAR */}
      <header className="bg-white/80 border-b border-slate-200/60 sticky top-0 z-50 backdrop-blur-md shadow-xs">
        <div className="container mx-auto px-4 lg:px-12 py-3.5 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-bold text-slate-600 flex items-center gap-2 border-none bg-transparent hover:text-[#0D241F] transition cursor-pointer"
          >
            <span>⬅</span> Back to Store
          </button>
          <button
            onClick={() => navigate("/cart")}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center relative transition border-none cursor-pointer"
          >
            <span className="text-base">🛒</span>
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-mono text-[9px] w-4 h-4 rounded-md flex items-center justify-center font-bold">
              {getCartCount()}
            </span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-12 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* SEGMEN KIRI: GALERI MULTI FOTO */}
          <div className="lg:col-span-5 space-y-4">
            <div className="w-full h-[380px] md:h-[460px] bg-white rounded-3xl overflow-hidden flex items-center justify-center p-6 border border-slate-200/60 shadow-xs">
              <img
                src={mainImage}
                alt={product.product_name}
                className="max-h-full max-w-full object-contain transition duration-300 transform hover:scale-102"
              />
            </div>

            {/* THUMBNAILS CONTAINER */}
            {product.image_url && product.image_url.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1">
                {product.image_url.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 p-1 transition ${mainImage === img ? "border-emerald-600 shadow-xs" : "border-slate-200/60 opacity-60 hover:opacity-100"}`}
                  >
                    <img
                      src={img}
                      alt={`Detail ${idx}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEGMEN TENGAH: DETAIL DESKRIPSI INFORMASI */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-emerald-100">
                ★ 4.9 Premium Merchant
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-[#0D241F] tracking-tight mt-3 mb-2">
                {product.product_name}
              </h1>
              <p className="text-2xl font-mono font-black text-emerald-700">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(product.price)}
              </p>
            </div>

            {/* 🚀 COMPONENT BARU: INFORMASI IDENTITAS TOKO SELLER */}
            <div className="border-t border-b border-slate-200/80 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0D241F] text-white rounded-full flex items-center justify-center font-black text-sm shadow-2xs border border-emerald-950">
                  {product.stores?.store_name?.charAt(0).toUpperCase() || "🏪"}
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#0D241F] tracking-tight">
                    {product.stores?.store_name || "Official Seapedia Store"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] mt-0.5">
                    {product.stores?.description || "Verified Merchant Partner"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] block font-bold text-slate-400 uppercase tracking-wider">
                  Lokasi Gudang
                </span>
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 justify-end mt-0.5">
                  📍 {product.stores?.address || "Indonesia"}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Spesifikasi & Deskripsi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                {product.description ||
                  "Pihak merchant tidak menyertakan rincian spesifikasi tambahan untuk item katalog ini."}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-2xs flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span> 100% Original
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚚</span> Instant SLA Ready
              </div>
            </div>
          </div>

          {/* SEGMEN KANAN: PANEL STICKY CART ACTIONS */}
          <div className="lg:col-span-3 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="font-black text-xs text-[#0D241F] uppercase tracking-wider">
                Atur Jumlah Belanja
              </h3>

              {/* Kuantitas Control */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="text-xs text-slate-400 pl-2 font-medium">
                  Jumlah
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:text-emerald-700 disabled:opacity-40 transition cursor-pointer"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-xs w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:text-emerald-700 disabled:opacity-40 transition cursor-pointer"
                    disabled={quantity >= (product.stock || 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Status Sisa Stok */}
              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-medium">
                  Ketersediaan Stok
                </span>
                <span
                  className={`font-bold ${product.stock > 0 ? "text-slate-700" : "text-red-500"}`}
                >
                  {product.stock > 0
                    ? `${product.stock} Unit Tersisa`
                    : "Stok Habis"}
                </span>
              </div>

              {/* Subtotal Kalkulasi */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">
                  Subtotal Estimasi
                </span>
                <span className="font-mono font-black text-[#0D241F] text-sm">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(product.price * quantity)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleAddMultipleToCart(false)}
                  disabled={product.stock <= 0}
                  className="w-full bg-white border border-[#0D241F] text-[#0D241F] hover:bg-slate-50 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400"
                >
                  + Keranjang Belanja
                </button>
                <button
                  onClick={() => handleAddMultipleToCart(true)}
                  disabled={product.stock <= 0}
                  className="w-full bg-[#0D241F] hover:bg-emerald-950 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition cursor-pointer border-none disabled:bg-slate-300"
                >
                  Beli Langsung Sekarang ➔
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION ULASAN KOMUNITAS */}
        <div className="mt-20 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-black text-[#0D241F] tracking-tight mb-6">
            Ulasan Pembeli ({reviews.length})
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* List Review */}
            <div className="lg:col-span-8 space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-2xs flex gap-4"
                >
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border border-emerald-100">
                    {rev.reviewer_name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-extrabold text-xs text-[#0D241F]">
                        {rev.reviewer_name}
                      </h4>
                      <span className="text-amber-400 text-[10px]">
                        {"★".repeat(rev.rating)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Tambah Review */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
              <h3 className="font-black text-xs text-[#0D241F] uppercase tracking-wider">
                Bagikan Penilaian Anda
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Skala Rating
                  </label>
                  <div className="flex gap-1.5 text-xl text-slate-300 cursor-pointer">
                    {["★", "★", "★", "★", "★"].map((star, i) => (
                      <span key={i} className="hover:text-amber-400 transition">
                        {star}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Tulis Feedback
                  </label>
                  <textarea
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:bg-white focus:border-emerald-600 outline-none resize-none leading-relaxed text-slate-600"
                    placeholder="Berikan ulasan jujur tentang kualitas produk..."
                  ></textarea>
                </div>
                <button
                  onClick={() =>
                    alert(
                      "Simulasi: Fitur pengiriman ulasan produk disimpan ke antrean level 6.",
                    )
                  }
                  className="w-full bg-[#0D241F] text-white font-bold py-2 rounded-xl border-none text-xs cursor-pointer hover:bg-emerald-950 transition shadow-xs"
                >
                  Kirim Ulasan Publik
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
