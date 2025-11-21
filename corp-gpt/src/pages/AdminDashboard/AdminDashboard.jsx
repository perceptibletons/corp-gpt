import React from "react";
import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import StatsRow from "./Components/StatsRow";
import PendingApprovals from "./Components/PendingApprovals";

export default function AdminDashboard() {
  return (
    <div style={styles.wrapper}>
      <Sidebar />
      <div style={styles.main}>
        <Navbar />
        <h1 style={styles.header}>Welcome Back, Admin 👋</h1>
        <StatsRow />
        <PendingApprovals />
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#f0f2f5" },
  main: { flex: 1, padding: "20px" },
  header: { fontSize: "26px", marginBottom: "15px", fontWeight: "bold" },
};
