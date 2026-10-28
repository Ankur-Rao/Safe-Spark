import { Plus, Star } from 'lucide-react';
import { productIcon } from './productIcons';

export function ProductArt({ product, size = 'md' }) {
  const Icon = productIcon(product.icon);
  const dims = { sm: 'h-20', md: 'h-32', lg: 'h-44' }[size];
  const iconSize = { sm: 28, md: 44, lg: 62 }[size];

  return (
    <div
      className={`relative ${dims} w-full overflow-hidden rounded-xl`}
      style={{
        background: `radial-gradient(120% 100% at 30% 0%, ${product.accent}2e 0%, rgba(10,14,24,0.9) 70%)`,
      }}
    >
      <span
        aria-hidden
        className="absolute -right-5 -top-5 h-20 w-20 rounded-full blur-2xl"
        style={{ background: `${product.accent}40` }}
      />
      <span className="absolute inset-0 grid place-items-center">
        <Icon size={iconSize} style={{ color: product.accent }} strokeWidth={1.6} />
      </span>
    </div>
  );
}

export default function ProductCard({ product, onOpen, onAdd }) {
  return (
    <article className="panel-flat flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="p-2.5 text-left transition hover:bg-white/[0.03]"
        aria-label={`View ${product.name}`}
      >
        <div className="relative">
          <ProductArt product={product} />
          {product.badge ? (
            <span
              className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-bold
                         uppercase tracking-wider text-ink-900"
              style={{ background: product.accent }}
            >
              {product.badge}
            </span>
          ) : null}
        </div>

        <h3 className="mt-2.5 text-[13px] font-bold leading-tight text-white">
          {product.name}
        </h3>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{product.tagline}</p>

        <div className="mt-2 flex items-center gap-1.5">
          <Star size={11} className="fill-warn-400 text-warn-400" />
          <span className="text-[11px] font-semibold text-slate-300">{product.rating}</span>
          <span className="text-[11px] text-slate-600">
            ({product.reviews.toLocaleString()})
          </span>
        </div>
      </button>

      <div className="mt-auto flex items-center gap-2 border-t border-white/5 px-2.5 py-2.5">
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-white">
            ${product.price.toFixed(2)}
          </span>
          {product.compareAt ? (
            <span className="block text-[10.5px] text-slate-600 line-through">
              ${product.compareAt.toFixed(2)}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => onAdd(product.id)}
          aria-label={`Add ${product.name} to cart`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-spark-500 text-ink-900
                     transition hover:bg-spark-400 active:scale-95"
        >
          <Plus size={17} strokeWidth={2.6} />
        </button>
      </div>
    </article>
  );
}
