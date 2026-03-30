"use client"

import { useState, useEffect, useRef } from "react";
import styles from "./notes.module.css";
import { 
  Search, 
  MessageSquare, 
  Send, 
  Loader2, 
  ChevronLeft,
  User,
  Clock,
  CheckCheck,
  CalendarDays,
  StickyNote
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { IClient } from "@/models/Client";
import { INote } from "@/models/Note";

export default function NotesPage() {
  const { user, isAdmin, loading: authLoading } = useUser();
  const [clients, setClients] = useState<IClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [messages, setMessages] = useState<INote[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchMessages = async (clientId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchClients();
    }
  }, [authLoading]);

  useEffect(() => {
    if (selectedClient?._id) {
      fetchMessages(selectedClient._id);
      setShowMobileList(false);
    }
  }, [selectedClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient?._id || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/clients/${selectedClient._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  const groupMessagesByDate = (msgs: INote[]) => {
    const groups: { [key: string]: INote[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.createdAt!).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.business?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return null;

  return (
    <div className={`${styles.container} ${!showMobileList ? styles.hideSidebar : ""}`}>
      <aside className={styles.clientList}>
        <div className={styles.listHeader}>
          <h2>Notes</h2>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              className={styles.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.clients}>
          {isLoadingClients ? (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} size={24} />
              <p>Loading notes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={32} />
              <p>No notes found</p>
            </div>
          ) : (
            filteredClients.map(client => (
              <div 
                key={client._id} 
                className={`${styles.clientItem} ${decodeURI(selectedClient?._id || '') === client._id ? styles.activeClient : ""}`}
                onClick={() => setSelectedClient(client)}
              >
                <div className={styles.clientAvatar}>
                  {client.name.substring(0, 1).toUpperCase()}
                </div>
                <div className={styles.clientInfo}>
                  <span className={styles.clientName}>{client.name}</span>
                  <span className={styles.lastMsg}>{client.business || "General Contact"}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className={styles.chatWindow}>
        {selectedClient ? (
          <>
            <header className={styles.chatHeader}>
              <button className={styles.backBtn} onClick={() => setShowMobileList(true)}>
                <ChevronLeft size={24} />
              </button>
              <div className={styles.headerAvatar}>
                <div className={styles.clientAvatar}>
                  {selectedClient.name.substring(0, 1).toUpperCase()}
                </div>
              </div>
              <div className={styles.headerInfo}>
                <h3>{selectedClient.name}</h3>
                <span>{selectedClient.status}</span>
              </div>
            </header>

            <div className={styles.notesTimeline}>
              {isLoadingMessages ? (
                <div className={styles.loading}>
                  <Loader2 className={styles.spinner} size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <StickyNote size={48} />
                  <p>Start adding notes for {selectedClient.name}</p>
                </div>
              ) : (
                Object.entries(messageGroups).map(([date, msgs]) => (
                  <div key={date} className={styles.dateGroup}>
                    <div className={styles.dateHeader}>
                      <CalendarDays size={14} />
                      <span>{date}</span>
                    </div>
                    <div className={styles.notesList}>
                      {msgs.map((msg) => (
                        <div key={msg._id} className={styles.noteEntry}>
                          <div className={styles.noteHeader}>
                            <div className={styles.authorBadge}>
                              <div className={styles.authorAvatar}>
                                {msg.author.substring(0, 1).toUpperCase()}
                              </div>
                              <div className={styles.authorMeta}>
                                <span className={styles.noteAuthor}>{msg.author}</span>
                                <span className={styles.authorRole}>{msg.authorRole}</span>
                              </div>
                            </div>
                            <span className={styles.noteTime}>
                              {new Date(msg.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                          <div className={styles.noteContent}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <form onSubmit={handleSendMessage} className={styles.form}>
                <input 
                  type="text" 
                  placeholder="Write a note..." 
                  className={styles.input}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                />
                <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim() || isSending}>
                  {isSending ? <Loader2 size={20} className={styles.spinner} /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <MessageSquare size={64} />
            </div>
            <h2>Select a client</h2>
            <p>Choose a client from the list to view their history and manage notes.</p>
          </div>
        )}
      </main>
    </div>
  );
}
