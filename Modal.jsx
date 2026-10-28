import { X } from 'lucide-react';
import { useDismissable } from '../lib/hooks';

/**
 * Bottom-sheet on phones, centred dialog on wider screens.
 * Escape closes, backdrop closes, body scroll locks — see useDismissable.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) {
  useDismissable(open, onClose);
  if (!open) return null;

  const maxW = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size];

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fadeIn bg-black/70 backdrop-blur-sm"
      />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col animate-slideUp rounded-t-3xl
                    border border-white/10 bg-ink-800 shadow-panel sm:rounded-3xl ${maxW}`}
      >
        <div className="flex items-start gap-3 border-b border-white/10 px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight text-white">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm leading-snug text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full
                       text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="scroll-area flex-1 px-5 py-4">{children}</div>

        {footer ? (
          <div className="border-t border-white/10 px-5 pb-[max(1rem,var(--sa-bottom))] pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
