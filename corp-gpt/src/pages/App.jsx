import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/login";
import Signup from "./pages/Signup";

import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import Users from "./pages/AdminDashboard/Users";
import PendingApprovals from "./pages/AdminDashboard/PendingApprovals";
import UserDetails from "./pages/AdminDashboard/UserDetails";

export default function App() {
  return (
    <Routes>
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<Users />} />
      <Route path="/admin/pending" element={<PendingApprovals />} />
      <Route path="/admin/user/:id" element={<UserDetails />} />

      {/* Auth Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
}
