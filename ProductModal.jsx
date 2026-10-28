import { Check, ExternalLink, Info, ShoppingCart, Star } from 'lucide-react';
import Modal from '../Modal';
import { ProductArt } from './ProductCard';
import { buildAffiliateUrl } from '../../data/products';

export default function ProductModal({ product, onClose, onAdd }) {
  if (!product) return null;

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={product.name}
      subtitle={product.tagline}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onAdd(product.id);
              onClose();
            }}
            className="btn-primary flex-1"
          >
            <ShoppingCart size={17} />
            Add · ${product.price.toFixed(2)}
          </button>
          <a
            href={buildAffiliateUrl(product)}
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            className="btn-ghost flex-1"
          >
            <ExternalLink size={16} />
            Buy now
          </a>
        </div>
      }
    >
      <div className="space-y-4">
        <ProductArt product={product} size="lg" />

        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-white">
            ${product.price.toFixed(2)}
          </span>
          {product.compareAt ? (
            <span className="text-sm text-slate-600 line-through">
              ${product.compareAt.toFixed(2)}
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-1.5">
            <Star size={13} className="fill-warn-400 text-warn-400" />
            <span className="text-sm font-semibold text-slate-200">{product.rating}</span>
            <span className="text-xs text-slate-600">
              ({product.reviews.toLocaleString()})
            </span>
          </span>
        </div>

        <p className="text-[13.5px] leading-relaxed text-slate-300">{product.blurb}</p>

        <div>
          <p className="label mb-2">Specs</p>
          <ul className="space-y-1.5">
            {product.specs.map((spec) => (
              <li key={spec} className="flex gap-2 text-[13px] text-slate-300">
                <Check size={14} className="mt-0.5 shrink-0 text-safe-400" />
                {spec}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <p className="label mb-1.5">Why it works</p>
          <p className="text-[13px] leading-relaxed text-slate-300">{product.whyItWorks}</p>
        </div>

        {product.policyNote ? (
          <p className="flex gap-2.5 rounded-2xl border border-warn-400/30 bg-warn-500/10 p-3.5
                        text-[12px] leading-relaxed text-slate-300">
            <Info size={15} className="mt-0.5 shrink-0 text-warn-400" />
            {product.policyNote}
          </p>
        ) : null}

        <p className="text-[11px] leading-relaxed text-slate-600">
          "Buy now" opens the retailer in a new tab. SafeSpark earns an affiliate commission on
          qualifying purchases, which is what funds the free tier — it does not change your price.
        </p>
      </div>
    </Modal>
  );
}
