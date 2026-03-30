"use client"

import { useState, useEffect } from "react";
import styles from "./calendar.module.css";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  LayoutDashboard
} from "lucide-react";
import { IClient } from "@/models/Client";
import Link from "next/link";

export default function CallbackCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState<IClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const fetchCallbacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients?discarded=false");
      if (response.ok) {
        const data = await response.json();
        // Filter clients who have callbacks
        const callbackClients = data.filter((c: IClient) => c.callback);
        setClients(callbackClients);
      }
    } catch (error) {
      console.error("Failed to fetch callbacks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCallbacks();
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const calendarDays = [];
  // Add empty slots for the first week
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  // Add actual days
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const getCallbacksForDate = (date: Date) => {
    return clients.filter(client => {
      const callbackDate = new Date(client.callback);
      return (
        callbackDate.getDate() === date.getDate() &&
        callbackDate.getMonth() === date.getMonth() &&
        callbackDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const selectedCallbacks = selectedDate ? getCallbacksForDate(selectedDate) : [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Callback Calendar</h1>
          <p className={styles.subtitle}>View and manage your upcoming client conversations.</p>
        </div>
        <div className={styles.calendarNav}>
          <button onClick={handlePrevMonth} className={styles.navBtn}><ChevronLeft size={20} /></button>
          <h2 className={styles.monthDisplay}>{monthNames[month]} {year}</h2>
          <button onClick={handleNextMonth} className={styles.navBtn}><ChevronRight size={20} /></button>
        </div>
      </header>

      <div className={styles.mainGrid}>
        <div className={`${styles.calendarCard} animate-fade-in`}>
          <div className={styles.weekdays}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className={styles.weekday}>{d}</div>
            ))}
          </div>
          <div className={styles.daysGrid}>
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={idx} className={styles.emptyDay}></div>;

              const callbacks = getCallbacksForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();

              return (
                <div 
                  key={idx} 
                  className={`${styles.day} ${isSelected ? styles.selectedDay : ""} ${isToday ? styles.today : ""}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className={styles.dayNumber}>{date.getDate()}</span>
                  {callbacks.length > 0 && (
                    <div className={styles.badgeContainer}>
                      <div className={styles.callbackBadge} title={`${callbacks.length} Callbacks`}>
                        {callbacks.length}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${styles.detailsCard} animate-fade-in`}>
          <div className={styles.detailsHeader}>
            <CalendarIcon size={20} className={styles.detailsIcon} />
            <h3>Callbacks for {selectedDate?.toLocaleDateString()}</h3>
          </div>

          <div className={styles.callbackList}>
            {selectedCallbacks.length > 0 ? (
              selectedCallbacks.map((client) => (
                <div key={client._id} className={styles.callbackItem}>
                  <div className={styles.itemHeader}>
                    <div className={styles.clientInfo}>
                      <User size={16} />
                      <span className={styles.clientName}>{client.name}</span>
                    </div>
                    <div className={styles.timeInfo}>
                      <Clock size={14} />
                      <span>{client.callback.split('T')[1] || "No time"}</span>
                    </div>
                  </div>
                  <div className={styles.itemContact}>
                    <Phone size={14} />
                    <span>{client.contactNumber}</span>
                  </div>
                  <div className={styles.itemFooter}>
                    <span className={styles.statusBadge}>{client.status}</span>
                    <Link href={`/?id=${client._id}`} className={styles.viewLink}>
                      View Client <LayoutDashboard size={14} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noCallbacks}>
                <Clock size={48} className={styles.noIcon} />
                <p>No callbacks scheduled for this day.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
