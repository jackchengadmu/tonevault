"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  finish: string | null;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "tonevault-cart";

function readStoredItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(readStoredItems());
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    (item: CartItem) => {
      persist(items.some((existing) => existing.id === item.id) ? items : [...items, item]);
      setIsOpen(true);
    },
    [items, persist],
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(items.filter((item) => item.id !== id));
    },
    [items, persist],
  );

  const value = useMemo(
    () => ({
      items,
      isOpen,
      addItem,
      removeItem,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((open) => !open),
    }),
    [addItem, isOpen, items, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
