/* eslint-disable react-hooks/set-state-in-effect */
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

  // 🚀 STATE BARU: Opsi Metode Pengiriman (Ongkir Dinamis)
  const [deliveryMethod, setDeliveryMethod] = useState("Regular");

  // DEFINISI TARIF ONGKIR BERDASARKAN METODE
  const deliveryRates = {
    Instant: 25000,
    "Next Day": 15000,
    Regular: 10000,
  };

  // KALKULASI UTAMA TRANSKASIONAL (PPN 12%)
  const totalCartPrice = getCartTotal();
  const currentDeliveryFee =
    cartItems.length > 0 ? deliveryRates[deliveryMethod] : 0;
  const taxAmount = Math.round(totalCartPrice * 0.12); // 🚀 UPDATE: PPN 12%
  const grandTotal = totalCartPrice + currentDeliveryFee + taxAmount;

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);

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

      // TARIK SALDO DARI TABEL PROFILES
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileError)
        throw new Error(
          `Gagal memuat profil keuangan: ${profileError.message}`,
        );

      const currentDbBalance = profileData
        ? Number(profileData.wallet_balance || 0)
        : 0;

      if (currentDbBalance < grandTotal) {
        alert(
          `Saldo Dompet Anda (Rp ${new Intl.NumberFormat("id-ID").format(currentDbBalance)}) tidak mencukupi untuk membayar tagihan sebesar Rp ${new Intl.NumberFormat("id-ID").format(grandTotal)}. Silakan melakukan Top-Up.`,
        );
        navigate("/wallet");
        return;
      }

      // DEBIT POTONG SALDO DI TABEL PROFILES
      const newBalance = currentDbBalance - grandTotal;
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", authUser.id);

      if (updateProfileError)
        throw new Error(
          `Gagal memotong saldo wallet: ${updateProfileError.message}`,
        );

      // Sinkronisasi LocalStorage Fallback
      const walletKey = `seapedia_wallet_${authUser.id}`;
      const walletStr = localStorage.getItem(walletKey);
      let localWalletData = walletStr
        ? JSON.parse(walletStr)
        : { balance: 0, transactions: [] };
      localWalletData.balance = newBalance;
      localWalletData.transactions.unshift({
        id: `TX-PAY-${Date.now()}`,
        type: "PAYMENT",
        amount: grandTotal,
        date: new Date().toISOString(),
        description: `Pembayaran pesanan sebanyak ${getCartCount()} item`,
      });
      localStorage.setItem(walletKey, JSON.stringify(localWalletData));

      // GROUP BY MERCHANT / STORE_ID
      const itemsByStore = cartItems.reduce((acc, item) => {
        if (!acc[item.store_id]) {
          acc[item.store_id] = [];
        }
        acc[item.store_id].push(item);
        return acc;
      }, {});

      // ITERASI PEMBUATAN NOTA ORDERS
      for (const storeId in itemsByStore) {
        const storeProducts = itemsByStore[storeId];
        const storeSubtotal = storeProducts.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        const itemTax = Math.round(storeSubtotal * 0.12); // PPN 12% Per Store Split
        const finalTotal = storeSubtotal + currentDeliveryFee + itemTax;
        const defaultAddress = "Alamat Pengiriman Utama Pembeli";
        const initialStatus = "Sedang Dikemas";

        // A. INSERT INTO ORDERS
        const { data: insertedOrder, error: masterOrderError } = await supabase
          .from("orders")
          .insert([
            {
              buyer_id: authUser.id,
              store_id: storeId,
              subtotal: Number(storeSubtotal),
              discount_amount: 0,
              delivery_fee: Number(currentDeliveryFee),
              tax_amount: Number(itemTax),
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

        // B. INSERT INTO ORDER_ITEMS
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

        // C. INSERT INTO ORDER_STATUS_HISTORIES
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
        "Selamat! Checkout berhasil diproses dengan PPN 12% dan kurir opsi pilihan Anda.",
      );
      navigate("/");
    } catch (error) {
      alert(`Gagal memproses checkout: ${error.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 space-y-6">
          <h1 className="text-xl font-extrabold text-[#0D241F] tracking-tight">
            Keranjang Belanja ({getCartCount()} Item)
          </h1>

          {cartItems.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center">
              <p className="text-slate-400 text-sm font-semibold mb-4">
                Keranjang belanja Anda masih kosong.
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-[#0D241F] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-950 transition border-none cursor-pointer"
              >
                Mulai Belanja Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/60 rounded-xl p-4 flex gap-4 items-center shadow-2xs"
                >
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                    <img
                      src={
                        item.image_url && item.image_url.length > 0
                          ? item.image_url[0]
                          : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150"
                      }
                      alt={item.product_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#0D241F] text-sm truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-emerald-800 font-mono font-bold text-xs mt-0.5">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(item.price)}
                    </p>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center bg-slate-100 rounded-lg px-1.5 py-0.5 gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md border-none shadow-3xs font-bold text-slate-500 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-extrabold text-xs w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md border-none shadow-3xs font-bold text-slate-500 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-[10px] uppercase tracking-wider border-none bg-transparent cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 🚀 COMPONENT BARU: OPSI PILIHAN METODE PENGIRIMAN */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D241F] mb-3">
                  Pilih Metode Pengiriman
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(deliveryRates).map((method) => (
                    <label
                      key={method}
                      className={`border p-3 rounded-xl flex flex-col justify-between cursor-pointer transition text-left ${
                        deliveryMethod === method
                          ? "border-emerald-600 bg-emerald-50/30"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="delivery_method"
                          value={method}
                          checked={deliveryMethod === method}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="accent-emerald-700"
                        />
                        <span className="text-xs font-bold text-[#0D241F]">
                          {method}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-800 mt-2">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(deliveryRates[method])}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: SUMMARY CARD */}
        {cartItems.length > 0 && (
          <div className="w-full lg:w-80">
            <div className="bg-[#0D241F] text-white p-6 rounded-2xl shadow-sm sticky top-24">
              <h3 className="text-base font-extrabold mb-4 uppercase tracking-wider text-slate-200">
                Ringkasan Belanja
              </h3>

              <div className="space-y-3 border-b border-white/10 pb-4 mb-4 text-xs font-medium">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal Items</span>
                  <span className="font-mono">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(totalCartPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Ongkos Kirim ({deliveryMethod})</span>
                  <span className="font-mono">
                    Rp{" "}
                    {new Intl.NumberFormat("id-ID").format(currentDeliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>PPN (12%)</span>
                  <span className="font-mono">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(taxAmount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  Total Tagihan
                </span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(grandTotal)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0D241F] font-black py-3.5 rounded-xl text-xs transition shadow-md cursor-pointer border-none disabled:bg-slate-700 disabled:text-slate-400"
              >
                {checkoutLoading ? "Memproses Transaksi..." : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
