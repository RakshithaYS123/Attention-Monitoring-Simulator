import React from "react";
import { Link } from "react-router-dom";

const Navigation = ({ isAuthenticated, user, logout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">Attention Monitoring Simulator</div>
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/monitor">Monitor</Link>
            <div className="user-info">
              <span>Hello, {user?.username || "User"}</span>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
