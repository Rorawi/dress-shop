import StorefrontFrame from "@/components/storefront/StorefrontFrame";
import { getStoreSettings } from "@/lib/catalog";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  return <StorefrontFrame settings={settings}>{children}</StorefrontFrame>;
}
