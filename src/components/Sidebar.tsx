"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";
import { 
  Users, 
  Trash2, 
  LogOut, 
  LayoutDashboard,
  CalendarDays,
  Settings,
  ShieldCheck
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Clients", href: "/clients", icon: <Users size={20} /> },
    { name: "Calendar", href: "/calendar", icon: <CalendarDays size={20} /> },
    { name: "Discarded", href: "/discard", icon: <Trash2 size={20} /> },
    { name: "Settings", href: "/settings", icon: <Settings size={20} /> },
  ];

  const handleLogout = async () => {
    // Simple logout by clearing the cookie (or calling an API)
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    window.location.href = "/login";
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.topContainer}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <ShieldCheck size={24} color="white" />
          </div>
          <span className={styles.logoText}>Innomatrics</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
            >
              {item.icon}
              <span>{item.name}</span>
              {pathname === item.href && <div className={styles.indicator} />}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.bottomContainer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>SU</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Super User</span>
            <span className={styles.userRole}>Administrator</span>
          </div>
        </div>
        
        <button onClick={handleLogout} className={styles.logoutButton}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
