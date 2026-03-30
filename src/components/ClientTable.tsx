"use client"

import styles from "./ClientTable.module.css";
import { formatTime12h } from "@/lib/utils";
import { 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Phone,
  MapPin,
  Calendar,
  Clock,
  Users,
  FileSpreadsheet
} from "lucide-react";
import { IClient } from "@/models/Client";

interface ClientTableProps {
  clients: IClient[];
  onEdit: (client: IClient) => void;
  onView: (client: IClient) => void;
  onScheduleCallback: (client: IClient) => void;
  onUpdateStatus?: (id: string, status: string) => Promise<void>;
  onDiscard?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onExport?: (client: IClient) => void;
  isDiscardView?: boolean;
}

import React, { useState, useEffect } from "react";

export default function ClientTable({ 
  clients, 
  onEdit, 
  onView,
  onScheduleCallback,
  onUpdateStatus,
  onDiscard, 
  onRestore, 
  onDelete,
  onExport,
  isDiscardView = false 
}: ClientTableProps) {
  const [statuses, setStatuses] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/statuses")
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setStatuses(data);
        else setStatuses([
          { name: "Active", color: "#6366f1" },
          { name: "RNA", color: "#f59e0b" },
          { name: "Callback", color: "#8b5cf6" },
          { name: "Converted", color: "#10b981" },
          { name: "Lost", color: "#ef4444" },
          { name: "Archived", color: "#64748b" },
          { name: "Completed", color: "#0f766e" }
        ]);
      })
      .catch(() => {});
  }, []);

  if (clients.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          {isDiscardView ? <Trash2 size={40} /> : <Users size={40} />}
        </div>
        <h3>No clients found</h3>
        <p>{isDiscardView ? "Your discard section is empty." : "Start by adding a new client to your management system."}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.clientCell}>Name</th>
            <th>Phone Number</th>
            <th>Requirement</th>
            <th>Status</th>
            <th>Assigned</th>
            <th className={styles.actionsHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const currentStatus = statuses.find(s => s.name === client.status);
            return (
              <tr key={client._id} className={styles.row}>
                <td className={styles.clientCell}>
                  <div className={styles.clientTitle}>
                    <span 
                      className={styles.clientNameClickable} 
                      onClick={() => onView(client)}
                      title="View Details"
                    >
                      {client.name}
                    </span>
                    <div className={styles.locationInfo}>
                      <MapPin size={12} />
                      <span>{client.location || "N/A"}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.clientContact}>
                    <Phone size={14} />
                    <span>{client.contactNumber}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.requirementInfo}>
                    <span className={styles.businessBadge}>{client.business || "General"}</span>
                    <p className={styles.requirementText}>{client.requirement || "No details"}</p>
                  </div>
                </td>
                <td>
                  <select 
                    className={`${styles.statusSelect} ${styles[client.status.toLowerCase() as keyof typeof styles] || styles.defaultStatus}`}
                    style={currentStatus ? { 
                      borderColor: `${currentStatus.color}40`,
                      background: `${currentStatus.color}15`,
                      color: currentStatus.color
                    } : {}}
                    value={client.status}
                    onChange={(e) => onUpdateStatus && onUpdateStatus(client._id!, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {statuses.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  {client.callbackMonth && (
                    <div className={styles.callbackInfo}>
                      <Calendar size={12} />
                      <span>{client.callbackMonth}</span>
                      <Clock size={12} style={{ marginLeft: '4px' }} />
                      <span>{formatTime12h(client.callback)}</span>
                    </div>
                  )}
                </td>
                <td>
                  <div className={styles.assignee}>
                    <div className={styles.assigneeAvatar}>
                      {(client.assign || "U")[0].toUpperCase()}
                    </div>
                    <span>{client.assign || "Unassigned"}</span>
                  </div>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    {!isDiscardView ? (
                      <>
                        <button 
                          onClick={() => onScheduleCallback(client)} 
                          className={styles.actionBtnEdit}
                          title="Schedule Callback"
                        >
                          <Clock size={16} />
                        </button>
                        <button 
                          onClick={() => onExport && onExport(client)} 
                          className={styles.actionBtnEdit}
                          style={{ color: '#16a34a' }}
                          title="Export to Excel"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button 
                          onClick={() => onEdit(client)} 
                          className={styles.actionBtnEdit}
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDiscard && onDiscard(client._id!)} 
                          className={styles.actionBtnDiscard}
                          title="Move to Discarded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                  ) : (
                    <>
                      <button 
                        onClick={() => onRestore && onRestore(client._id!)} 
                        className={styles.actionBtnRestore}
                        title="Restore Client"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete && onDelete(client._id!)} 
                        className={styles.actionBtnDelete}
                        title="Delete Permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

