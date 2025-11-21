import React from "react";


export default function PendingApprovals() {
const dummyUsers = [
{ id: 1, name: "Amit Sharma", role: "Employee", email: "amit@corp.com" },
{ id: 2, name: "Neha Verma", role: "Intern", email: "neha@corp.com" },
{ id: 3, name: "Rohit Singh", role: "Employee", email: "rohit@corp.com" },
];


return (
<div style={styles.tableBox}>
<h3 style={styles.title}>Pending Approvals</h3>
<table style={styles.table}>
<thead>
<tr>
<th>Name</th>
<th>Email</th>
<th>Role</th>
<th>Action</th>
</tr>
</thead>
<tbody>
{dummyUsers.map((u) => (
<tr key={u.id}>
<td>{u.name}</td>
<td>{u.email}</td>
<td>{u.role}</td>
<td>
<button style={styles.approve}>Approve</button>
<button style={styles.reject}>Reject</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
);
}


const styles = {
tableBox: { background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" },
title: { marginBottom: "10px", fontSize: "20px" },
table: { width: "100%", borderCollapse: "collapse" },
approve: { background: "#4caf50", color: "white", padding: "6px 10px", borderRadius: "5px", marginRight: "5px" },
reject: { background: "#f44336", color: "white", padding: "6px 10px", borderRadius: "5px" },
};