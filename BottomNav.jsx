import { NavLink } from 'react-router-dom';
import { Bot, Map, ShoppingBag, Siren, TriangleAlert } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';
import { useCart } from '../context/CartContext';
import { useAlerts } from '../context/AlertContext';
import { useAgent } from '../context/AgentContext';

const TABS = [
  { to: '/map', label: 'Blue Lights', Icon: Map },
  { to: '/agent', label: 'Agent', Icon: Bot },
  { to: '/incidents', label: 'Reports', Icon: TriangleAlert },
  { to: '/sos', label: 'SOS', Icon: Siren, danger: true },
  { to: '/shop', label: 'Shop', Icon: ShoppingBag },
];

function Badge({ children, danger }) {
  return (
    <span
      className={`absolute -right-2.5 -top-1 min-w-[18px] rounded-full px-1 py-px text-[10px]
                  font-bold leading-[14px] ${
                    danger ? 'bg-danger-500 text-white' : 'bg-spark-500 text-ink-900'
                  }`}
    >
      {children}
    </span>
  );
}

export default function BottomNav() {
  const { visibleIncidents } = useIncidents();
  const { count } = useCart();
  const { sosState } = useAlerts();
  const { active: agentActive, risk: agentRisk } = useAgent();

  const recentCount = visibleIncidents.filter(
    (i) => Date.now() - new Date(i.created_at).getTime() < 3600_000,
  ).length;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-[1000] border-t border-white/10
                 bg-ink-900/92 pb-[var(--sa-bottom)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map(({ to, label, Icon, danger }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `relative flex min-h-[58px] flex-col items-center justify-center gap-1
                 px-1 pt-2 pb-1.5 text-[10px] font-semibold tracking-wide transition
                 ${
                   isActive
                     ? danger
                       ? 'text-danger-400'
                       : 'text-spark-400'
                     : 'text-slate-500 hover:text-slate-300'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon
                      size={21}
                      strokeWidth={isActive ? 2.4 : 2}
                      className={
                        danger && sosState === 'active'
                          ? 'animate-beacon text-danger-400'
                          : undefined
                      }
                    />
                    {to === '/incidents' && recentCount > 0 ? (
                      <Badge>{recentCount}</Badge>
                    ) : null}
                    {to === '/shop' && count > 0 ? <Badge>{count}</Badge> : null}
                    {to === '/sos' && sosState === 'active' ? (
                      <Badge danger>!</Badge>
                    ) : null}
                    {/* Monitoring now runs app-wide, so the tab has to say so
                        from every screen — not only when you are looking at it. */}
                    {to === '/agent' && agentActive ? (
                      <span
                        aria-label="Agent monitoring"
                        className={`absolute -right-2 -top-0.5 h-2.5 w-2.5 animate-beacon rounded-full ${
                          agentRisk === 'calm' ? 'bg-safe-400' : 'bg-danger-400'
                        }`}
                      />
                    ) : null}
                  </span>
                  <span className="leading-none">{label}</span>
                  <span
                    aria-hidden
                    className={`absolute inset-x-5 top-0 h-0.5 rounded-full transition-opacity ${
                      isActive
                        ? danger
                          ? 'bg-danger-400 opacity-100'
                          : 'bg-spark-400 opacity-100'
                        : 'opacity-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
