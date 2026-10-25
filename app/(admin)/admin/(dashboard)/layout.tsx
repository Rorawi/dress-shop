import AdminShell from "@/components/admin/admin-shell";
import { requireShopAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireShopAdmin();
  return <AdminShell>{children}</AdminShell>;
}
