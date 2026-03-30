"use client"

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import ClientTable from "@/components/ClientTable";
import { 
  Trash2, 
  RotateCcw, 
  Search,
  Loader2,
  AlertCircle
} from "lucide-react";
import { IClient } from "@/models/Client";

export default function DiscardSection() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDiscardedClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients?discarded=true");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch discarded clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscardedClients();
  }, []);

  const handleRestoreClient = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDiscarded: false }),
      });

      if (response.ok) {
        fetchDiscardedClients();
      }
    } catch (error) {
      console.error("Failed to restore client:", error);
    }
  };

  const handleDeletePermanently = async (id: string) => {
    if (!confirm("Are you sure? This action is IRREVERSIBLE and will permanently delete the client from the database.")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchDiscardedClients();
      }
    } catch (error) {
      console.error("Failed to delete client:", error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchDiscardedClients();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactNumber.includes(searchTerm)
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Discard Section</h1>
          <p className={styles.subtitle}>Manage inactive leads and discarded client profiles.</p>
        </div>
      </header>

      <div className={styles.infoBanner}>
        <AlertCircle size={20} />
        <p>Clients in this section are hidden from the main dashboard. You can restore them or delete them permanently.</p>
      </div>

      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search discarded clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 size={40} className={styles.spinner} />
            <p>Loading discarded clients...</p>
          </div>
        ) : (
          <ClientTable 
            clients={filteredClients} 
            onEdit={() => {}} 
            onView={() => {}}
            onScheduleCallback={() => {}}
            onUpdateStatus={handleUpdateStatus}
            onRestore={handleRestoreClient}
            onDelete={handleDeletePermanently}
            isDiscardView={true}
          />
        )}
      </section>

      <style jsx>{`
        .infoBanner {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.875rem;
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
}
