"use client"

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import ClientTable from "@/components/ClientTable";
import ClientModal from "@/components/ClientModal";
import ScheduleModal from "@/components/ScheduleModal";
import { 
  Users, 
  Search,
  Filter,
  Loader2,
  Plus,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { IClient } from "@/models/Client";
import * as XLSX from "xlsx";

export default function ClientsPage() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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

  const exportToExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const handleExportAll = () => {
    const exportData = filteredClients.map(c => ({
      Name: c.name,
      Contact: c.contactNumber,
      Location: c.location,
      Business: c.business,
      Requirement: c.requirement,
      Description: c.description,
      Status: c.status,
      Assigned: c.assign,
      Callback_Month: c.callbackMonth,
      Callback_Date: c.callback
    }));
    exportToExcel(exportData, "innomatrics_all_clients");
  };

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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const openAddModal = () => {
    setSelectedClient(null);
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const openViewModal = (client: IClient) => {
    setSelectedClient(client);
    setIsViewOnly(true);
    setIsModalOpen(true);
  };

  const openEditModal = (client: IClient) => {
    setSelectedClient(client);
    setIsViewOnly(false);
    setIsModalOpen(true);
  };

  const openScheduleModal = (client: IClient) => {
    setSelectedClient(client);
    setIsScheduleOpen(true);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactNumber.includes(searchTerm) ||
      client.business?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>All Clients</h1>
          <p className={styles.subtitle}>Detailed view and management of all active clients.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportAll} className={styles.addButton} style={{ background: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', boxShadow: 'none' }}>
            <FileSpreadsheet size={18} />
            <span>Export Filtered</span>
          </button>
          <button onClick={openAddModal} className={styles.addButton}>
            <Plus size={20} />
            <span>Add Client</span>
          </button>
        </div>
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
          
          <div className={styles.filterWrapper}>
            <Filter size={18} className={styles.filterIcon} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.statusFilter}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="RNA">RNA</option>
              <option value="Callback">Callback</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
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
            onView={openViewModal}
            onScheduleCallback={openScheduleModal}
            onUpdateStatus={handleUpdateStatus}
            onDiscard={handleDiscardClient}
          />
        )}
      </section>

      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient}
        initialData={selectedClient}
        title={isViewOnly ? "Client Details" : (selectedClient ? "Update Client" : "Register Client")}
        viewOnly={isViewOnly}
      />

      <ScheduleModal 
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
      />
    </div>
  );
}
