import React from "react";
import Sidebar from "./Components/Sidebar";
import Navbar from "./Components/Navbar";
import UserCard from "./Components/UserCard";



export default function UserDetails() {
// dummy user for layout
const user = {
id: 1,
name: "Amit Sharma",
email: "amit@corp.com",
role: "Employee",
phone: "9876543210",
companyId: "ACME123",
inviteCode: "001",
};


return (
<div style={{ display: "flex" }}>
<Sidebar />
<div style={{ flex: 1, padding: "20px" }}>
<Navbar />
<h2>User Details</h2>
<UserCard user={user} />
</div>
</div>
);
}