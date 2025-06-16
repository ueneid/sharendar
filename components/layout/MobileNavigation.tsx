"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon,
  CalendarDaysIcon, 
  CheckSquareIcon, 
  CameraIcon,
  SettingsIcon 
} from "lucide-react";
import { NetworkIndicator } from "@/components/common/NetworkStatus";
import { SyncStatus } from "@/components/common/SyncStatus";

const navItems = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/calendar", label: "カレンダー", icon: CalendarDaysIcon },
  { href: "/tasks", label: "タスク", icon: CheckSquareIcon },
  { href: "/ocr", label: "撮影", icon: CameraIcon },
  { href: "/settings", label: "設定", icon: SettingsIcon },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <div className="relative">
      {/* ネットワーク状態と同期状態インジケーター */}
      <div className="absolute -top-2 right-4 z-10 flex items-center gap-2">
        <SyncStatus compact />
        <NetworkIndicator />
      </div>
      
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
                          (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}