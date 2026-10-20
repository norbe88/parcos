/**
 * Helper partajat pentru obținerea unui ID unic per tab de browser.
 * Utilizat pentru a preveni auto-ecoul mesajelor transmise prin BroadcastChannel.
 */
export function getTabSessionId(): string {
  if (typeof window === 'undefined') return 'ssr_session';
  if (!(window as any).__RXM_TAB_SESSION_ID__) {
    (window as any).__RXM_TAB_SESSION_ID__ = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
  return (window as any).__RXM_TAB_SESSION_ID__;
}
