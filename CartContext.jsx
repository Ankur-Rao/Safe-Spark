import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PRODUCTS } from '../data/products';
import { useLocalStorage } from '../lib/hooks';
import { useAlerts } from './AlertContext';

const CartContext = createContext(null);

const SHIPPING_FLAT = 4.95;
const FREE_SHIPPING_OVER = 50;

export function CartProvider({ children }) {
  const { toast } = useAlerts();
  const [lines, setLines] = useLocalStorage('safespark.cart.v1', []);
  const [open, setOpen] = useState(false);

  const addToCart = useCallback(
    (productId, qty = 1) => {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) return;
      setLines((list) => {
        const existing = list.find((l) => l.id === productId);
        if (existing) {
          return list.map((l) =>
            l.id === productId ? { ...l, qty: Math.min(99, l.qty + qty) } : l,
          );
        }
        return [...list, { id: productId, qty }];
      });
      toast(`${product.name} added to cart`, 'safe', 2600);
    },
    [setLines, toast],
  );

  const setQty = useCallback(
    (productId, qty) => {
      setLines((list) =>
        qty <= 0
          ? list.filter((l) => l.id !== productId)
          : list.map((l) => (l.id === productId ? { ...l, qty: Math.min(99, qty) } : l)),
      );
    },
    [setLines],
  );

  const removeFromCart = useCallback(
    (productId) => setLines((list) => list.filter((l) => l.id !== productId)),
    [setLines],
  );

  const clearCart = useCallback(() => setLines([]), [setLines]);

  const items = useMemo(
    () =>
      lines
        .map((line) => {
          const product = PRODUCTS.find((p) => p.id === line.id);
          return product ? { ...product, qty: line.qty } : null;
        })
        .filter(Boolean),
    [lines],
  );

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items],
  );
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
  const total = subtotal + shipping;

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      shipping,
      total,
      freeShippingOver: FREE_SHIPPING_OVER,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      open,
      setOpen,
    }),
    [items, count, subtotal, shipping, total, addToCart, setQty, removeFromCart, clearCart, open],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
