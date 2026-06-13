import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../hooks/useRole";
import { supabase } from "../../lib/supabaseClient"; // 🚀 Import Supabase Client

export default function WalletPage() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useRole();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // =========================================================================
  // 🔄 1. LOAD DATA SALDO & RIWAYAT TRANSAKSI DARI SUPABASE
  // =========================================================================
  useEffect(() => {
    async function fetchWalletData() {
      if (roleLoading) return;
      if (!user) {
        setDataLoading(false);
        return;
      }

      try {
        setDataLoading(true);

        // A. Ambil saldo aktif ter-update dari tabel kustom profiles kamu
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (profileData) {
          setBalance(profileData.wallet_balance || 0);
        }

        // B. Ambil daftar riwayat transaksi dari tabel wallet_transactions
        const { data: txData, error: txError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (txError) throw txError;
        setTransactions(txData || []);
      } catch (error) {
        console.error("Gagal memuat data dompet Supabase:", error.message);
      } finally {
        setDataLoading(false);
      }
    }

    fetchWalletData();
  }, [user, roleLoading]);

  // =========================================================================
  // 🚀 2. LOGIKA PROSES TOP-UP REAL-TIME KE DATABASE
  // =========================================================================
  const handleTopUp = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);

    if (!amount || amount <= 0) {
      alert("Masukkan nominal top-up yang valid.");
      return;
    }

    try {
      setIsProcessing(true);

      const newBalance = balance + amount;
      const txDescription = "Top-Up Saldo Wallet via Transfer Bank";

      // A. Update nilai saldo baru di tabel profiles
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (balanceError) throw balanceError;

      // B. Catat log riwayat ke tabel wallet_transactions
      const { data: newTx, error: txError } = await supabase
        .from("wallet_transactions")
        .insert([
          {
            user_id: user.id,
            type: "TOPUP",
            amount: amount,
            description: txDescription,
          },
        ])
        .select()
        .single();

      if (txError) throw txError;

      // C. Update State UI lokal agar tersinkronisasi instan tanpa reload halaman
      setBalance(newBalance);
      setTransactions((prev) => [newTx, ...prev]);
      setTopUpAmount("");

      alert(
        `Top-up berhasil! Saldo Anda bertambah Rp ${new Intl.NumberFormat("id-ID").format(amount)}`,
      );
    } catch (error) {
      alert(`Gagal memproses top-up: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const setPresetAmount = (val) => {
    setTopUpAmount(val.toString());
  };

  if (roleLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] p-6 text-center">
        <h2 className="text-4xl mb-4">💳</h2>
        <h1 className="text-2xl font-black text-[#0D241F]">Harap Login</h1>
        <p className="text-slate-400 mt-2 mb-6">
          Anda harus login untuk mengakses Wallet.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#0D241F] text-white px-8 py-3 rounded-xl font-bold border-none cursor-pointer hover:bg-emerald-950 transition shadow-md"
        >
          Ke Halaman Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: WALLET INFO & TOP UP FORM */}
        <div className="lg:col-span-1 space-y-6">
          {/* Saldo Card */}
          <div className="bg-gradient-to-br from-[#0D241F] to-emerald-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400 opacity-10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-1">
                Total Saldo Aktif
              </p>
              <h2 className="text-4xl font-black font-mono tracking-tighter">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(balance)}
              </h2>

              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[9px] text-emerald-300 uppercase tracking-widest">
                    Pemilik
                  </p>
                  <p className="font-bold text-sm truncate max-w-[150px]">
                    {user.user_metadata?.full_name || "User"}
                  </p>
                </div>
                <div className="text-3xl opacity-80">💳</div>
              </div>
            </div>
          </div>

          {/* Top Up Form */}
          <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 md:p-8 shadow-xs">
            <h3 className="font-black text-lg text-[#0D241F] mb-4">
              Top-Up Wallet
            </h3>
            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Nominal Top-Up (IDR)
                </label>
                <input
                  type="number"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-mono font-bold focus:bg-white focus:border-emerald-600 outline-none transition"
                  placeholder="Contoh: 150000"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPresetAmount(val)}
                    className="bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-500 font-bold py-2 rounded-xl text-[10px] transition cursor-pointer"
                  >
                    {val / 1000}K
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl transition shadow-md cursor-pointer mt-2 border-none"
              >
                {isProcessing ? "Memproses Top-Up..." : "Top-Up Sekarang"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: TRANSACTION HISTORY */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200/60 rounded-[32px] p-6 md:p-8 shadow-xs h-full">
            <h3 className="font-black text-xl text-[#0D241F] mb-6">
              Riwayat Transaksi
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <span className="text-5xl opacity-30 mb-4">🧾</span>
                <p className="text-slate-400 font-bold">
                  Belum ada aktivitas transaksi.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 bg-[#F8F9FA] rounded-[20px] border border-slate-100 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${tx.type === "TOPUP" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}
                      >
                        {tx.type === "TOPUP" ? "⬇️" : "🛒"}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0D241F] text-sm">
                          {tx.type === "TOPUP"
                            ? "Top-Up Saldo"
                            : "Pembayaran Pesanan"}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(tx.created_at || tx.date).toLocaleString(
                            "id-ID",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {tx.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`font-mono font-black shrink-0 ${tx.type === "TOPUP" ? "text-emerald-600" : "text-[#0D241F]"}`}
                    >
                      {tx.type === "TOPUP" ? "+" : "-"}{" "}
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
