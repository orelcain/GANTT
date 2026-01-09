import { useState, useEffect, useRef } from "react";
import { useGanttStore } from "../lib/store";
import type { Notification } from "../lib/types";

export function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useGanttStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "deadline":
        return "⏰";
      case "mention":
        return "💬";
      case "update":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "deadline":
        return "#cf222e";
      case "mention":
        return "#0969da";
      case "update":
        return "#1a7f37";
      default:
        return "#6e7781";
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          padding: "8px 12px",
          background: "none",
          border: "1px solid var(--color-border-default)",
          borderRadius: 6,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 20,
        }}
        title={`${unreadCount} notificación${unreadCount !== 1 ? "es" : ""} sin leer`}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "#cf222e",
              color: "#fff",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 380,
            maxHeight: 500,
            background: "var(--color-canvas-default)",
            border: "1px solid var(--color-border-default)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            animation: "slideDown 0.2s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border-default)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--color-canvas-subtle)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Notificaciones {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: "4px 8px",
                    background: "none",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--color-fg-muted)",
                  }}
                  title="Marcar todas como leídas"
                >
                  ✓ Todas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar todas las notificaciones?")) {
                      clearNotifications();
                    }
                  }}
                  style={{
                    padding: "4px 8px",
                    background: "none",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--color-fg-muted)",
                  }}
                  title="Limpiar todas"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 400 }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--color-fg-muted)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                <div>No hay notificaciones</div>
              </div>
            ) : (
              notifications.map((notification) => {
                const color = getNotificationColor(notification.type);
                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid var(--color-border-default)",
                      cursor: notification.read ? "default" : "pointer",
                      background: notification.read ? "transparent" : `${color}08`,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      transition: "background 0.2s ease",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: `${color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {notification.taskName && (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--color-fg-default)",
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {notification.taskName}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--color-fg-default)",
                          lineHeight: 1.4,
                          marginBottom: 4,
                        }}
                      >
                        {notification.message}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-fg-muted)" }}>
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
