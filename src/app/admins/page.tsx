"use client"

import { useState, useEffect } from "react";
import styles from "../employees/employees.module.css";
import { 
  UserPlus, ShieldCheck, Trash2, Phone, Loader2, Mail, Edit2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

interface Admin {
  _id: string;
  name: string;
  username: string;
  role: string;
  email: string;
  contactNumber: string;
  status: string;
}

export default function AdminsPage() {
  const { isAdmin, loading: authLoading } = useUser();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({ name: "", username: "", password: "", contactNumber: "", email: "", role: "admin" });
  const [editForm, setEditForm] = useState({ name: "", username: "", contactNumber: "", email: "" });
  const [formError, setFormError] = useState("");
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users?role=admin");
      if (res.ok) setAdmins(await res.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
    else if (isAdmin) fetchData();
  }, [authLoading, isAdmin, router]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAdmin) });
    if (res.ok) {
      fetchData();
      setIsAdding(false);
      setNewAdmin({ name: "", username: "", password: "", contactNumber: "", email: "", role: "admin" });
    } else {
      const data = await res.json();
      setFormError(data.error || "Failed to add admin account");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!editingAdmin) return;
    const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingAdmin._id, ...editForm }) });
    if (res.ok) {
      fetchData();
      setEditingAdmin(null);
    } else {
      const data = await res.json();
      setFormError(data.error || "Failed to update admin");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin account?")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const openEdit = (adm: Admin) => {
    setEditingAdmin(adm);
    setEditForm({ name: adm.name, username: adm.username, contactNumber: adm.contactNumber || "", email: adm.email || "" });
    setFormError("");
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Loading administrators...</p>
      </div>
    );
  }

  const AdminModal = ({ title, onSubmit, onClose, children }: { title: string; onSubmit: (e: React.FormEvent) => void; onClose: () => void; children: React.ReactNode }) => (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} animate-fade-in`}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <form onSubmit={onSubmit} className={styles.form}>
          {children}
          {formError && <p className={styles.error}>{formError}</p>}
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>Administrators</h1>
          <p className={styles.subtitle}>Manage global system access and security roles.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
          <UserPlus size={20} />
          <span>Add New Admin</span>
        </button>
      </header>

      {isAdding && (
        <AdminModal title="Register New Admin" onSubmit={handleAdd} onClose={() => setIsAdding(false)}>
          <div className={styles.inputGroup}><label>Full Name</label><input type="text" required value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} placeholder="John Doe" /></div>
          <div className={styles.inputGroup}><label>Username</label><input type="text" required value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} placeholder="johndoe" /></div>
          <div className={styles.inputGroup}><label>Password</label><input type="password" required value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} placeholder="••••••••" /></div>
          <div className={styles.inputGroup}><label>Contact Number</label><input type="text" value={newAdmin.contactNumber} onChange={e => setNewAdmin({...newAdmin, contactNumber: e.target.value})} placeholder="+1 234 567 890" /></div>
          <div className={styles.inputGroup}><label>Email Address</label><input type="email" required value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} placeholder="name@example.com" /></div>
        </AdminModal>
      )}

      {editingAdmin && (
        <AdminModal title="Edit Admin" onSubmit={handleEdit} onClose={() => setEditingAdmin(null)}>
          <div className={styles.inputGroup}><label>Full Name</label><input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
          <div className={styles.inputGroup}><label>Username</label><input type="text" required value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} /></div>
          <div className={styles.inputGroup}><label>Contact Number</label><input type="text" value={editForm.contactNumber} onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} /></div>
          <div className={styles.inputGroup}><label>Email Address</label><input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
        </AdminModal>
      )}

      <div className={styles.employeeGrid}>
        {admins.map(adm => (
          <div key={adm._id} className={styles.employeeCard}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{adm.name.substring(0, 2).toUpperCase()}</div>
              <div className={styles.empInfo}>
                <h3 className={styles.empName}>{adm.name}</h3>
                <span className={styles.empRole}>{adm.role}</span>
              </div>
              <div className={styles.actionBtnGroup}>
                <button onClick={() => openEdit(adm)} className={`${styles.iconBtn} ${styles.editBtn}`} title="Edit"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(adm._id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.detailRow}><Mail size={14} /><span>{adm.email || `@${adm.username}`}</span></div>
              <div className={styles.detailRow}><Phone size={14} /><span>{adm.contactNumber || "No contact info"}</span></div>
            </div>
          </div>
        ))}
        {admins.length === 0 && (
          <div className={styles.empty}>
            <ShieldCheck size={48} />
            <p>No administrators found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
