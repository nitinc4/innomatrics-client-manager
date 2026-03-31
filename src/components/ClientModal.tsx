"use client"

import { useState, useEffect } from "react";
import styles from "./ClientModal.module.css";
import { X, Save, Loader2, User, Phone, MapPin, Briefcase, FileText, Calendar, Users, Clock, ShieldCheck, MessageSquare, Send, CalendarDays, CheckSquare, Check, Plus, Trash2 } from "lucide-react";
import { IClient } from "@/models/Client";
import { ITask } from "@/models/Task";
import React, { Fragment } from "react";
import { useUser } from "@/hooks/useUser";

interface UserOption {
  username: string;
  name: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<IClient>) => Promise<void>;
  initialData?: IClient | null;
  title: string;
  viewOnly?: boolean;
}

export default function ClientModal({ isOpen, onClose, onSave, initialData, title, viewOnly = false }: ClientModalProps) {
  const [formData, setFormData] = useState<Partial<IClient>>({
    callback: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "tasks">("details");
  const [employees, setEmployees] = useState<UserOption[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isSendingNote, setIsSendingNote] = useState(false);
  
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isFetchingTasks, setIsFetchingTasks] = useState(false);
  const [newTask, setNewTask] = useState({ 
    task: "", 
    date: new Date().toISOString().split('T')[0], 
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) 
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  const { user, isAdmin } = useUser();

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetch("/api/users")
        .then(res => res.json())
        .then(data => setEmployees(data))
        .catch(err => console.error("Failed to fetch employees", err));
    }
  }, [isOpen, isAdmin]);

  useEffect(() => {
    if (isOpen && initialData?._id) {
      fetch(`/api/clients/${initialData._id}/notes`)
        .then(res => res.json())
        .then(data => setNotes(data))
        .catch(err => console.error("Failed to fetch notes", err));
        
      setIsFetchingTasks(true);
      fetch(`/api/tasks?clientId=${initialData._id}`)
        .then(res => res.json())
        .then(data => setTasks(data))
        .catch(err => console.error("Failed to fetch tasks", err))
        .finally(() => setIsFetchingTasks(false));
    }
  }, [isOpen, initialData?._id]);

  const groupNotesByDate = (notesToGroup: any[]) => {
    const groups: Record<string, any[]> = {};
    notesToGroup.forEach(note => {
      const date = new Date(note.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    return groups;
  };

  const noteGroups = groupNotesByDate(notes);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        contactNumber: "",
        location: "",
        business: "",
        requirement: "",
        description: "",
        status: "Active",
        assign: "",
        callbackMonth: "",
        callback: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !initialData?._id) return;

    setIsSendingNote(true);
    try {
      const res = await fetch(`/api/clients/${initialData._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes([...notes, note]);
        setNewNote("");
      }
    } catch (err) {
      console.error("Failed to send note", err);
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.task.trim() || !initialData?._id) return;

    setIsAddingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          clientId: initialData._id,
          status: "pending"
        }),
      });
      if (res.ok) {
        const task = await res.json();
        setTasks([task, ...tasks]);
        setNewTask({ ...newTask, task: "" });
      }
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setTasks(tasks.map(t => t._id === id ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(tasks.filter(t => t._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const inputFields = [
    { name: "name", label: "Client Name", icon: <User size={16} />, placeholder: "Full Name", required: true },
    { name: "contactNumber", label: "Contact Number", icon: <Phone size={16} />, placeholder: "+1 234 567 890", required: true },
    { name: "location", label: "Location", icon: <MapPin size={16} />, placeholder: "City, Country" },
    { name: "business", label: "Business Type", icon: <Briefcase size={16} />, placeholder: "Industry/Niche" },
    { name: "requirement", label: "Requirement Scope", icon: <FileText size={16} />, placeholder: "Summary of needs" },
    { name: "description", label: "Detailed Description", icon: <FileText size={16} />, placeholder: "Full requirement details...", type: "textarea" },
    { name: "status", label: "Status", icon: <ShieldCheck size={16} />, type: "select", options: ["Active", "RNA", "Callback", "Converted", "Lost", "Archived", "Completed"] },
    { name: "assign", label: "Assigned To", icon: <User size={16} />, placeholder: "Responsible Person" },
    { name: "callbackMonth", label: "Callback Month", icon: <Calendar size={16} />, type: "month" },
    { name: "callback", label: "Callback Time", icon: <Calendar size={16} />, type: "datetime-local" },
  ];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} animate-fade-in`}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2>{title}</h2>
            {initialData?._id && (
              <div className={styles.tabs}>
                <button 
                  type="button" 
                  className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  <FileText size={16} /> Details
                </button>
                <button 
                  type="button" 
                  className={`${styles.tab} ${activeTab === 'notes' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('notes')}
                >
                  <MessageSquare size={16} /> Notes ({notes.length})
                </button>
                <button 
                  type="button" 
                  className={`${styles.tab} ${activeTab === 'tasks' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('tasks')}
                >
                  <CheckSquare size={16} /> Tasks ({tasks.length})
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
              {inputFields.map((field) => (
                <Fragment key={field.name}>
                  {field.name === 'callbackMonth' && (
                    <div className={styles.divider}>
                      <Clock size={18} />
                      <span>Schedule Callback</span>
                    </div>
                  )}
                  <div key={field.name} className={`${styles.inputGroup} ${field.type === 'textarea' ? styles.fullWidth : ''}`}>
                    <label htmlFor={field.name}>
                      {field.label} {field.required && <span className={styles.required}>*</span>}
                    </label>
                    <div className={styles.inputWrapper}>
                      <div className={styles.icon}>{field.icon}</div>
                      {field.name === "assign" ? (
                        <select
                          id={field.name}
                          name={field.name}
                          value={(formData[field.name as keyof IClient] as string) || ""}
                          onChange={handleChange}
                          disabled={viewOnly || !isAdmin}
                        >
                          <option value="">Unassigned</option>
                          <option value="admin">Super User (Admin)</option>
                          {employees.map(emp => (
                            <option key={emp.username} value={emp.username}>{emp.name}</option>
                          ))}
                        </select>
                      ) : field.type === "select" ? (
                        <select
                          id={field.name}
                          name={field.name}
                          value={(formData[field.name as keyof IClient] as string) || ""}
                          onChange={handleChange}
                          required={field.required}
                          disabled={viewOnly}
                        >
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          id={field.name}
                          name={field.name}
                          value={(formData[field.name as keyof IClient] as string) || ""}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={3}
                          className={styles.textarea}
                          disabled={viewOnly}
                        />
                      ) : (
                        <input
                          id={field.name}
                          name={field.name}
                          type={field.type || "text"}
                          value={(formData[field.name as keyof IClient] as string) || ""}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          disabled={viewOnly}
                        />
                      )}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>

            <div className={styles.footer}>
              <button type="button" onClick={onClose} className={styles.cancelButton}>
                {viewOnly ? "Close" : "Cancel"}
              </button>
              {!viewOnly && (
                <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Client
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        ) : activeTab === 'notes' ? (
          <div className={styles.notesContainer}>
            <div className={styles.notesTimeline}>
              {notes.length === 0 ? (
                <div className={styles.emptyNotes}>
                  <MessageSquare size={48} />
                  <p>No notes yet. Start the conversation!</p>
                </div>
              ) : (
                Object.entries(noteGroups).map(([date, msgs]) => (
                  <div key={date} className={styles.dateGroup}>
                    <div className={styles.dateHeader}>
                      <CalendarDays size={14} />
                      <span>{date}</span>
                    </div>
                    <div className={styles.notesListLegacy}>
                      {msgs.map((note) => (
                        <div key={note._id} className={styles.noteEntry}>
                          <div className={styles.noteHeader}>
                            <div className={styles.authorBadge}>
                              <div className={styles.authorAvatar}>
                                {note.author.substring(0, 1).toUpperCase()}
                              </div>
                              <div className={styles.authorMeta}>
                                <span className={styles.noteAuthor}>{note.author}</span>
                                <span className={styles.authorRole}>{note.authorRole}</span>
                              </div>
                            </div>
                            <span className={styles.noteTime}>
                              {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                          <div className={styles.noteContent}>{note.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendNote} className={styles.noteInputArea}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={isSendingNote}
              />
              <button type="submit" disabled={isSendingNote || !newNote.trim()}>
                {isSendingNote ? <Loader2 size={18} className={styles.spinner} /> : <Send size={18} />}
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.tasksContainer}>
            <div className={styles.tasksList}>
              {isFetchingTasks ? (
                <div className={styles.emptyTasks}>
                  <Loader2 size={40} className={styles.spinner} />
                  <p>Syncing tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className={styles.emptyTasks}>
                  <CheckSquare size={48} />
                  <p>No tasks for this client yet.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task._id} className={styles.taskItem}>
                    <div 
                      className={`${styles.taskCheckbox} ${task.status === 'completed' ? styles.taskCheckboxChecked : ''}`}
                      onClick={() => handleToggleTask(task._id!, task.status)}
                    >
                      {task.status === 'completed' && <Check size={14} />}
                    </div>
                    <div className={styles.taskInfo}>
                      <span className={`${styles.taskText} ${task.status === 'completed' ? styles.taskTextCompleted : ''}`}>
                        {task.task}
                      </span>
                      <div className={styles.taskMeta}>
                        <div className={styles.taskMetaItem}>
                          <Calendar size={12} />
                          <span>{task.date}</span>
                        </div>
                        <div className={styles.taskMetaItem}>
                          <Clock size={12} />
                          <span>{task.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.taskActions}>
                      <button 
                        onClick={() => handleDeleteTask(task._id!)}
                        className={styles.deleteTaskBtn}
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddTask} className={styles.addTaskForm}>
              <div className={styles.addTaskRow}>
                <input 
                  type="text" 
                  placeholder="What needs to be done?" 
                  required
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                />
              </div>
              <div className={styles.addTaskRow}>
                <input 
                  type="date" 
                  required
                  value={newTask.date}
                  onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                />
                <input 
                  type="time" 
                  required
                  value={newTask.time}
                  onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                />
                <button type="submit" className={styles.addTaskBtn} disabled={isAddingTask || !newTask.task.trim()}>
                  {isAddingTask ? <Loader2 size={18} className={styles.spinner} /> : <Plus size={18} />}
                  <span>Add Task</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

