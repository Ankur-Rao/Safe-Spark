import { useMemo, useState } from 'react';
import { Search, ShoppingBag, X } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import ProductCard from '../components/shop/ProductCard';
import ProductModal from '../components/shop/ProductModal';
import { PRODUCTS, SHOP_CATEGORIES } from '../data/products';
import { useCart } from '../context/CartContext';

export default function ShopPage() {
  const { addToCart, count, setOpen } = useCart();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const inCategory = category === 'all' || p.category === category;
      if (!inCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.blurb.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  return (
    <div className="min-h-[calc(100dvh-58px-var(--sa-bottom))] pb-8">
      <AppHeader
        title="Safety Gear"
        subtitle="Vetted carry, shipped to campus"
        actions={
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Open cart, ${count} items`}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full
                       text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ShoppingBag size={19} />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 min-w-[17px] rounded-full bg-spark-500
                               px-1 text-[10px] font-bold leading-[17px] text-ink-900">
                {count}
              </span>
            ) : null}
          </button>
        }
      />

      <div className="px-4 pt-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alarms, spray, door stops…"
            className="input pl-10 pr-10"
            aria-label="Search products"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center
                         rounded-full text-slate-500 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="scroll-area mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {SHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={`chip shrink-0 ${category === cat.id ? 'chip-on' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-slate-500">
          Nothing matches “{query}”. Try “alarm”, “spray” or “door”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          {results.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={setSelected}
              onAdd={addToCart}
            />
          ))}
        </div>
      )}

      <div className="mx-4 mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[12.5px] font-bold text-slate-200">
          How the shop pays for the app
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
          The blue light map, the agent, the incident feed and SOS stay free for every student.
          Affiliate commission on gear is what covers the hosting and the SMS bill — so the
          safety features never need a paywall or your data.
        </p>
      </div>

      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={addToCart}
      />
    </div>
  );
}
