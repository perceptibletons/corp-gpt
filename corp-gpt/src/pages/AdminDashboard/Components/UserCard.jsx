import React from "react";

export default function UserCard({ user }) {
  if (!user) return null;

  return (
    <div style={styles.card}>
      <h3 style={styles.name}>{user.name}</h3>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Phone:</strong> {user.phone}</p>
      <p><strong>Company ID:</strong> {user.companyId}</p>
      <p><strong>Invite Code:</strong> {user.inviteCode}</p>
    </div>
  );
}

const styles = {
  card: {
    padding: "20px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    marginTop: "20px",
  },
  name: {
    marginBottom: "10px",
  },
};
