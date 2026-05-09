// Tiny pub/sub for cross-component UI triggers (e.g., open Add Trade modal from anywhere).
type Listener = () => void;

const addTradeListeners = new Set<Listener>();

export function openAddTrade() {
  addTradeListeners.forEach((l) => l());
}
export function onAddTradeOpen(fn: Listener) {
  addTradeListeners.add(fn);
  return () => addTradeListeners.delete(fn);
}
