"use client"

import { useState, useEffect } from "react";
import styles from "./tasks.module.css";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  Loader2,
  Trash2,
  ExternalLink,
  ChevronDown,
  Filter,
  CheckSquare
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";

interface ITask {
  _id: string;
  clientId?: { _id: string; name: string };
  task: string;
  date: string;
  time: string;
  status: "pending" | "completed" | "cancelled";
  assignedTo?: string;
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [clients, setClients] = useState<{_id: string, name: string}[]>([]);
  const [employees, setEmployees] = useState<{username: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { user, isAdmin } = useUser();

  const [formData, setFormData] = useState({
    clientId: "",
    manualClient: "",
    task: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    assignedTo: ""
  });

  useEffect(() => {
    fetchTasks();
    fetchClients();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClients(data);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setEmployees(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Prepare data - if client selected, use ID, else maybe name?
    // Based on my schema: clientId is ObjectId, task is string.
    // User said: "manually enter details along with task"
    // I'll append the manual name to the task description if no client selected.
    const submissionData: any = {
      ...formData,
      task: formData.clientId ? formData.task : `[${formData.manualClient}] ${formData.task}`,
      assignedTo: formData.assignedTo || user?.username
    };

    if (!submissionData.clientId) {
      delete submissionData.clientId;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          clientId: "",
          manualClient: "",
          task: "",
          date: new Date().toISOString().split('T')[0],
          time: "",
          assignedTo: ""
        });
        fetchTasks();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create task");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchTasks();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      fetchTasks();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.clientId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Task Monitoring</h1>
          <p className={styles.subtitle}>Manage and track organizational tasks and client follow-ups.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          <Plus size={20} />
          <span>Create New Task</span>
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by task description, client, or assignee..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} className="animate-spin" color="#4f46e5" />
        </div>
      ) : (
        <div className={styles.tasksGrid}>
          {filteredTasks.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <CheckSquare size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
              <p>No tasks found. Create one to get started!</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task._id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <span className={styles.taskType}>General Task</span>
                  <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                    {task.status === 'completed' ? <CheckCircle2 size={14} /> : task.status === 'cancelled' ? <XCircle size={14} /> : <Clock size={14} />}
                    {task.status.toUpperCase()}
                  </span>
                </div>
                
                <div className={styles.taskBody}>
                  <h3 className={styles.taskLabel}>{task.task}</h3>
                  {task.clientId && (
                    <Link href={`/clients?id=${task.clientId._id}`} className={styles.clientLink}>
                      <User size={14} />
                      <span>{task.clientId.name}</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>

                <div className={styles.taskFooter}>
                  <div className={styles.dateTime}>
                    <div className={styles.dtRow}><Calendar size={12} /> {task.date}</div>
                    <div className={styles.dtRow}><Clock size={12} /> {task.time || "No time set"}</div>
                  </div>
                  <div className={styles.assignee}>
                    <div className={styles.avatar}>{(task.assignedTo || 'U').substring(0,2).toUpperCase()}</div>
                    <span>{task.assignedTo || "Unassigned"}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  {task.status === 'pending' && (
                    <button 
                      onClick={() => updateTaskStatus(task._id, 'completed')} 
                      className={`${styles.actionBtn} ${styles.completeBtn}`}
                    >
                      <CheckCircle2 size={16} /> Mark Done
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => deleteTask(task._id)} className={styles.actionBtn}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Create Task</span>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Set targets for yourself or your team.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label>Link to Client (Optional)</label>
                <select 
                  value={formData.clientId} 
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                >
                  <option value="">-- No Client (Manual Entry) --</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              {!formData.clientId && (
                <div className={styles.inputGroup}>
                  <label>Manual Client Name / Reference</label>
                  <input 
                    type="text" 
                    placeholder="Enter reference name..."
                    value={formData.manualClient}
                    onChange={e => setFormData({...formData, manualClient: e.target.value})}
                  />
                </div>
              )}

              <div className={styles.inputGroup}>
                <label>Task Description</label>
                <textarea 
                  required 
                  placeholder="What needs to be done?"
                  value={formData.task}
                  onChange={e => setFormData({...formData, task: e.target.value})}
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.inputGroup}>
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>Time</label>
                  <input 
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Assign To</label>
                <select 
                  value={formData.assignedTo} 
                  onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                >
                  <option value="">-- Assign to Self --</option>
                  {employees.map(emp => <option key={emp.username} value={emp.username}>{emp.name}</option>)}
                </select>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.confirmBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
