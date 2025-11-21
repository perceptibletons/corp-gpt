import React from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import PendingApprovals from "./components/PendingApprovals";


export default function PendingPage() {
return (
<div style={{ display: "flex" }}>
<Sidebar />
<div style={{ flex: 1, padding: "20px" }}>
<Navbar />
<PendingApprovals />
</div>
</div>
);
}