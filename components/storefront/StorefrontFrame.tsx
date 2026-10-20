import type { StoreSettings } from "@/lib/catalog-types";
import CartHydrationProvider from "@/components/storefront/CartHydrationProvider";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import WhatsAppFab from "@/components/storefront/WhatsAppFab";

export default function StorefrontFrame({ children, settings }: { children: React.ReactNode; settings: StoreSettings }) {
  return <CartHydrationProvider>
    {settings.announcementBanner && <div className="bg-[#35115F] px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white sm:text-xs">{settings.announcementBanner}</div>}
    <StorefrontHeader />
    <main className="flex-1">{children}</main>
    <StorefrontFooter settings={settings} />
    <WhatsAppFab settings={settings} />
  </CartHydrationProvider>;
}
