import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { headers, cookies } from "next/headers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Innomatrics Client Manager",
  description: "Advanced Client Management System for Innomatrics Technologies",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token");
  
  const isLoginPage = pathname.startsWith("/login");
  const isAuthenticated = !!authToken;
  
  // Only show sidebar if authenticated AND not on login page
  const showSidebar = isAuthenticated && !isLoginPage;

  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        {showSidebar ? (
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
        ) : (
          children
        )}
      </body>
    </html>
  );
}
