/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../hooks/useRole";
import { supabase } from "../../lib/supabaseClient";

export default function WalletPage() {
  const navigate = useNavigate();
  const { user, loading: roleLoading } = useRole();

  const [balance, setBalance] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchWalletData() {
      if (roleLoading) return;
      if (!user) {
        setDataLoading(false);
        return;
      }

      try {
        setDataLoading(true);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (profileData) {
          setBalance(profileData.wallet_balance || 0);
        }

        const { data: txData, error: txError } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (txError) throw txError;
        setTransactions(txData || []);

        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("final_total")
          .eq("buyer_id", user.id);

        if (ordersError) throw ordersError;

        const calculatedExpense = (ordersData || []).reduce(
          (sum, order) => sum + Number(order.final_total || 0),
          0,
        );
        setTotalExpense(calculatedExpense);
      } catch (error) {
        console.error("Gagal memuat data dompet Supabase:", error.message);
      } finally {
        setDataLoading(false);
      }
    }

    fetchWalletData();
  }, [user, roleLoading]);

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

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (balanceError) throw balanceError;

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

  if (roleLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-6 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-3xl shadow-3xs">
          💳
        </div>
        <h1 className="text-xl font-black text-[#0D241F] tracking-tight">
          Otentikasi Diperlukan
        </h1>
        <p className="text-slate-400 text-xs mt-1 mb-6 max-w-xs leading-relaxed">
          Silakan masuk ke dalam akun Seapedia Anda terlebih dahulu untuk
          mengakses instrumen dompet digital.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="bg-[#0D241F] text-white px-8 py-3 rounded-xl text-xs font-bold border-none cursor-pointer hover:bg-emerald-950 transition-all duration-300 shadow-sm"
        >
          Ke Halaman Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-6xl mx-auto bg-[#FDFDFD] min-h-screen animate-in fade-in duration-300">
      {/* PAGE HEADER */}
      <div className="mb-8 pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
          Seapedia Digital Wallet
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Monitor pergerakan finansial, akumulasi pengeluaran belanja, dan
          manajemen top-up instan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PANEL KIRI: RINGKASAN SALDO & FORM TOPUP (4 KANTONG GRID) */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARD 1: SALDO AKTIF */}
          <div className="bg-gradient-to-br from-[#0D241F] via-[#12312A] to-emerald-950 rounded-[28px] p-6 text-white shadow-md relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-36 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition duration-500"></div>
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
                Active Balance
              </span>
              <h2 className="text-3xl font-black font-mono tracking-tighter mt-4 mb-6">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(balance)}
              </h2>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[9px] text-emerald-400/80 uppercase tracking-wider font-semibold">
                    Account Holder
                  </p>
                  <p className="font-extrabold tracking-tight mt-0.5 max-w-[160px] truncate">
                    {user.user_metadata?.full_name || "Seapedia Member"}
                  </p>
                </div>
                <div className="text-xl bg-white/10 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-xs">
                  💳
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: AKUMULASI PENGELUARAN */}
          <div className="bg-white border border-slate-200/60 rounded-[28px] p-6 shadow-3xs flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Expenses
              </span>
              <h3 className="text-2xl font-black font-mono tracking-tighter text-slate-800">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(totalExpense)}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Total pengeluaran anda
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-xl shadow-4xs shrink-0 text-red-500">
              📉
            </div>
          </div>

          {/* CARD 3: FORM TOP-UP */}
          <div className="bg-white border border-slate-200/60 rounded-[28px] p-6 shadow-3xs">
            <h3 className="font-black text-sm text-[#0D241F] uppercase tracking-wider mb-4">
              Isi Ulang Saldo
            </h3>
            <form onSubmit={handleTopUp} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-black text-slate-400">
                  IDR
                </span>
                <input
                  type="number"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl py-3.5 pl-12 pr-4 text-sm font-mono font-bold outline-none transition"
                  placeholder="0"
                />
              </div>

              {/* QUICK PRESET PREFERENCE BUTTONS */}
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopUpAmount(val.toString())}
                    className={`py-2 rounded-xl text-[10px] font-black transition-all border shadow-4xs cursor-pointer ${
                      Number(topUpAmount) === val
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {val / 1000}K
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-[#0D241F] hover:bg-emerald-950 disabled:bg-slate-200 text-white font-black py-3.5 rounded-xl text-xs tracking-wide transition shadow-xs cursor-pointer mt-2 border-none disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Memproses Transaksi..." : "Konfirmasi Top-Up"}
              </button>
            </form>
          </div>
        </div>

        {/* PANEL KANAN: LIST TRANSKASI (7 KANTONG GRID) */}
        <div className="lg:col-span-7 h-full">
          <div className="bg-white border border-slate-200/60 rounded-[28px] p-6 md:p-7 shadow-3xs h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-sm text-[#0D241F] uppercase tracking-wider">
                Statement Riwayat Transaksi
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-bold px-2 py-0.5 rounded-md">
                Live Data
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-24 flex flex-col items-center justify-center my-auto">
                <span className="text-4xl filter grayscale opacity-40 mb-3">
                  🧾
                </span>
                <p className="text-slate-400 text-xs font-bold">
                  Belum ada mutasi finansial tercatat.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
                {transactions.map((tx) => {
                  const isTopUp = tx.type === "TOPUP";
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-4 transition hover:bg-slate-50/50 hover:border-slate-200/70"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-4xs ${
                            isTopUp
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {isTopUp ? "▼" : "🛒"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-800 text-xs md:text-sm">
                            {isTopUp
                              ? "Top-Up Dana Wallet"
                              : "Pembayaran Belanja"}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {tx.description ||
                              "Transaksi internal e-commerce Seapedia"}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono mt-1">
                            {new Date(tx.created_at || tx.date).toLocaleString(
                              "id-ID",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`font-mono font-black text-xs md:text-sm shrink-0 tracking-tight ${
                          isTopUp ? "text-emerald-600" : "text-slate-800"
                        }`}
                      >
                        {isTopUp ? "+" : "-"}{" "}
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
