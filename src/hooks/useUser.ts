import { useState, useEffect } from "react";

export interface UserSession {
  username: string;
  role: "admin" | "employee";
  name: string;
  email?: string;
  contactNumber?: string;
  id?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, loading, isAdmin: user?.role === "admin" };
}
