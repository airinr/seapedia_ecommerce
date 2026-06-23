/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function AdminMonitoring() {
  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    products: 0,
    orders: 0,
    revenue: 0,
    overdueOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [dataList, setDataList] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      const [
        { count: userCount },
        { count: storeCount },
        { count: productCount },
        { data: orderData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("stores").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("final_total, created_at, current_status"),
      ]);

      const totalRevenue =
        orderData
          ?.filter((o) => o.current_status === "Pesanan Selesai")
          ?.reduce((sum, o) => sum + Number(o.final_total || 0), 0) || 0;

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const overdue =
        orderData?.filter(
          (o) =>
            (o.current_status === "Menunggu Pengirim" ||
              o.current_status === "Sedang Dikirim") &&
            new Date(o.created_at) < threeDaysAgo,
        ).length || 0;

      setStats({
        users: userCount || 0,
        stores: storeCount || 0,
        products: productCount || 0,
        orders: orderData?.length || 0,
        revenue: totalRevenue,
        overdueOrders: overdue,
      });

      // eslint-disable-next-line react-hooks/immutability
      fetchTabData(activeTab);
    } catch (err) {
      console.error("Gagal memuat statistik admin:", err.message);
      toast.error("Gagal memuat statistik");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchTabData = async (tab) => {
    setLoading(true);
    let query;
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    switch (tab) {
      case "users": {
        // 🚀 AMBIL DATA PROFIL SEKALIGUS JOIN ROLE DARI TABEL user_roles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) {
          console.error("Gagal memuat data pengguna:", profilesError.message);
          toast.error("Gagal memuat data pengguna");
          setDataList([]);
          setLoading(false);
          return;
        }

        const userIds = [
          ...new Set(profilesData.map((p) => p.id).filter(Boolean)),
        ];

        if (userIds.length === 0) {
          setDataList(profilesData);
          setLoading(false);
          return;
        }

        // Ambil data role spesifik pengguna
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        const mergedUsers = profilesData.map((profile) => {
          const matchedRole = rolesData?.find((r) => r.user_id === profile.id);
          return {
            ...profile,
            user_roles: matchedRole ? { role: matchedRole.role } : null,
          };
        });

        setDataList(mergedUsers);
        setLoading(false);
        return;
      }
      case "stores": {
        const { data: storesData, error: storesError } = await supabase
          .from("stores")
          .select("*")
          .order("created_at", { ascending: false });

        if (storesError) {
          console.error("Gagal memuat data toko:", storesError.message);
          toast.error("Gagal memuat data toko");
          setDataList([]);
          setLoading(false);
          return;
        }

        const ownerIds = [
          ...new Set(storesData.map((s) => s.owner_id).filter(Boolean)),
        ];

        if (ownerIds.length === 0) {
          setDataList(storesData);
          setLoading(false);
          return;
        }

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds);

        const mergedData = storesData.map((store) => {
          const matchedProfile = profilesData?.find(
            (p) => p.id === store.owner_id,
          );
          return {
            ...store,
            profiles: matchedProfile
              ? { full_name: matchedProfile.full_name }
              : null,
          };
        });

        setDataList(mergedData);
        setLoading(false);
        return;
      }
      case "products":
        query = supabase
          .from("products")
          .select("*, stores:store_id(store_name)")
          .order("created_at", { ascending: false });
        break;
      case "orders":
        query = supabase
          .from("orders")
          .select(
            "*, profiles:buyer_id(full_name), stores:store_id(store_name)",
          )
          .order("created_at", { ascending: false });
        break;
      case "discounts":
        query = supabase
          .from("discounts")
          .select("*")
          .order("created_at", { ascending: false });
        break;
      case "overdue":
        query = supabase
          .from("orders")
          .select(
            "*, profiles:buyer_id(full_name), stores:store_id(store_name)",
          )
          .lt("created_at", threeDaysAgo.toISOString())
          .or(
            "current_status.eq.Menunggu Pengirim,current_status.eq.Sedang Dikirim",
          )
          .order("created_at", { ascending: false });
        break;
      default:
        return;
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Gagal memuat data kategori ${tab}:`, error.message);
      toast.error(`Gagal memuat data ${tab}`);
      setDataList([]);
    } else {
      setDataList(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Pesanan Selesai":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "Sedang Dikirim":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Menunggu Pengirim":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Sedang Dikemas":
        return "bg-slate-100 text-slate-700 border-slate-200/60";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200/40";
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "Admin":
        return "bg-red-50 text-red-700 border-red-200/60";
      case "Seller":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Driver":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300/60";
    }
  };

  return (
    <div className="font-poppins space-y-6 max-w-7xl mx-auto p-4 animate-in fade-in duration-300">
      {/* JUDUL UTAMA */}
      <div className="pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-black text-[#0D241F] tracking-tight">
          Pemantauan Sistem
        </h1>
        <p className="text-xs text-slate-600 font-semibold mt-0.5">
          Pusat kendali operasional data dan pengawasan aktivitas ekosistem
          platform Seapedia.
        </p>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Pengguna",
            value: stats.users.toLocaleString("id-ID"),
            border: "border-slate-200/70",
          },
          {
            label: "Total Toko",
            value: stats.stores.toLocaleString("id-ID"),
            border: "border-slate-200/70",
          },
          {
            label: "Total Produk",
            value: stats.products.toLocaleString("id-ID"),
            border: "border-slate-200/70",
          },
          {
            label: "Total Pesanan",
            value: stats.orders.toLocaleString("id-ID"),
            border: "border-slate-200/70",
          },
          {
            label: "Pesanan Terhambat",
            value: stats.overdueOrders,
            border:
              stats.overdueOrders > 0
                ? "border-red-200 bg-red-50/20 text-red-600 font-black animate-pulse"
                : "border-slate-200/70 text-slate-600",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`bg-white border rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[90px] ${card.border}`}
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {card.label}
            </p>
            <p className="text-xl font-black mt-2 font-mono tracking-tight text-[#0D241F]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* MENU TABS */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-px overflow-x-auto whitespace-nowrap">
        {[
          { id: "users", label: "Daftar Pengguna" },
          { id: "stores", label: "Daftar Toko" },
          { id: "products", label: "Katalog Produk" },
          { id: "orders", label: "Semua Pesanan" },
          { id: "discounts", label: "Voucher & Promo" },
          { id: "overdue", label: "Pesanan Terhambat" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-3 text-[10px] font-black transition-all border-b-2 uppercase tracking-widest ${
              activeTab === tab.id
                ? "border-[#0D241F] text-[#0D241F]"
                : "border-transparent text-slate-400 hover:text-slate-700"
            } cursor-pointer bg-transparent`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABEL DATA HASIL MONITORING */}
      <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D241F]"></div>
          </div>
        ) : dataList.length === 0 ? (
          <div className="py-20 text-center space-y-1.5">
            <h3 className="text-sm font-bold text-[#0D241F]">Data Kosong</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
              Tidak ditemukan data riwayat operasional terbaru untuk kategori
              ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Informasi Utama
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Keterangan
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-700 uppercase tracking-widest text-right">
                    Tanggal Dicatat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dataList.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#0D241F] truncate max-w-[260px]">
                          {item.full_name ||
                            item.store_name ||
                            item.product_name ||
                            item.code ||
                            `Nota #${item.id?.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 select-all">
                          ID: {item.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] text-slate-700 font-bold leading-normal">
                        {activeTab === "users" &&
                          (item.phone_number || "Nomor HP Belum Diisi")}
                        {activeTab === "stores" &&
                          `Pemilik: ${item.profiles?.full_name || "Tidak Diketahui"}`}
                        {activeTab === "products" &&
                          `Toko Asal: ${item.stores?.store_name || "Tidak Diketahui"}`}
                        {activeTab === "orders" &&
                          `Pembeli: ${item.profiles?.full_name || "Tidak Diketahui"}`}
                        {activeTab === "discounts" &&
                          `Tipe: ${item.type === "Voucher" ? "Voucher Kode" : "Promo Otomatis"} • Sisa Kuota: ${item.remaining_usage ?? 0}x`}
                        {activeTab === "overdue" &&
                          `Penjual: ${item.stores?.store_name || "Tidak Diketahui"}`}
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-0.5 max-w-[250px] truncate">
                        {activeTab === "users" &&
                          (item.delivery_address ||
                            "Alamat Pengiriman Belum Diisi")}
                        {activeTab === "products" &&
                          `Jumlah Stok: ${item.stock ?? 0} unit`}
                        {activeTab === "orders" &&
                          `Opsi Ojek: ${item.delivery_method || "Regular"}`}
                        {activeTab === "overdue" &&
                          `Pembeli: ${item.profiles?.full_name || "Tidak Diketahui"}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {activeTab === "users" ? (
                        <span
                          className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${getRoleBadgeStyle(item.user_roles?.role)}`}
                        >
                          {item.user_roles?.role || "Buyer"}
                        </span>
                      ) : activeTab === "orders" || activeTab === "overdue" ? (
                        <span
                          className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${getStatusBadgeStyle(item.current_status)}`}
                        >
                          {item.current_status}
                        </span>
                      ) : activeTab === "discounts" ? (
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          -Rp{" "}
                          {Number(item.value_amount || 0).toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      ) : activeTab === "products" ? (
                        <span className="text-xs font-black text-[#0D241F] font-mono">
                          Rp {Number(item.price || 0).toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-600 font-mono">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
