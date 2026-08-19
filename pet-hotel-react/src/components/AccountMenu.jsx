import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function AccountMenu({ variant = "light" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
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

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className={`account-trigger${variant === "dark" ? " account-trigger--dark" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path
            d="M4 20c0-4 4-6 8-6s8 2 8 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span
          className={`account-caret${open ? " is-open" : ""}`}
          aria-hidden="true"
        >
          {"\u25BE"}
        </span>
      </button>

      {open && (
        <div className="account-dropdown" role="menu">
          {user?.rol === "admin" && (
            <>
              <Link
                to="/admin"
                role="menuitem"
                className="account-item"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>

              <div className="account-sep" />
            </>
          )}

          {user?.rol === "angajat" && (
            <>
              <Link
                to="/dashboard"
                role="menuitem"
                className="account-item"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>

              <div className="account-sep" />
            </>
          )}

          {user?.rol === "client" && (
            <>
              <Link
                to="/cont"
                role="menuitem"
                className="account-item"
                onClick={() => setOpen(false)}
              >
                My account
              </Link>

              <Link
                to="/rezervari"
                role="menuitem"
                className="account-item"
                onClick={() => setOpen(false)}
              >
                My bookings
              </Link>

              <Link
                to="/animale"
                role="menuitem"
                className="account-item"
                onClick={() => setOpen(false)}
              >
                My pets
              </Link>

              <div className="account-sep" />
            </>
          )}

          <button
            type="button"
            role="menuitem"
            className="account-item account-item--danger"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}