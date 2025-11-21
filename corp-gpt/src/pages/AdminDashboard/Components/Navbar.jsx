import React from "react";

export default function Navbar() {
  return (
    <div style={navbarStyles.navbar}>
      <div>Admin Panel</div>
      <button style={navbarStyles.logoutBtn}>Logout</button>
    </div>
  );
}

const navbarStyles = {
  navbar: {
    background: "white",
    padding: "12px 20px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    borderRadius: "10px"
  },
  logoutBtn: {
    background: "#ff5252",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer"
  },
};
