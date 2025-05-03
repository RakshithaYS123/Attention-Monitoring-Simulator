import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalAttentiveTime: 0,
    totalDistractedTime: 0,
    averageAttentionSpan: 0,
    latestSessions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/sessions/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStats(response.data);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (seconds) => {
    if (!seconds) return "0m 0s";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          Welcome, {user?.username || "User"}!
        </h2>
        <Link to="/monitor" className="start-button">
          Start New Session
        </Link>
      </div>

      {loading ? (
        <p>Loading your stats...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-title">Total Sessions</div>
              <div className="metric-value">{stats.totalSessions}</div>
            </div>
            <div className="dashboard-card">
              <div className="card-title">Total Attentive Time</div>
              <div className="metric-value">
                {formatTime(stats.totalAttentiveTime)}
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-title">Total Distracted Time</div>
              <div className="metric-value">
                {formatTime(stats.totalDistractedTime)}
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-title">Average Attention Span</div>
              <div className="metric-value">
                {formatTime(stats.averageAttentionSpan)}
              </div>
            </div>
          </div>

          <div className="history-section">
            <h3>Recent Sessions</h3>
            {stats.latestSessions.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Attentive Time</th>
                    <th>Distracted Time</th>
                    <th>Attention Switches</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.latestSessions.map((session) => (
                    <tr key={session._id}>
                      <td>{formatDate(session.createdAt)}</td>
                      <td>{formatTime(session.totalDuration)}</td>
                      <td>{formatTime(session.attentiveTime)}</td>
                      <td>{formatTime(session.distractedTime)}</td>
                      <td>{session.attentionSwitches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>
                No sessions recorded yet. Start your first monitoring session!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
