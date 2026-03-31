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
  ShieldCheck,
  FileSpreadsheet,
  UserCheck,
  MessageSquare,
  UserPlus,
  Activity,
  CheckSquare,
  Mail
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState, useEffect, useRef } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", username: "", password: "", email: "" });
  const [profileData, setProfileData] = useState({ 
    name: "", 
    email: "", 
    contactNumber: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const { user, isAdmin } = useUser();
  const lastPingRef = useRef<number>(0);

  // Passive Polling: Ping the reminder service every 10 minutes
  // as a workaround for Vercel Hobby plan cron limits.
  useEffect(() => {
    if (!user) return;

    const pingService = async () => {
      const now = Date.now();
      // Only ping if 10 minutes have passed (600,000ms)
      if (now - lastPingRef.current < 600000) return;

      try {
        console.log("[Service] Syncing notifications...");
        await fetch("/api/cron/reminders");
        lastPingRef.current = now;
      } catch (err) {
        // Silently fail, it's a background task
      }
    };

    // Initial ping on load
    pingService();

    // Set up interval for subsequent pings
    const interval = setInterval(pingService, 60000); // Check every minute, but logic inside handles 10m limit

    return () => clearInterval(interval);
  }, [user]);

  const navItems = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Clients", href: "/clients", icon: <Users size={20} /> },
    { name: "Calendar", href: "/calendar", icon: <CalendarDays size={20} /> },
    { name: "Tasks", href: "/tasks", icon: <CheckSquare size={20} /> },
    { name: "Notes", href: "/notes", icon: <MessageSquare size={20} /> },
    isAdmin && { name: "Employees", href: "/employees", icon: <UserCheck size={20} /> },
    isAdmin && { name: "Statuses", href: "/statuses", icon: <Activity size={20} /> },
    isAdmin && { name: "Bulk Upload", href: "/bulk-upload", icon: <FileSpreadsheet size={20} /> },
    { name: "Discarded", href: "/discard", icon: <Trash2 size={20} /> },
    isAdmin && { name: "Administrators", href: "/admins", icon: <ShieldCheck size={20} /> },
  ].filter(Boolean) as { name: string; href: string; icon: React.ReactNode }[];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback redirect
      window.location.href = "/login";
    }
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
        <div className={styles.userProfile} onClick={() => {
          if (user) {
            setProfileData({ 
              name: user.name, 
              // @ts-ignore
              email: user.email || "", 
              // @ts-ignore
              contactNumber: user.contactNumber || "",
              currentPassword: "",
              newPassword: "",
              confirmPassword: ""
            });
            setIsEditingProfile(true);
          }
        }} style={{ cursor: 'pointer' }}>
          <div className={styles.avatar}>
            {user?.name?.substring(0, 2).toUpperCase() || "..."}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || "Loading..."}</span>
            <span className={styles.userRole}>{user?.role === 'admin' ? 'Administrator' : 'Employee'}</span>
          </div>
          {isAdmin && (
            <button 
              className={styles.addAdminBtn} 
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingAdmin(true);
              }}
              title="Add Admin"
            >
              <UserPlus size={16} />
            </button>
          )}
        </div>
        
        <div className={styles.authActions}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {isAddingAdmin && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setIsAddingAdmin(false)}>
          <div className={styles.adminModal}>
            <h3>Register New Admin</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              try {
                const res = await fetch("/api/users", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({...newAdmin, role: 'admin'}),
                });
                if (res.ok) {
                  setIsAddingAdmin(false);
                  setNewAdmin({ name: "", username: "", password: "", email: "" });
                  alert("Admin account created successfully!");
                } else {
                  const data = await res.json();
                  setError(data.error || "Failed to create admin");
                }
              } catch (err) {
                setError("An error occurred");
              }
            }}>
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={newAdmin.name}
                  onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Username</label>
                <input 
                  type="text" 
                  required 
                  value={newAdmin.username}
                  onChange={e => setNewAdmin({...newAdmin, username: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Password</label>
                <input 
                  type="password" 
                  required 
                  value={newAdmin.password}
                  onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={newAdmin.email}
                  onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                  placeholder="admin@example.com"
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsAddingAdmin(false)}>Cancel</button>
                <button type="submit" className={styles.confirmBtn}>Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditingProfile && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setIsEditingProfile(false)}>
          <div className={styles.adminModal}>
            <h3>Edit Profile</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
                setError("New passwords do not match");
                return;
              }

              setIsSavingProfile(true);
              setError("");
              try {
                const res = await fetch("/api/users/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(profileData),
                });
                if (res.ok) {
                  setIsEditingProfile(false);
                  window.location.reload(); // Refresh to show changes
                } else {
                  const data = await res.json();
                  setError(data.error || "Failed to update profile");
                }
              } catch (err) {
                setError("An error occurred");
              } finally {
                setIsSavingProfile(false);
              }
            }}>
              <div className={styles.inputGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={profileData.name}
                  onChange={e => setProfileData({...profileData, name: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={profileData.email}
                  onChange={e => setProfileData({...profileData, email: e.target.value})}
                  placeholder="name@example.com"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Contact Number</label>
                <input 
                  type="text" 
                  value={profileData.contactNumber}
                  onChange={e => setProfileData({...profileData, contactNumber: e.target.value})}
                />
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, marginBottom: '12px' }}>Change Password (Optional)</p>
                <div className={styles.inputGroup}>
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={profileData.currentPassword}
                    onChange={e => setProfileData({...profileData, currentPassword: e.target.value})}
                    placeholder="Verify current password"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={profileData.newPassword}
                    onChange={e => setProfileData({...profileData, newPassword: e.target.value})}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={profileData.confirmPassword}
                    onChange={e => setProfileData({...profileData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                <button type="submit" className={styles.confirmBtn} disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
