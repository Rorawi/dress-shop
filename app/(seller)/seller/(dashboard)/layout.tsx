import SellerShell from "@/components/seller/seller-shell";
import { requireShopMember } from "@/lib/supabase/admin";

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { shop } = await requireShopMember();
  return <SellerShell shopName={shop.name}>{children}</SellerShell>;
}
