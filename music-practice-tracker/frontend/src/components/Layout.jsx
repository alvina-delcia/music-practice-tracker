import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FloatingNotes from "./FloatingNotes";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "◈" },
  { to: "/sessions", label: "Sessions", icon: "♪" },
  { to: "/recordings", label: "Recordings", icon: "🎙" },
  { to: "/calendar", label: "Calendar", icon: "▦" },
  { to: "/goals", label: "Goal", icon: "◔" },
];

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="app-shell">
      <FloatingNotes />
      <div className="mobile-topbar">
        <div className="sidebar-brand" style={{ padding: 0 }}>
          <div className="sidebar-brand-mark" />
          <span className="sidebar-brand-name">Cadence</span>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {mobileOpen && <div className="overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-decor" aria-hidden="true">
          <span className="sidebar-decor-violin">🎻</span>
          <span className="sidebar-decor-guitar">🎸</span>
          <span className="sidebar-piano-keys" />
          <span className="sidebar-mini-note note-1">♪</span>
          <span className="sidebar-mini-note note-2">♫</span>
          <span className="sidebar-mini-note note-3">♪</span>
        </div>

        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" />
          <span className="sidebar-brand-name">Cadence</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar-ring">
              <div className="user-avatar">{initials}</div>
            </div>
            <div className="user-chip-info">
              <div className="user-chip-name">{user?.name}</div>
              <div className="user-chip-email">{user?.email}</div>
            </div>
          </div>
          <button className="nav-link logout-link" onClick={logout}>
            <span className="nav-icon" aria-hidden="true">
              ⏻
            </span>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
