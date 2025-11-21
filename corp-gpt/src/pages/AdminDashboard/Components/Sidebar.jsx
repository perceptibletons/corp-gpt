import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div style={sidebarStyles.sidebar}>
      <h2 style={sidebarStyles.logo}>CorpGPT Admin</h2>
      <ul style={sidebarStyles.navList}>
        <li><Link style={sidebarStyles.navItem} to="/admin/dashboard">Dashboard</Link></li>
        <li><Link style={sidebarStyles.navItem} to="/admin/users">All Users</Link></li>
        <li><Link style={sidebarStyles.navItem} to="/admin/pending">Pending Approvals</Link></li>
        <li><Link style={sidebarStyles.navItem} to="/admin/settings">Settings</Link></li>
      </ul>
    </div>
  );
}

const sidebarStyles = {
  sidebar: { width: "230px", background: "#1e1e2f", color: "white", padding: "20px" },
  logo: { fontSize: "22px", marginBottom: "20px" },
  navList: { listStyle: "none", padding: 0 },
  navItem: { display: "block", padding: "12px 5px", color: "#cfcfe1", textDecoration: "none" },
};
