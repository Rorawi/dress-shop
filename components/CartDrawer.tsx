"use client";

import { useCartStore } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHIPPING_THRESHOLD = 75;
const SHIPPING_COST = 4.99;

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const sub = subtotal();
  const shipping = sub >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = sub + shipping;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E6E0EB]">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">Your Bag</h2>
          <button onClick={onClose} aria-label="Close cart" className="p-1 hover:text-[#55239A] transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <ShoppingBag size={48} className="text-[#E6E0EB]" />
              <p className="text-[#625B68]">Your bag is empty</p>
              <button
                onClick={onClose}
                className="bg-[#55239A] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#35115F] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex gap-4">
                <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-[#FCFBFD] flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-[#17141C] leading-snug">{item.name}</p>
                      <p className="text-xs text-[#625B68] mt-0.5">{item.size}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      aria-label="Remove item"
                      className="text-[#625B68] hover:text-[#55239A] transition-colors ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-[#E6E0EB] rounded-full">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-[#55239A] transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:text-[#55239A] transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-[#17141C]">
                      £{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-[#E6E0EB] space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#625B68]">
                <span>Subtotal</span>
                <span>£{sub.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#625B68]">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `£${shipping.toFixed(2)}`}</span>
              </div>
              {sub < SHIPPING_THRESHOLD && (
                <p className="text-xs text-[#55239A]">
                  Add £{(SHIPPING_THRESHOLD - sub).toFixed(2)} more for free shipping
                </p>
              )}
              <div className="flex justify-between font-semibold text-[#17141C] pt-2 border-t border-[#E6E0EB]">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-[#55239A] text-white text-center py-4 rounded-full font-medium hover:bg-[#35115F] transition-colors"
            >
              Go to Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
