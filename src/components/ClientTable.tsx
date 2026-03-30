"use client"

import styles from "./ClientTable.module.css";
import { 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Phone,
  MapPin,
  Calendar,
  Clock
} from "lucide-react";
import { IClient } from "@/models/Client";

interface ClientTableProps {
  clients: IClient[];
  onEdit: (client: IClient) => void;
  onDiscard?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDiscardView?: boolean;
}

export default function ClientTable({ 
  clients, 
  onEdit, 
  onDiscard, 
  onRestore, 
  onDelete,
  isDiscardView = false 
}: ClientTableProps) {
  
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
            <th>Client Info</th>
            <th>Location</th>
            <th>Business/Requirement</th>
            <th>Status</th>
            <th>Assigned</th>
            <th className={styles.actionsHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client._id} className={styles.row}>
              <td className={styles.clientCell}>
                <div className={styles.clientTitle}>
                  <span 
                    className={styles.clientNameClickable} 
                    onClick={() => onEdit(client)}
                    title="View Details"
                  >
                    {client.name}
                  </span>
                  <div className={styles.clientContact}>
                    <Phone size={12} />
                    <span>{client.contactNumber}</span>
                  </div>
                </div>
              </td>
              <td>
                <div className={styles.locationInfo}>
                  <MapPin size={14} />
                  <span>{client.location || "N/A"}</span>
                </div>
              </td>
              <td>
                <div className={styles.requirementInfo}>
                  <span className={styles.businessBadge}>{client.business || "General"}</span>
                  <p className={styles.requirementText}>{client.requirement || "No details"}</p>
                </div>
              </td>
              <td>
                <span className={`${styles.statusBadge} ${styles[client.status.toLowerCase() as keyof typeof styles] || styles.defaultStatus}`}>
                  {client.status}
                </span>
                {client.callbackMonth && (
                  <div className={styles.callbackInfo}>
                    <Calendar size={12} />
                    <span>{client.callbackMonth}</span>
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
                        onClick={() => onEdit(client)} 
                        className={styles.actionBtnEdit}
                        title="Edit Client / Schedule Callback"
                      >
                        <Clock size={16} />
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { Users } from "lucide-react";
