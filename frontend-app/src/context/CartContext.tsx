import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartApi, wishlistApi, CartView, CartItem } from '../api/cart';
import { Product } from '../api/catalog';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartView | null;
  count: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Wishlist
  wishlistIds: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;

  // Comparison list (≤ 4 items)
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<Product[]>([]);

  useEffect(() => {
    if (user) {
      refreshCart();
      refreshWishlist();
    } else {
      setCart(null);
      setWishlistIds(new Set());
    }
  }, [user]);

  const refreshCart = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      // Cart might be empty or new session
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWishlist = async () => {
    if (!user) return;
    try {
      const data = await wishlistApi.getWishlist();
      const ids = new Set((data.items || []).map((p) => p.productId));
      setWishlistIds(ids);
    } catch {
      // Ignore
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    setIsLoading(true);
    try {
      const updated = await cartApi.addItem(productId, quantity);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updated = await cartApi.updateQuantity(itemId, quantity);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      const updated = await cartApi.removeItem(itemId);
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const updated = await cartApi.clearCart();
      setCart(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    const isSaved = wishlistIds.has(productId);
    const next = new Set(wishlistIds);
    if (isSaved) {
      next.delete(productId);
      setWishlistIds(next);
      await wishlistApi.removeItem(productId);
    } else {
      next.add(productId);
      setWishlistIds(next);
      await wishlistApi.addItem(productId);
    }
  };

  const addToCompare = (product: Product): boolean => {
    if (compareList.some((p) => p.productId === product.productId)) return true;
    if (compareList.length >= 4) return false;
    setCompareList([...compareList, product]);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(compareList.filter((p) => p.productId !== productId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (productId: string) => {
    return compareList.some((p) => p.productId === productId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        count: cart?.count || 0,
        isLoading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        wishlistIds,
        toggleWishlist,
        refreshWishlist,
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
