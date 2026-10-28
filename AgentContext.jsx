import { createContext, useContext } from 'react';
import { useSafetyAgent } from '../components/agent/useSafetyAgent';

const AgentContext = createContext(null);

/**
 * The agent lives at app level, not inside the Agent screen.
 *
 * This matters: a walk-home companion that stops monitoring the moment you tab
 * over to the map to check a blue light is worse than useless — it is a safety
 * feature that quietly turns itself off. Hoisting the session here keeps the
 * check-in timer, the transcript and the fake call running across navigation,
 * and lets the bottom nav show that monitoring is live from any tab.
 */
export function AgentProvider({ children }) {
  const agent = useSafetyAgent();
  return <AgentContext.Provider value={agent}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used inside <AgentProvider>');
  return ctx;
}
