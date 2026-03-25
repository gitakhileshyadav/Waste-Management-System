"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PieChart, Smartphone, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Devices", href: "/devices", icon: Smartphone },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] fixed left-0 top-16 z-20">
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-[var(--color-brand-surface)] text-[var(--color-brand-primary)]" 
                  : "text-[var(--color-brand-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-brand-text)]"
              }`}
            >
              <Icon size={20} className={isActive ? "text-[var(--color-brand-primary)]" : "text-gray-400"} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
