"use client"

import { useState, useEffect } from "react";
import styles from "./employees.module.css";
import { 
  UserPlus, Users, Trash2, Phone, Loader2, Mail, Edit2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

interface Employee {
  _id: string;
  name: string;
  username: string;
  role: string;
  email: string;
  contactNumber: string;
  status: string;
  stats?: Record<string, number>;
}

export default function EmployeesPage() {
  const { isAdmin, loading: authLoading } = useUser();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: "", username: "", password: "", contactNumber: "", email: "", role: "employee" });
  const [editForm, setEditForm] = useState({ name: "", username: "", contactNumber: "", email: "" });
  const [formError, setFormError] = useState("");
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empRes, statusRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/statuses")
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (statusRes.ok) setStatuses(await statusRes.json());
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
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newEmployee) });
    if (res.ok) {
      fetchData();
      setIsAdding(false);
      setNewEmployee({ name: "", username: "", password: "", contactNumber: "", email: "", role: "employee" });
    } else {
      const data = await res.json();
      setFormError(data.error || "Failed to add employee");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!editingEmployee) return;
    const res = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingEmployee._id, ...editForm }) });
    if (res.ok) {
      fetchData();
      setEditingEmployee(null);
    } else {
      const data = await res.json();
      setFormError(data.error || "Failed to update employee");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    // @ts-ignore
    setEditForm({ name: emp.name, username: emp.username, contactNumber: emp.contactNumber || "", email: emp.email || "" });
    setFormError("");
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Loading employee directory...</p>
      </div>
    );
  }

  const EmployeeModal = ({ title, onSubmit, onClose, children }: { title: string; onSubmit: (e: React.FormEvent) => void; onClose: () => void; children: React.ReactNode }) => (
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
          <h1 className={styles.title}>Employee Directory</h1>
          <p className={styles.subtitle}>Manage your team and monitor performance.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsAdding(true)}>
          <UserPlus size={20} />
          <span>Add New Employee</span>
        </button>
      </header>

      {isAdding && (
        <EmployeeModal title="Register New Employee" onSubmit={handleAdd} onClose={() => setIsAdding(false)}>
          <div className={styles.inputGroup}><label>Full Name</label><input type="text" required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} placeholder="John Doe" /></div>
          <div className={styles.inputGroup}><label>Username</label><input type="text" required value={newEmployee.username} onChange={e => setNewEmployee({...newEmployee, username: e.target.value})} placeholder="johndoe" /></div>
          <div className={styles.inputGroup}><label>Password</label><input type="password" required value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} placeholder="••••••••" /></div>
          <div className={styles.inputGroup}><label>Contact Number</label><input type="text" value={newEmployee.contactNumber} onChange={e => setNewEmployee({...newEmployee, contactNumber: e.target.value})} placeholder="+1 234 567 890" /></div>
          <div className={styles.inputGroup}><label>Email Address</label><input type="email" required value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} placeholder="name@example.com" /></div>
        </EmployeeModal>
      )}

      {editingEmployee && (
        <EmployeeModal title="Edit Employee" onSubmit={handleEdit} onClose={() => setEditingEmployee(null)}>
          <div className={styles.inputGroup}><label>Full Name</label><input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
          <div className={styles.inputGroup}><label>Username</label><input type="text" required value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} /></div>
          <div className={styles.inputGroup}><label>Contact Number</label><input type="text" value={editForm.contactNumber} onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} /></div>
          <div className={styles.inputGroup}><label>Email Address</label><input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
        </EmployeeModal>
      )}

      <div className={styles.employeeGrid}>
        {employees.map(emp => (
          <div key={emp._id} className={styles.employeeCard}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{emp.name.substring(0, 2).toUpperCase()}</div>
              <div className={styles.empInfo}>
                <h3 className={styles.empName}>{emp.name}</h3>
                <span className={styles.empRole}>{emp.role}</span>
              </div>
              <div className={styles.actionBtnGroup}>
                <button onClick={() => openEdit(emp)} className={`${styles.iconBtn} ${styles.editBtn}`} title="Edit"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(emp._id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.detailRow}><Mail size={14} /><span>{emp.email || `@${emp.username}`}</span></div>
              <div className={styles.detailRow}><Phone size={14} /><span>{emp.contactNumber || "No contact info"}</span></div>
              <div className={styles.statsSection}>
                <span className={styles.statsTitle}>Client Portfolio</span>
                <div className={styles.statsGrid}>
                  {statuses.map(status => (
                    <div 
                      key={status.name} 
                      className={styles.statItem}
                      style={{ borderLeft: `3px solid ${status.color}` }}
                    >
                      <span className={styles.count} style={{ color: status.color }}>{emp.stats?.[status.name] || 0}</span>
                      <span className={styles.label}>{status.name}</span>
                    </div>
                  ))}
                  {statuses.length === 0 && (
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', gridColumn: '1 / -1' }}>No statuses configured.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className={styles.empty}>
            <Users size={48} />
            <p>No employees added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
