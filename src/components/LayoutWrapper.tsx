"use client"

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";

export default function LayoutWrapper({
  children,
  initialAuthenticated
}: {
  children: React.ReactNode;
  initialAuthenticated: boolean;
}) {
  const pathname = usePathname();
  // Using initialAuthenticated directly and not re-checking via document.cookie 
  // because the cookie is set to HttpOnly for security.
  const [isAuthenticated] = useState(initialAuthenticated);

  const isLoginPage = pathname === "/login";
  const showSidebar = isAuthenticated && !isLoginPage;

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="app-container" style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        minHeight: '100vh',
        padding: '2rem',
        width: 'calc(100% - 280px)'
      }}>
        {children}
      </main>
    </div>
  );
}
