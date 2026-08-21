import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {fetchNotifications,fetchUnreadCount,markNotificationsSeen,} from "../api/notificari";

const POLL_MS = 30000;

function formatMoment(value) {
  const moment = new Date(value);
  if (Number.isNaN(moment.getTime())) return "";

  const today = new Date();
  const sameDay =
    moment.getFullYear() === today.getFullYear() &&
    moment.getMonth() === today.getMonth() &&
    moment.getDate() === today.getDate();

  if (sameDay) {
    return moment.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return moment.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell({ variant = "light" }) {
  const { user } = useAuth();
  const isClient = user?.rol === "client";

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isClient) return;

    let cancelled = false;

    async function refresh() {
      try {
        const data = await fetchUnreadCount();
        if (!cancelled) setUnread(data?.necitite ?? 0);
      } catch {
      }
    }

    refresh();
    const timer = setInterval(refresh, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isClient]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    setLoading(true);

    try {
      const data = await fetchNotifications();
      setItems(data?.notificari ?? []);

      await markNotificationsSeen();
      setUnread(0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  if (!isClient) return null;

  return (
    <div className="notif" ref={panelRef}>
      <button
        type="button"
        className={`notif-trigger${variant === "dark" ? " notif-trigger--dark" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifications"
        onClick={handleToggle}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 18a2 2 0 0 0 4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-head">Activity</div>

          {loading && <p className="notif-empty">Loading…</p>}

          {!loading && items.length === 0 && (
            <p className="notif-empty">Nothing to report yet.</p>
          )}

          {!loading &&
            items.map((item) => (
              <div
                key={item.id_activitate}
                className={`notif-item${item.citit ? "" : " notif-item--new"}`}
              >
                <span className="notif-text">{item.mesaj}</span>
                <span className="notif-time">{formatMoment(item.moment)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}