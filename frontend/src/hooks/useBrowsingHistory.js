import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "browsing_history";
const ENABLED_KEY = "browsing_history_enabled";
const MAX_ITEMS = 50;

export function useBrowsingHistory() {
  const [items, setItems] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    try {
      const enabled = localStorage.getItem(ENABLED_KEY);
      setIsEnabled(enabled === null ? true : enabled !== "false");
      const stored = localStorage.getItem(STORAGE_KEY);
      setItems(stored ? JSON.parse(stored) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const save = useCallback((next) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const addItem = useCallback(
    (product) => {
      if (!isEnabled) return;
      setItems((prev) => {
        const without = prev.filter((i) => i.id !== product._id && i.id !== product.id);
        const entry = {
          id: product._id || product.id,
          title: product.title,
          slug: product.slug || product._id || product.id,
          image: Array.isArray(product.imageURLs)
            ? product.imageURLs[0]?.img || product.imageURLs[0]
            : product.img || "",
          price: product.price,
          date: new Date().toISOString(),
        };
        const next = [entry, ...without].slice(0, MAX_ITEMS);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [isEnabled]
  );

  const removeItem = useCallback(
    (id) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    []
  );

  const clear = useCallback(() => {
    save([]);
  }, [save]);

  const toggleEnabled = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(ENABLED_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return { items, isEnabled, addItem, removeItem, clear, toggleEnabled };
}
