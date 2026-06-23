/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";
import toast from "react-hot-toast";

export default function MyReviewsApp() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useRole();

  // State untuk data list ulasan
  const [myReviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk form input ulasan baru
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Mengambil nama user yang sedang login secara dinamis
  const currentUserName = user?.user_metadata?.full_name || "Airin Ristiana";

  // 🔄 FETCH DATA: Ambil ulasan dari tabel app_reviews khusus nama user terkait
  const fetchMyReviews = async () => {
    if (!currentUserName) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("app_reviews")
        .select("*")
        .ilike("reviewer_name", currentUserName.trim())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error("Gagal memuat ulasan personal:", err.message);
      setError(err.message);
      toast.error("Gagal memuat ulasan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && user) {
      fetchMyReviews();
    }
  }, [user, roleLoading]);

  // 🚀 SUBMIT DATA: Kirim ulasan baru ke tabel app_reviews Supabase
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Harap isi komentar feedback Anda.");
      return;
    }

    try {
      setSubmitLoading(true);

      const { data, error } = await supabase
        .from("app_reviews")
        .insert([
          {
            reviewer_name: currentUserName.trim(),
            rating: Number(rating),
            comment: comment.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Ulasan Anda berhasil disimpan!");
      setComment("");

      // Masukkan data baru ke state agar UI langsung ter-update secara real-time
      if (data) {
        setReviews((prev) => [data, ...prev]);
      }
    } catch (err) {
      toast.error(`Gagal mengirim ulasan: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-10 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-xs text-red-600 font-bold">Gagal memuat ulasan: {error}</p>
          <button onClick={() => fetchMyReviews()} className="mt-4 px-4 py-2 bg-[#0D241F] text-white rounded-xl text-xs font-bold border-none cursor-pointer hover:bg-emerald-950 transition">Coba Lagi</button>
        </div>
      </div>
    );
  }

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* HEADER HALAMAN */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0D241F] hover:bg-slate-50 transition cursor-pointer font-bold"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
            Ulasan Saya
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Kelola dan kirim ulasan pengalaman Anda selama mengeksplorasi
            ekosistem platform Seapedia.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM TAMBAH ULASAN BARU (KIRI) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-3xs">
          <h3 className="font-extrabold text-sm text-[#0D241F] uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            Tulis Ulasan Baru
          </h3>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Nama Peninjau (Otomatis)
              </label>
              <input
                type="text"
                disabled
                value={currentUserName}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Skala Penilaian (Rating)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-2.5 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600/20 transition cursor-pointer font-bold text-slate-700 appearance-none"
              >
                <option value="5">★★★★★ (5 - Luar Biasa)</option>
                <option value="4">★★★★ (4 - Sangat Bagus)</option>
                <option value="3">★★★ (3 - Cukup Baik)</option>
                <option value="2">★★ (2 - Kurang Puas)</option>
                <option value="1">★ (1 - Buruk)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Isi Feedback Komentar
              </label>
              <textarea
                rows="4"
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Berikan masukan jujur Anda tentang UI atau performa sistem transaksi..."
                className="w-full bg-[#F5F6F6] border border-transparent rounded-xl py-2.5 px-3 text-xs outline-none focus:bg-white focus:border-emerald-600/20 focus:shadow-3xs transition resize-none leading-relaxed text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-[#0D241F] hover:bg-emerald-950 text-white font-black text-[10px] py-3 rounded-xl transition shadow-xs border-none cursor-pointer uppercase tracking-widest disabled:bg-slate-300"
            >
              {submitLoading ? "Mengirim Data..." : "Kirim Ulasan Sekarang"}
            </button>
          </form>
        </div>

        {/* BOARD TEMPAT LIST ULASAN YANG PERNAH DIBUAT (KANAN) */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-extrabold text-sm text-[#0D241F] uppercase tracking-wider mb-2">
            Riwayat Riil Ulasan Anda ({myReviews.length})
          </h3>

          {myReviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 px-4">
              <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">
                Anda belum pernah mengirimkan ulasan apapun ke dalam sistem
                tabel app_reviews.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {myReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/70 flex flex-col justify-between shadow-3xs hover:border-emerald-600/20 transition-all duration-300"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-black text-[#0D241F] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                        ID: #{review.id}
                      </span>
                      <span className="text-amber-500 text-[10px] font-bold tracking-widest">
                        {"★".repeat(review.rating)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                    <span className="font-sans font-black text-emerald-800 uppercase">
                      {review.reviewer_name}
                    </span>
                    <span>
                      {new Date(review.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
