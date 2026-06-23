import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useRole } from "../../hooks/useRole";
import toast from "react-hot-toast";

export default function DriverRegistration() {
  const navigate = useNavigate();
  const { user, setActiveRole, loading: roleLoading } = useRole();

  // State Form
  const [vehicleType, setVehicleType] = useState("Motor");
  const [plateNumber, setPlateNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // State UI
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!roleLoading && user) {
      // Pre-fill phone number jika sudah tersimpan di database profiles
      const fetchProfile = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("phone_number")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.phone_number) setPhoneNumber(data.phone_number);
      };
      fetchProfile();
    }
  }, [roleLoading, user]);

  const handleRegisterDriver = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      setErrorMsg("Sesi login tidak ditemukan.");
      return;
    }

    if (!plateNumber.trim()) {
      setErrorMsg("Nomor plat kendaraan wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert([{ user_id: user.id, role: "Driver" }], {
          onConflict: "user_id",
        });
      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone_number: phoneNumber.trim(),
          vehicle_type: vehicleType, // Kolom Baru Supabase
          license_plate: plateNumber.toUpperCase().trim(), // Kolom Baru Supabase
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (setActiveRole) setActiveRole("Driver");

      toast.success("Pendaftaran Kurir Berhasil! Selamat bertugas di Seapedia.");
      navigate("/driver/dashboard");
    } catch (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 text-[#23263B]">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-sm">
        <div className="text-center mb-10">
          <span className="text-3xl">🚴</span>
          <h1 className="text-3xl font-black text-[#0D241F] tracking-tight mt-4">
            Lengkapi Profil Kurir
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Hanya selangkah lagi untuk mulai menghasilkan pendapatan sebagai
            mitra logistik Seapedia.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-4 rounded-2xl mb-6">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegisterDriver} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Jenis Kendaraan
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition cursor-pointer font-bold text-[#0D241F]"
              >
                <option value="Motor">Sepeda Motor</option>
                <option value="Mobil">Mobil / Van</option>
                <option value="Sepeda">Sepeda</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                Nomor Plat Kendaraan
              </label>
              <input
                type="text"
                required
                placeholder="CONTOH: D 1234 ABC"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition uppercase font-mono font-bold text-[#0D241F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Nomor WhatsApp Aktif
            </label>
            <input
              type="tel"
              required
              placeholder="08xxxxxxxxxx"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition font-bold text-[#0D241F]"
            />
          </div>

          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <div className="flex gap-3">
              <span className="text-emerald-600">🛡️</span>
              <div>
                <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                  Verifikasi Keamanan
                </p>
                <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                  Data kendaraan Anda akan digunakan oleh pembeli untuk
                  mengenali kurir saat penyerahan paket. Pastikan data yang
                  dimasukkan valid.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="w-full bg-white border border-slate-200 text-slate-500 font-bold py-3.5 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D241F] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-2xl shadow-md transition disabled:bg-slate-300 cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Aktifkan Profil Kurir ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
