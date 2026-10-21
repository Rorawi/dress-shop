import Link from "next/link";
import { Camera, LayoutDashboard, Package, Settings2 } from "lucide-react";
import { logoutAdmin } from "@/app/(admin)/admin/actions";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/quick-upload", label: "Quick upload", icon: Camera },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/settings", label: "Shop settings", icon: Settings2 },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f6fa] lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="z-20 flex flex-col border-b border-[#e9e3ee] bg-white px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
        <Link href="/admin" className="block px-3 text-sm font-bold tracking-[.17em] text-[#35115f]">CHARWIN<br /><span className="text-[#8b5bc7]">STORES</span></Link>
        <nav aria-label="Admin navigation" className="mt-7 flex gap-2 overflow-x-auto lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#625b68] transition hover:bg-[#f4eff9] hover:text-[#35115f]">
              <Icon size={18} strokeWidth={1.8} />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-[#eee9f1] pt-5 lg:mt-auto">
          <Link href="/" className="block px-3 py-2 text-sm text-[#625b68] hover:text-[#35115f]">View storefront ↗</Link>
          <form action={logoutAdmin}>
            <button className="w-full rounded-xl px-3 py-2 text-left text-sm text-[#625b68] hover:bg-[#f4eff9] hover:text-[#35115f]">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
