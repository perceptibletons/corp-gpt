import React from "react";
import { StatCard } from "./StatCard";


export default function StatsRow() {
return (
<div style={styles.statsRow}>
<StatCard title="Total Users" value="142" color="#6c63ff" />
<StatCard title="Pending Approvals" value="7" color="#ff8a65" />
<StatCard title="Active Employees" value="119" color="#4caf50" />
<StatCard title="Departments" value="5" color="#29b6f6" />
</div>
);
}


const styles = {
statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "20px" },
};