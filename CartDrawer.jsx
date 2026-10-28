import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAlerts } from '../../context/AlertContext';
import { useDismissable } from '../../lib/hooks';
import { ProductArt } from './ProductCard';

export default function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    shipping,
    total,
    freeShippingOver,
    setQty,
    removeFromCart,
    clearCart,
    open,
    setOpen,
  } = useCart();
  const { toast } = useAlerts();
  const [placing, setPlacing] = useState(false);

  useDismissable(open, () => setOpen(false));
  if (!open) return null;

  const checkout = () => {
    setPlacing(true);
    // Checkout is the next build step: Stripe Checkout session created from a
    // Supabase edge function, with the affiliate path staying as the free route.
    setTimeout(() => {
      setPlacing(false);
      clearCart();
      setOpen(false);
      toast('Demo checkout complete — no payment was taken.', 'safe', 5000);
    }, 1100);
  };

  const toFreeShipping = Math.max(0, freeShippingOver - subtotal);

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end" role="dialog" aria-label="Cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={() => setOpen(false)}
        className="absolute inset-0 animate-fadeIn bg-black/70 backdrop-blur-sm"
      />

      <aside
        className="relative flex h-full w-full max-w-md animate-slideUp flex-col border-l
                   border-white/10 bg-ink-800 shadow-panel sm:animate-fadeIn"
      >
        <header className="flex items-center gap-3 border-b border-white/10 px-5 pb-4
                           pt-[max(1.25rem,var(--sa-top))]">
          <ShoppingBag size={19} className="text-spark-400" />
          <h2 className="flex-1 text-lg font-bold text-white">
            Cart {count > 0 ? <span className="text-slate-500">({count})</span> : null}
          </h2>
          {items.length ? (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-slate-500 transition hover:text-danger-400"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400
                       transition hover:bg-white/10 hover:text-white"
          >
            <X size={19} />
          </button>
        </header>

        <div className="scroll-area flex-1 px-5 py-4">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag size={34} className="mx-auto text-slate-700" />
              <p className="mt-3 text-sm text-slate-400">Your cart is empty.</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost mt-4"
              >
                Browse gear
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="w-16 shrink-0">
                    <ProductArt product={item} size="sm" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold leading-tight text-white">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      ${item.price.toFixed(2)} each
                    </p>

                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty - 1)}
                        aria-label={`Decrease ${item.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/12
                                   bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-mono text-sm font-bold text-white">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, item.qty + 1)}
                        aria-label={`Increase ${item.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-white/12
                                   bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
                      >
                        <Plus size={14} />
                      </button>

                      <span className="ml-auto text-sm font-bold text-white">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500
                                   transition hover:bg-danger-500/15 hover:text-danger-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length ? (
          <footer className="border-t border-white/10 px-5 pb-[max(1.25rem,var(--sa-bottom))] pt-4">
            {toFreeShipping > 0 ? (
              <p className="mb-3 rounded-xl border border-spark-400/25 bg-spark-500/10 px-3 py-2
                            text-[11.5px] text-spark-400">
                ${toFreeShipping.toFixed(2)} more for free shipping.
              </p>
            ) : null}

            <dl className="mb-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <dt>Subtotal</dt>
                <dd>${subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-slate-400">
                <dt>Shipping</dt>
                <dd>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-base
                              font-bold text-white">
                <dt>Total</dt>
                <dd>${total.toFixed(2)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={checkout}
              disabled={placing}
              className="btn-primary w-full"
            >
              {placing ? 'Processing…' : 'Checkout'}
            </button>
            <p className="mt-2 text-center text-[10.5px] text-slate-600">
              Demo checkout — no payment is taken and nothing ships. Stripe comes in the next build.
            </p>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
