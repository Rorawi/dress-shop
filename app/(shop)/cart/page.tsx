import CartView from "@/components/storefront/CartView";
import { getStoreSettings } from "@/lib/catalog";

export default async function CartPage() {
  const settings = await getStoreSettings();
  return <CartView settings={settings} />;
}
