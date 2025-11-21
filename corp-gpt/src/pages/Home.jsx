import React from "react";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Welcome to CorpGPT</h1>
        <p className="home-subtitle">
          Your AI-powered Corporate Assistant for Employees, Managers & Admins.
        </p>

        <div className="home-buttons">
          <a href="/login" className="home-btn">Login</a>
          <a href="/signup" className="home-btn-outline">Signup</a>
        </div>
      </div>
    </div>
  );
}
