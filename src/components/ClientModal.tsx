"use client"

import { useState, useEffect } from "react";
import styles from "./ClientModal.module.css";
import { X, Save, Loader2, User, Phone, MapPin, Briefcase, FileText, Calendar, Users, Clock } from "lucide-react";
import { IClient } from "@/models/Client";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<IClient>) => Promise<void>;
  initialData?: IClient | null;
  title: string;
}

export default function ClientModal({ isOpen, onClose, onSave, initialData, title }: ClientModalProps) {
  const [formData, setFormData] = useState<Partial<IClient>>({
    name: "",
    contactNumber: "",
    location: "",
    business: "",
    requirement: "",
    description: "",
    status: "Active",
    reaction: "",
    meetings: "",
    assign: "",
    callbackMonth: "",
    callback: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        reaction: "",
        meetings: "",
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

  const inputFields = [
    { name: "name", label: "Client Name", icon: <User size={16} />, placeholder: "Full Name", required: true },
    { name: "contactNumber", label: "Contact Number", icon: <Phone size={16} />, placeholder: "+1 234 567 890", required: true },
    { name: "location", label: "Location", icon: <MapPin size={16} />, placeholder: "City, Country" },
    { name: "business", label: "Business Type", icon: <Briefcase size={16} />, placeholder: "Industry/Niche" },
    { name: "requirement", label: "Requirement Scope", icon: <FileText size={16} />, placeholder: "Summary of needs" },
    { name: "description", label: "Detailed Description", icon: <FileText size={16} />, placeholder: "Full requirement details...", type: "textarea" },
    { name: "status", label: "Status", icon: <ShieldCheck size={16} />, type: "select", options: ["Active", "RNA", "Callback", "Converted", "Lost", "Archived"] },
    { name: "reaction", label: "Reaction", icon: <Users size={16} />, placeholder: "Positive/Neutral/Negative" },
    { name: "meetings", label: "Meetings", icon: <Calendar size={16} />, placeholder: "Last Meeting Info" },
    { name: "assign", label: "Assigned To", icon: <User size={16} />, placeholder: "Responsible Person" },
    { name: "callbackMonth", label: "Callback Month", icon: <Calendar size={16} />, placeholder: "Month of next contact" },
    { name: "callback", label: "Callback Time", icon: <Calendar size={16} />, placeholder: "Specific date/time" },
  ];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} animate-fade-in`}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            {inputFields.map((field, index) => (
              <>
                {field.name === 'callbackMonth' && (
                  <div key="divider" className={styles.divider}>
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
                    {field.type === "select" ? (
                      <select
                        id={field.name}
                        name={field.name}
                        value={(formData[field.name as keyof IClient] as string) || ""}
                        onChange={handleChange}
                        required={field.required}
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
                      />
                    ) : (
                      <input
                        id={field.name}
                        name={field.name}
                        type="text"
                        value={(formData[field.name as keyof IClient] as string) || ""}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                </div>
              </>
            ))}
          </div>

          <div className={styles.footer}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
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
          </div>
        </form>
      </div>
    </div>
  );
}

function ShieldCheck({ size }: { size: number }) {
  return <ShieldCheckIcon size={size} />;
}

import { ShieldCheck as ShieldCheckIcon } from "lucide-react";
