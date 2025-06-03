"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  CalendarDaysIcon, 
  CheckSquareIcon, 
  UsersIcon, 
  CameraIcon,
  UserCircleIcon 
} from "lucide-react";

const navItems = [
  { href: "/calendar", label: "カレンダー", icon: CalendarDaysIcon },
  { href: "/tasks", label: "タスク", icon: CheckSquareIcon },
  { href: "/ocr", label: "撮影", icon: CameraIcon },
  { href: "/family", label: "家族", icon: UsersIcon },
  { href: "/profile", label: "設定", icon: UserCircleIcon },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
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
    </nav>
  );
}