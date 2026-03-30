"use client"

import { useState, useEffect } from "react";
import styles from "./statuses.module.css";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  GripVertical, 
  Activity, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface IStatus {
  _id: string;
  name: string;
  color: string;
  order: number;
}

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#64748b", // Slate
  "#0f766e", // Teal
  "#166534", // Green
];

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<IStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<IStatus | null>(null);
  const [formData, setFormData] = useState({ name: "", color: PRESET_COLORS[0], order: 0 });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/statuses");
      const data = await res.json();
      setStatuses(data);
    } catch (err) {
      console.error("Failed to fetch statuses", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStatus(null);
    setFormData({ name: "", color: PRESET_COLORS[0], order: statuses.length });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (status: IStatus) => {
    setEditingStatus(status);
    setFormData({ name: status.name, color: status.color, order: status.order });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const url = "/api/statuses";
    const method = editingStatus ? "PUT" : "POST";
    const body = editingStatus ? { ...formData, id: editingStatus._id } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchStatuses();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to save status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this status? This may affect existing clients.")) return;

    try {
      const res = await fetch(`/api/statuses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchStatuses();
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Settings
          </Link>
          <h1 className={styles.title}>Status Management</h1>
          <p className={styles.subtitle}>Configure the lifecycle statuses for your clients.</p>
        </div>
        <button onClick={handleOpenAdd} className={styles.addBtn}>
          <Plus size={20} />
          <span>Add New Status</span>
        </button>
      </header>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="animate-spin" color="#4f46e5" />
        </div>
      ) : (
        <div className={styles.card}>
          <ul className={styles.statusList}>
            {statuses.length === 0 ? (
              <li style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <Activity size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <p>No custom statuses defined. Add one above!</p>
              </li>
            ) : (
              statuses.map((status) => (
                <li key={status._id} className={styles.statusItem}>
                  <GripVertical className={styles.dragHandle} size={18} />
                  <div className={styles.statusInfo}>
                    <div className={styles.colorPreview} style={{ backgroundColor: status.color }}></div>
                    <span className={styles.statusName}>{status.name}</span>
                  </div>
                  <div className={styles.actions}>
                    <button onClick={() => handleOpenEdit(status)} className={styles.actionBtn}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(status._id)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className={styles.modal}>
            <h3>{editingStatus ? "Edit Status" : "Add New Status"}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label>Status Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Follow-up Required"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Theme Color</label>
                <div className={styles.colorGrid}>
                  {PRESET_COLORS.map(color => (
                    <div 
                      key={color} 
                      className={`${styles.colorOption} ${formData.color === color ? styles.selectedColor : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({...formData, color})}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Display Order</label>
                <input 
                  type="number" 
                  value={formData.order}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setFormData({...formData, order: isNaN(val) ? 0 : val});
                  }}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.confirmBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
