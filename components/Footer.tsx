"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#17141C] text-white">
      {/* Newsletter */}
      <div className="bg-[#55239A] py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white mb-2">
            Join Our World
          </h3>
          <p className="text-white/80 text-sm mb-6">
            New arrivals, exclusive offers, and style inspiration — delivered to your inbox.
          </p>
          {submitted ? (
            <p className="text-white font-medium">Thank you for subscribing! ✨</p>
          ) : (
            <form onSubmit={handleNewsletter} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 px-4 py-3 rounded-full text-[#17141C] text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#17141C] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#333] transition-colors"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-[family-name:var(--font-playfair)] text-lg font-bold mb-4">Charwin Stores</h4>
          <p className="text-white/60 text-sm leading-relaxed">
            Clothing and intimates selected for everyday confidence.
          </p>
        </div>
        <div>
          <h5 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">Shop</h5>
          <ul className="space-y-3">
            {["Casual", "Formal", "Wedding", "Party", "Maxi", "Mini"].map((cat) => (
              <li key={cat}>
                <Link href={`/shop?category=${cat.toUpperCase()}`} className="text-sm text-white/60 hover:text-white transition-colors">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">Help</h5>
          <ul className="space-y-3">
            {["Size Guide", "Shipping Policy", "Returns & Exchanges", "Contact Us", "FAQs"].map((item) => (
              <li key={item}>
                <span className="text-sm text-white/60 cursor-pointer hover:text-white transition-colors">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">Follow Us</h5>
          <ul className="space-y-3">
            {["Instagram", "Pinterest", "TikTok"].map((social) => (
              <li key={social}>
                <span className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">{social}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-white/40 text-xs px-4">
        © {new Date().getFullYear()} Charwin Stores. All rights reserved.
      </div>
    </footer>
  );
}
