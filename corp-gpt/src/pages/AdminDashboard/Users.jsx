import React from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";


export default function Users() {
return (
<div style={{ display: "flex" }}>
<Sidebar />
<div style={{ flex: 1, padding: "20px" }}>
<Navbar />
<h2>All Users</h2>
</div>
</div>
);
}