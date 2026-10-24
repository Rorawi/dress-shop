import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  size: string;
  color: string;
  price: number;
  image: string;
  stock: number;
  discreetImage: boolean;
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  whatsappNumber?: string;
  acceptsMobileMoney?: boolean;
  acceptsCashOnDelivery?: boolean;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const existing = get().items.find((i) => i.variantId === newItem.variantId);
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.variantId === newItem.variantId
                ? { ...i, quantity: Math.min(i.stock, i.quantity + newItem.quantity) }
                : i
            ),
            isOpen: true,
          }));
        } else {
          set((state) => ({ items: [...state.items, { ...newItem, quantity: Math.min(newItem.stock, newItem.quantity) }], isOpen: true }));
        }
      },

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.min(i.stock, quantity) } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "charwin-marketplace-cart-v3", skipHydration: true }
  )
);
