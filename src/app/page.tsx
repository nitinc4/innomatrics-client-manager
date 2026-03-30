"use client"

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import ClientTable from "@/components/ClientTable";
import ClientModal from "@/components/ClientModal";
import ScheduleModal from "@/components/ScheduleModal";
import { 
  Plus, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Search,
  Filter,
  Loader2,
  Phone,
  CalendarDays,
  XCircle,
  Archive
} from "lucide-react";
import { IClient } from "@/models/Client";

export default function Dashboard() {
  const [clients, setClients] = useState<IClient[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, statsRes] = await Promise.all([
        fetch("/api/clients?discarded=false"),
        fetch("/api/statuses")
      ]);
      
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        fetchData();
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
        fetchData();
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
        fetchData();
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
      client.business?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.requirement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = clients.length;

  const getStatusIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'active': return <Clock size={20} />;
      case 'rna': return <Phone size={20} />;
      case 'callback': return <CalendarDays size={20} />;
      case 'converted': return <CheckCircle2 size={20} />;
      case 'lost': return <XCircle size={20} />;
      case 'completed': return <CheckCircle2 size={20} />;
      case 'archived': return <Archive size={20} />;
      default: return <ArrowUpRight size={20} />;
    }
  };

  const statusStats = [
    { label: "Total", value: total, color: "#6366f1", bg: "#eff6ff", icon: <Users size={20} />, status: "All" },
    ...statuses.map(s => ({
      label: s.name,
      value: clients.filter(c => c.status === s.name).length,
      color: s.color,
      bg: `${s.color}15`,
      icon: getStatusIcon(s.name),
      status: s.name
    }))
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Client Dashboard</h1>
          <p className={styles.subtitle}>Welcome back, Super User. Manage your clients efficiently.</p>
        </div>
        <button onClick={openAddModal} className={styles.addButton}>
          <Plus size={20} />
          <span>Add New Client</span>
        </button>
      </header>

      <section className={styles.statsGrid}>
        {statusStats.map((stat, idx) => {
          const pct = total > 0 ? Math.round((stat.value / total) * 100) : 0;
          const isActive = statusFilter === stat.status;
          return (
            <div 
              key={idx} 
              className={`${styles.statCard} ${isActive ? styles.statCardActive : ""}`}
              onClick={() => setStatusFilter(stat.status)}
              style={{ cursor: "pointer", borderColor: isActive ? stat.color : undefined }}
              title={`Filter by ${stat.label}`}
            >
              <div className={styles.statTop}>
                <div className={styles.statIcon} style={{ backgroundColor: stat.bg, color: stat.color }}>
                  {stat.icon}
                </div>
                <div className={styles.statInfo}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <div className={styles.statValueContainer}>
                    <h3 className={styles.statValue}>{stat.value}</h3>
                    {stat.status !== "All" && (
                      <span className={styles.statPct} style={{ color: stat.color }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {stat.status !== "All" && (
                <div className={styles.statBar}>
                  <div 
                    className={styles.statBarFill} 
                    style={{ width: `${pct}%`, backgroundColor: stat.color }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search clients by name, phone or business..." 
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
              {statuses.map(s => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
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
        title={isViewOnly ? "Client Details" : (selectedClient ? "Edit Client Details" : "Register New Client")}
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
