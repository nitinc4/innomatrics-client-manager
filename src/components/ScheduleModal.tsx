"use client"

import { useState, useEffect } from "react";
import styles from "./ClientModal.module.css";
import { X, Calendar, Clock, Save, Loader2 } from "lucide-react";
import { IClient } from "@/models/Client";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<IClient>) => Promise<void>;
  client: IClient | null;
}

export default function ScheduleModal({ isOpen, onClose, onSave, client }: ScheduleModalProps) {
  const [formData, setFormData] = useState({
    callback: "",
    callbackMonth: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        callback: client.callback || "",
        callbackMonth: client.callbackMonth || ""
      });
    }
  }, [client, isOpen]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Schedule failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} animate-fade-in`} style={{ maxWidth: '480px' }}>
        <div className={styles.header}>
          <h2>Schedule Callback</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.scheduleForm}>
          <p className={styles.modalDescription}>
            Update the callback schedule for <strong>{client.name}</strong>.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="callbackMonth">Callback Month</label>
            <div className={styles.inputWrapper}>
              <div className={styles.icon}><Calendar size={16} /></div>
              <input
                id="callbackMonth"
                type="month"
                value={formData.callbackMonth}
                onChange={(e) => setFormData(prev => ({ ...prev, callbackMonth: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="callback">Specific Date & Time</label>
            <div className={styles.inputWrapper}>
              <div className={styles.icon}><Clock size={16} /></div>
              <input
                id="callback"
                type="datetime-local"
                value={formData.callback}
                onChange={(e) => setFormData(prev => ({ ...prev, callback: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
