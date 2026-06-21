/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";

export default function DriverRevenuePage() {
  const { user } = useRole();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk filter bulan (Format: "YYYY-MM")
  const [selectedMonth, setSelectedMonth] = useState("");

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchRevenue = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("order_status_histories")
        .select(
          `
          id,
          created_at,
          order_id,
          orders (
            id,
            final_total,
            delivery_fee,
            delivery_method,
            profiles:buyer_id (full_name)
          )
        `,
        )
        .eq("changed_by", user.id)
        .eq("status", "Pesanan Selesai")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistoryList(data || []);

      // Set default selektor ke bulan saat ini jika belum diatur
      const currentYearMonth = new Date().toISOString().slice(0, 7); // "2026-06"
      if (!selectedMonth) {
        setSelectedMonth(currentYearMonth);
      }
    } catch (err) {
      console.error("Gagal memuat pendapatan driver:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedMonth]);

  useEffect(() => {
    if (user?.id) {
      fetchRevenue();
    }
  }, [user?.id, fetchRevenue]);

  // 🔄 GENERATE DAFTAR PILIHAN BULAN DARI DATA YANG TERSEDIA DI DATABASE (UNTUK DROPDOWN FILTER)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();

    // Pastikan bulan sekarang selalu ada di daftar pilihan teratas
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentYearMonth);

    historyList.forEach((item) => {
      if (item.created_at) {
        const ym = item.created_at.slice(0, 7); // Mengambil string "YYYY-MM"
        monthsSet.add(ym);
      }
    });

    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [historyList]);

  // 📊 FILTER DATA DATA RIWAYAT BERDASARKAN BULAN YANG DIPILIH
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      if (!item.created_at) return false;
      return item.created_at.startsWith(selectedMonth);
    });
  }, [historyList, selectedMonth]);

  // 🧮 KALKULASI METRIK FINANSIAL BERDASARKAN HASIL FILTER BULANAN
  const monthlyStats = useMemo(() => {
    const totalCount = filteredHistory.length;
    const earnings = filteredHistory.reduce(
      (sum, item) => sum + Number(item.orders?.delivery_fee || 0),
      0,
    );
    return {
      earnings,
      totalCount,
    };
  }, [filteredHistory]);

  // Format teks nama bulan bahasa Indonesia untuk title banner (contoh: "Juni 2026")
  const formatMonthTitle = (yearMonthStr) => {
    if (!yearMonthStr) return "";
    const [year, month] = yearMonthStr.split("-");
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  return (
    <div className="font-poppins space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto p-4">
      {/* HEADER & FILTER SELEKTOR BULANAN */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-[#0D241F]">
            Pendapatan Per Bulan
          </h1>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            Rincian komisi masuk dan performa manifesto pengantaran logistik
            driver Seapedia
          </p>
        </div>

        {/* Dropdown Filter Month */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-black text-[#0D241F] uppercase tracking-wider">
            Periode:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 text-[#0D241F] text-xs font-bold py-2.5 px-4 rounded-xl outline-none focus:border-emerald-600 transition cursor-pointer shadow-3xs"
          >
            {availableMonths.map((monthStr) => (
              <option key={monthStr} value={monthStr}>
                {formatMonthTitle(monthStr)}{" "}
                {monthStr === new Date().toISOString().slice(0, 7)
                  ? "(Bulan Ini)"
                  : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RANGKUMAN KARTU METRIK FINANSIAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0D241F] rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl border border-[#163831]">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">
              Pendapatan Dompet • {formatMonthTitle(selectedMonth)}
            </p>
            <h2
              className="text-4xl font-black font-mono tracking-tight"
              style={{ color: "#10B981" }}
            >
              Rp {monthlyStats.earnings.toLocaleString("id-ID")}
            </h2>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 w-fit px-3 py-1.5 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              Dana Terakumulasi Sukses
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mb-2">
            Pekerjaan Selesai • {formatMonthTitle(selectedMonth)}
          </p>
          <h2 className="text-4xl font-black text-[#0D241F]">
            {monthlyStats.totalCount}{" "}
            <span className="text-sm text-slate-500 font-black uppercase tracking-widest ml-1">
              Paket
            </span>
          </h2>
          <p className="text-xs text-slate-700 font-medium mt-8 leading-relaxed">
            Total perjalanan sukses mengantar barang dari toko ke konsumen pada
            periode{" "}
            <span className="text-[#0D241F] font-black">
              {formatMonthTitle(selectedMonth)}
            </span>
            .
          </p>
        </div>
      </div>

      {/* RIWAYAT PEKERJAAN DETAIL BULANAN */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-[#0D241F] uppercase tracking-wider flex items-center gap-2">
          <span>
            Daftar Transaksi Masuk ({formatMonthTitle(selectedMonth)})
          </span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center shadow-4xs">
            <p className="text-slate-700 text-xs font-semibold">
              Tidak ada data riwayat pendapatan terkunci pada periode{" "}
              {formatMonthTitle(selectedMonth)}.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      Tanggal Selesai
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      ID Nota
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      Metode Kurir
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      Nama Konsumen
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">
                      Upah Masuk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-[#0D241F]">
                        #
                        {item.orders?.id
                          ? `${item.orders.id.slice(0, 8)}...`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] uppercase font-black tracking-wide border border-slate-300">
                          {item.orders?.delivery_method || "Regular"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-[#0D241F]">
                        {item.orders?.profiles?.full_name ||
                          "Pelanggan Seapedia"}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right font-mono">
                        +Rp{" "}
                        {Number(item.orders?.delivery_fee || 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
