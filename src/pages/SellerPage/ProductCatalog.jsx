/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function ProductCatalog() {
  const { products, store, fetchSellerData, user } = useOutletContext();
  const [actionLoading, setActionLoading] = useState(false);

  // Modal & Edit State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);

  // Form State
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("");

  // Image State
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [file3, setFile3] = useState(null);
  const [existingUrls, setExistingUrls] = useState([]);

  // Refs untuk membersihkan file input secara manual
  const fileRef1 = useRef();
  const fileRef2 = useRef();
  const fileRef3 = useRef();

  const uploadImageProcess = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!store?.id) return;

    if (!isEditing && (!file1 || !file2 || !file3)) {
      toast.error("Anda wajib memilih minimal 3 file foto produk.");
      return;
    }

    try {
      setActionLoading(true);
      let finalUrls = isEditing ? [...existingUrls] : [];

      if (isEditing) {
        while (finalUrls.length < 3) finalUrls.push(null);
      }

      if (file1) {
        const url = await uploadImageProcess(file1);
        finalUrls[0] = url;
      }
      if (file2) {
        const url = await uploadImageProcess(file2);
        finalUrls[1] = url;
      }
      if (file3) {
        const url = await uploadImageProcess(file3);
        finalUrls[2] = url;
      }

      const cleanUrls = finalUrls.filter((url) => url !== null);

      const payload = {
        store_id: store.id,
        product_name: prodName,
        description: prodDesc,
        price: Number(prodPrice),
        stock: Number(prodStock),
        image_url: cleanUrls,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", currentProductId);

        if (error) throw error;
        toast.success("Produk berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
        toast.success("Produk baru berhasil ditambahkan!");
      }

      closeAndResetForm();
      fetchSellerData();
    } catch (err) {
      console.error("Save Error:", err.message);
      toast.error("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const closeAndResetForm = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentProductId(null);
    setProdName("");
    setProdDesc("");
    setProdPrice("");
    setProdStock("");
    setFile1(null);
    setFile2(null);
    setFile3(null);
    setExistingUrls([]);
    if (fileRef1.current) fileRef1.current.value = "";
    if (fileRef2.current) fileRef2.current.value = "";
    if (fileRef3.current) fileRef3.current.value = "";
  };

  const handleEditClick = (product) => {
    setIsEditing(true);
    setCurrentProductId(product.id);
    setProdName(product.product_name);
    setProdDesc(product.description || "");
    setProdPrice(product.price);
    setProdStock(product.stock);
    setExistingUrls(product.image_url || []);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Hapus produk ini secara permanen dari katalog?")) return;
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
      toast.success("Produk berhasil dihapus.");
      fetchSellerData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-[32px] p-8 shadow-xs">
        <div>
          <h3 className="font-black text-xl text-[#0D241F]">Katalog Produk</h3>
          <p className="text-slate-400 text-xs mt-1">
            Kelola barang dagangan Anda dengan mudah di sini.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setShowModal(true);
          }}
          className="bg-[#0D241F] hover:bg-emerald-950 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-lg transition border-none cursor-pointer flex items-center gap-2 uppercase tracking-wider"
        >
          Tambah Produk Baru
        </button>
      </div>

      {/* MODAL POPUP (ADD/EDIT) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeAndResetForm}
          ></div>

          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-black text-2xl text-[#0D241F]">
                    {isEditing
                      ? "Edit Informasi Produk"
                      : "Daftarkan Produk Baru"}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Lengkapi detail produk Anda di bawah ini.
                  </p>
                </div>
                <button
                  onClick={closeAndResetForm}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-[#0D241F] hover:bg-slate-200 transition border-none cursor-pointer text-xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition"
                      placeholder="Contoh: Headphones Ultra Pro"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Harga (Rupiah)
                    </label>
                    <input
                      type="number"
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition"
                      placeholder="1250000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Deskripsi Produk
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition resize-none"
                    placeholder="Jelaskan fitur dan keunggulan produk Anda..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Stok Inventaris
                    </label>
                    <input
                      type="number"
                      required
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm focus:bg-white focus:border-emerald-600 outline-none transition"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* IMAGE UPLOAD SECTION */}
                <div className="bg-[#0D241F]/[0.02] border border-slate-100 rounded-[32px] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#0D241F] uppercase tracking-widest">
                      Galeri Foto Produk
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Wajib 3 Foto Utama
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="relative group">
                        <input
                          type="file"
                          accept="image/*"
                          ref={
                            num === 1
                              ? fileRef1
                              : num === 2
                                ? fileRef2
                                : fileRef3
                          }
                          required={!isEditing}
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (num === 1) setFile1(f);
                            if (num === 2) setFile2(f);
                            if (num === 3) setFile3(f);
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-[#0D241F] file:text-white hover:file:bg-emerald-900 transition cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2 items-center">
                      <span className="text-slate-500 text-xs">⚠️</span>
                      <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                        Anda sedang mengedit produk. Kosongkan pilihan file di
                        atas jika ingin mempertahankan foto lama pada posisi
                        tersebut.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeAndResetForm}
                    className="text-xs font-black text-slate-400 hover:text-slate-600 transition uppercase tracking-widest border-none bg-transparent cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-[#0D241F] hover:bg-emerald-950 text-white font-black text-xs px-10 py-4 rounded-2xl shadow-xl transition border-none cursor-pointer disabled:bg-slate-300 uppercase tracking-wider"
                  >
                    {actionLoading
                      ? "Sedang Memproses..."
                      : isEditing
                        ? "Simpan Perubahan"
                        : "Daftarkan Produk"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CATALOG LIST GRID */}
      <div className="bg-white border border-slate-200/80 rounded-[40px] p-8 shadow-xs">
        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-slate-400 font-black text-lg">
              Katalog Toko Masih Kosong
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Mulai tambahkan produk pertama Anda untuk berjualan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="flex flex-col bg-slate-50 rounded-[32px] border border-slate-100 overflow-hidden hover:border-emerald-300 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-56 bg-slate-200 overflow-hidden">
                  {prod.image_url && prod.image_url.length > 0 ? (
                    <img
                      src={prod.image_url[0]}
                      alt={prod.product_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">
                      📦
                    </div>
                  )}
                  <div className="absolute top-5 right-5 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm border border-slate-100 text-[#0D241F]">
                    STOK: {prod.stock}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="font-black text-[#0D241F] text-lg truncate mb-2">
                    {prod.product_name}
                  </h4>
                  <p className="text-slate-400 text-[11px] line-clamp-2 mb-6 flex-1 leading-relaxed">
                    {prod.description ||
                      "Toko belum memberikan deskripsi untuk produk ini."}
                  </p>

                  <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      Harga
                    </span>
                    <span className="font-mono text-[#0D241F] font-black text-base">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(prod.price)}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditClick(prod)}
                      className="flex-1 py-3.5 bg-white hover:bg-[#0D241F] hover:text-white text-[#0D241F] border border-slate-200 rounded-2xl font-black transition-all text-[11px] uppercase tracking-widest cursor-pointer shadow-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="px-4 py-3.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 border border-red-100 rounded-2xl font-black transition-all text-xs cursor-pointer shadow-sm flex items-center justify-center"
                    >
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
