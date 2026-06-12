import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabaseClient";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    getCartCount,
    clearCart,
  } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // =========================================================================
  // 🏪 LOGIKA CHECKOUT MULTI-TABEL SINKRON DENGAN OTOMATISASI STOK DB
  // =========================================================================
  const handleCheckout = async () => {
    // Ambil sesi user otentikasi Supabase secara langsung & valid
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      alert("Silakan login terlebih dahulu untuk melanjutkan checkout.");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) return;

    try {
      setCheckoutLoading(true);

      // 1. Kelompokkan item berdasarkan 'store_id'
      const itemsByStore = cartItems.reduce((acc, item) => {
        if (!acc[item.store_id]) {
          acc[item.store_id] = [];
        }
        acc[item.store_id].push(item);
        return acc;
      }, {});

      // 2. Iterasi proses pembuatan order untuk setiap grup toko
      for (const storeId in itemsByStore) {
        const storeProducts = itemsByStore[storeId];

        // Hitung akumulasi subtotal harga untuk toko ini
        const storeSubtotal = storeProducts.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        const deliveryFee = 10000;
        const taxAmount = Math.round(storeSubtotal * 0.1);
        const finalTotal = storeSubtotal + deliveryFee + taxAmount;
        const defaultAddress = "Alamat Pengiriman Utama Pembeli";

        const initialStatus = "Sedang Dikemas";
        const deliveryMethod = "Instant";

        // A. SIMPAN KE TABEL 'orders' (Data Induk Master)
        const { data: insertedOrder, error: masterOrderError } = await supabase
          .from("orders")
          .insert([
            {
              buyer_id: authUser.id,
              store_id: storeId,
              subtotal: Number(storeSubtotal),
              discount_amount: 0,
              delivery_fee: Number(deliveryFee),
              tax_amount: Number(taxAmount),
              final_total: Number(finalTotal),
              delivery_method: deliveryMethod,
              delivery_address: defaultAddress,
              current_status: initialStatus,
            },
          ])
          .select("id")
          .single();

        if (masterOrderError) throw masterOrderError;
        const newOrderId = insertedOrder.id;

        // B. SIMPAN KE TABEL 'order_items'
        // (Stok produk akan berkurang secara otomatis di Supabase berkat Trigger SQL)
        for (const item of storeProducts) {
          const { error: itemInsertError } = await supabase
            .from("order_items")
            .insert([
              {
                order_id: newOrderId,
                product_id: item.id,
                product_name: item.product_name,
                price: Number(item.price),
                quantity: Number(item.quantity),
              },
            ]);

          if (itemInsertError) throw itemInsertError;
        }

        // C. SIMPAN KE TABEL 'order_status_histories' (Log Riwayat Status)
        const { error: historyError } = await supabase
          .from("order_status_histories")
          .insert([
            {
              order_id: newOrderId,
              status: initialStatus,
              changed_by: authUser.id,
            },
          ]);

        if (historyError) throw historyError;
      }

      clearCart();
      alert(
        "Selamat! Checkout berhasil diproses dan stok produk telah berkurang otomatis.",
      );
      navigate("/");
    } catch (error) {
      alert(`Gagal memproses checkout: ${error.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#23263B] font-sans antialiased">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 p-4 shadow-xs">
        <div className="container mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-black text-[#0D241F] flex items-center gap-2 border-none bg-transparent cursor-pointer"
          >
            <span className="text-emerald-600">🛒</span> SEAPEDIA
          </button>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Shopping Cart
          </h2>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* LEFT: CART ITEMS */}
          <div className="flex-1 space-y-6">
            <h1 className="text-3xl font-black text-[#0D241F] tracking-tight">
              Your Cart ({getCartCount()} items)
            </h1>

            {cartItems.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[32px] p-20 text-center">
                <span className="text-6xl block mb-4">🛒</span>
                <p className="text-slate-400 font-bold mb-6">
                  Keranjang Anda masih kosong.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-[#0D241F] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-950 transition border-none cursor-pointer"
                >
                  Mulai Belanja Sekarang ➔
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200/60 rounded-[28px] p-5 flex gap-6 items-center shadow-xs hover:border-emerald-200 transition"
                  >
                    <div className="w-24 h-24 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img
                        src={
                          item.image_url && item.image_url.length > 0
                            ? item.image_url[0]
                            : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
                        }
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[#0D241F] text-base truncate">
                        {item.product_name}
                      </h4>
                      <p className="text-emerald-600 font-mono font-bold text-sm mt-1">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(item.price)}
                      </p>

                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1 gap-3">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border-none shadow-sm font-bold text-slate-500 hover:text-emerald-600 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-black text-xs w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border-none shadow-sm font-bold text-slate-500 hover:text-emerald-600 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-600 font-bold text-[10px] uppercase tracking-widest border-none bg-transparent cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Subtotal
                      </p>
                      <p className="font-mono font-black text-[#0D241F] mt-1">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: SUMMARY */}
          {cartItems.length > 0 && (
            <div className="w-full lg:w-80">
              <div className="bg-[#0D241F] text-white p-8 rounded-[40px] shadow-xl sticky top-24">
                <h3 className="text-xl font-black mb-6">Order Summary</h3>

                <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
                  <div className="flex justify-between text-xs opacity-70">
                    <span>Subtotal Items</span>
                    <span>{getCartCount()}</span>
                  </div>
                  <div className="flex justify-between text-xs opacity-70">
                    <span>Shipping Fee</span>
                    <span>Rp 10.000</span>
                  </div>
                  <div className="flex justify-between text-xs opacity-70">
                    <span>Tax (PPN 10%)</span>
                    <span>
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(getCartTotal() * 0.1)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-bold uppercase tracking-widest opacity-60">
                    Total Bill
                  </span>
                  <span className="text-2xl font-black font-mono">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(getCartTotal() + 10000 + getCartTotal() * 0.1)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0D241F] font-black py-4 rounded-2xl transition shadow-lg cursor-pointer border-none disabled:bg-slate-500 disabled:text-slate-300"
                >
                  {checkoutLoading
                    ? "Memproses Checkout..."
                    : "Proceed to Checkout ➔"}
                </button>

                <p className="text-center text-[10px] opacity-40 mt-6 leading-relaxed">
                  By completing your purchase, you agree to Seapedia Terms of
                  Service and Privacy Policy.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
