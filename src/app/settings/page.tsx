"use client"

import { useState, useEffect } from "react";
import styles from "./settings.module.css";
import { 
  Bell, 
  Mail, 
  Clock, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Server
} from "lucide-react";
import { ISettings } from "@/models/Settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<ISettings>>({
    reminderEmail: "",
    remindBefore: 30,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Settings updated successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to update settings." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: name === "remindBefore" || name === "smtpPort" ? Number(value) : value,
    }));
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={40} className={styles.spinner} />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Manage Reminders</h1>
          <p className={styles.subtitle}>Configure email alerts for your client callbacks.</p>
        </div>
      </header>

      <form onSubmit={handleSave} className={`${styles.mainGrid} animate-fade-in`}>
        <div className={styles.settingsSection}>
          <div className={styles.sectionHeader}>
            <Bell size={20} className={styles.sectionIcon} />
            <h2>Reminder Configuration</h2>
          </div>
          
          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="reminderEmail">Notification Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="reminderEmail"
                  name="reminderEmail"
                  type="email"
                  value={settings.reminderEmail}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <p className={styles.inputHint}>This email will receive upcoming callback alerts.</p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="remindBefore">Remind Before (Minutes)</label>
              <div className={styles.inputWrapper}>
                <Clock size={18} className={styles.inputIcon} />
                <input
                  id="remindBefore"
                  name="remindBefore"
                  type="number"
                  value={settings.remindBefore}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
              <p className={styles.inputHint}>How many minutes before the callback should we alert you?</p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          {message.text && (
            <div className={`${styles.statusMsg} ${styles[message.type]}`}>
              {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}
          <button type="submit" className={styles.saveBtn} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 size={20} className={styles.spinner} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
