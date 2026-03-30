"use client"

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import ClientTable from "@/components/ClientTable";
import ClientModal from "@/components/ClientModal";
import { 
  Users, 
  Search,
  Filter,
  Loader2,
  Plus
} from "lucide-react";
import { IClient } from "@/models/Client";

export default function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients?discarded=false");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSaveClient = async (clientData: Partial<IClient>) => {
    const url = selectedClient ? `/api/clients/${selectedClient._id}` : "/api/clients";
    const method = selectedClient ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to save client:", error);
    }
  };

  const handleDiscardClient = async (id: string) => {
    if (!confirm("Are you sure you want to move this client to the discard section?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDiscarded: true }),
      });

      if (response.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to discard client:", error);
    }
  };

  const openAddModal = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: IClient) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactNumber.includes(searchTerm) ||
    client.business?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>All Clients</h1>
          <p className={styles.subtitle}>Detailed view and management of all active clients.</p>
        </div>
        <button onClick={openAddModal} className={styles.addButton}>
          <Plus size={20} />
          <span>Add Client</span>
        </button>
      </header>

      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Filter clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Loader2 size={40} className={styles.spinner} />
            <p>Loading clients...</p>
          </div>
        ) : (
          <ClientTable 
            clients={filteredClients} 
            onEdit={openEditModal} 
            onDiscard={handleDiscardClient}
          />
        )}
      </section>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient}
        initialData={selectedClient}
        title={selectedClient ? "Update Client" : "Register Client"}
      />
    </div>
  );
}
