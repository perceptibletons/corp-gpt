import React from "react";


export function StatCard({ title, value, color }) {
return (
<div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
<div style={styles.title}>{title}</div>
<div style={styles.value}>{value}</div>
</div>
);
}


const styles = {
card: { background: "white", padding: "18px", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" },
title: { fontSize: "14px", color: "#777" },
value: { fontSize: "24px", fontWeight: "bold", marginTop: "5px" },
};