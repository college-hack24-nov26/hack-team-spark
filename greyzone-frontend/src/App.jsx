import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";

import NetworkMonitor from "./pages/NetworkMonitor";
import ThreatSimulation from "./pages/ThreatSimulation";
import DefenceArena from "./pages/DefenceArena";
import IncidentReports from "./pages/IncidentReports";

import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Server,
  Clock,
  ArrowUpRight,
  Wifi,
  Database,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ======================================
// OVERVIEW DASHBOARD
// ======================================

function Overview() {
  const activityData = [
    { time: "09:00", activity: 22 },
    { time: "10:00", activity: 35 },
    { time: "11:00", activity: 28 },
    { time: "12:00", activity: 48 },
    { time: "13:00", activity: 40 },
    { time: "14:00", activity: 65 },
    { time: "15:00", activity: 52 },
    { time: "16:00", activity: 72 },
    { time: "17:00", activity: 58 },
  ];

  const incidents = [
    {
      id: "INC-001",
      event: "Unusual Network Activity",
      component: "Bunker 01",
      severity: "High",
      status: "Contained",
      time: "10:42 AM",
    },
    {
      id: "INC-002",
      event: "Suspicious Access Pattern",
      component: "Core Gateway",
      severity: "Medium",
      status: "Monitoring",
      time: "11:18 AM",
    },
    {
      id: "INC-003",
      event: "Unknown Device Detected",
      component: "Bunker 03",
      severity: "Low",
      status: "Under Review",
      time: "12:05 PM",
    },
  ];

  return (
    <div className="page-content">

      {/* WELCOME SECTION */}

      <section className="welcome-section">
        <div>
          <span className="section-eyebrow">
            COMMAND CENTRE / OVERVIEW
          </span>

          <h1>Security Overview</h1>

          <p>
            Monitor simulated network health, review security events,
            and evaluate automated defence responses.
          </p>
        </div>

        <div className="simulation-badge">
          <span className="live-dot"></span>
          SIMULATION ACTIVE
        </div>
      </section>

      {/* STATISTICS */}

      <section className="stats-grid">

        <StatCard
          title="Network Health"
          value="96.8%"
          change="+2.4%"
          description="Illustrative health score"
          icon={Activity}
          color="cyan"
        />

        <StatCard
          title="Connected Systems"
          value="12"
          change="Stable"
          description="Simulated components"
          icon={Server}
          color="blue"
        />

        <StatCard
          title="Active Threats"
          value="02"
          change="Monitoring"
          description="Synthetic threat events"
          icon={AlertTriangle}
          color="orange"
        />

        <StatCard
          title="Containment Rate"
          value="94.2%"
          change="+4.8%"
          description="Illustrative response score"
          icon={ShieldCheck}
          color="green"
        />

      </section>

      {/* MAIN DASHBOARD PANELS */}

      <section className="dashboard-grid">

        {/* NETWORK ACTIVITY CHART */}

        <div className="dashboard-panel activity-panel">

          <div className="panel-heading">
            <div>
              <h2>Network Activity</h2>
              <p>
                Illustrative activity across the simulated environment
              </p>
            </div>

            <span className="panel-icon">
              <Activity size={19} />
            </span>
          </div>

          <div className="activity-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>

                <defs>
                  <linearGradient
                    id="activityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#22d3ee"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#22d3ee"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#263449"
                />

                <XAxis
                  dataKey="time"
                  stroke="#8494aa"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="#8494aa"
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  contentStyle={{
                    background: "#111c2d",
                    border: "1px solid #31435c",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#activityGradient)"
                />

              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-footer">
            <span>
              <span className="chart-dot"></span>
              Simulated network activity
            </span>

            <span>Scale: 0–100</span>
          </div>

        </div>

        {/* SYSTEM STATUS */}

        <div className="dashboard-panel system-panel">

          <div className="panel-heading">
            <div>
              <h2>System Status</h2>
              <p>Fictional infrastructure components</p>
            </div>

            <span className="panel-icon">
              <Server size={19} />
            </span>
          </div>

          <div className="system-status-list">

            <div className="system-status-item">
              <div className="system-status-left">
                <Wifi size={18} />

                <div>
                  <strong>Core Gateway</strong>
                  <span>Primary connection</span>
                </div>
              </div>

              <span className="status-pill operational">
                Operational
              </span>
            </div>

            <div className="system-status-item">
              <div className="system-status-left">
                <Server size={18} />

                <div>
                  <strong>Bunker 01</strong>
                  <span>Security monitoring</span>
                </div>
              </div>

              <span className="status-pill monitoring">
                Monitoring
              </span>
            </div>

            <div className="system-status-item">
              <div className="system-status-left">
                <Server size={18} />

                <div>
                  <strong>Bunker 02</strong>
                  <span>Service component</span>
                </div>
              </div>

              <span className="status-pill operational">
                Operational
              </span>
            </div>

            <div className="system-status-item">
              <div className="system-status-left">
                <Database size={18} />

                <div>
                  <strong>Data Centre</strong>
                  <span>Storage component</span>
                </div>
              </div>

              <span className="status-pill operational">
                Operational
              </span>
            </div>

          </div>

          <div className="system-panel-footer">
            <span>View network topology</span>
            <ArrowUpRight size={16} />
          </div>

        </div>

      </section>

      {/* RECENT INCIDENTS */}

      <section className="dashboard-panel incidents-panel">

        <div className="panel-heading">
          <div>
            <h2>Recent Security Events</h2>
            <p>
              Predefined events from the GREYZONE simulation
            </p>
          </div>

          <span className="panel-icon">
            <AlertTriangle size={19} />
          </span>
        </div>

        <div className="incident-table-wrapper">

          <table className="incident-table">

            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Event</th>
                <th>Component</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>

                  <td className="incident-id">
                    {incident.id}
                  </td>

                  <td>{incident.event}</td>

                  <td>{incident.component}</td>

                  <td>
                    <span
                      className={`severity ${incident.severity.toLowerCase()}`}
                    >
                      {incident.severity}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`incident-status ${incident.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {incident.status}
                    </span>
                  </td>

                  <td className="incident-time">
                    <Clock size={13} />
                    {incident.time}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </section>

      {/* FOOTER */}

      <div className="dashboard-footer">
        <span>
          GREYZONE Autonomous Cyber Defence Simulation
        </span>

        <span>
          All displayed metrics and events are illustrative demo data.
        </span>
      </div>

    </div>
  );
}

// ======================================
// MAIN APPLICATION
// ======================================

function App() {
  const [activePage, setActivePage] = useState("Overview");

  const renderPage = () => {
    switch (activePage) {

      case "Overview":
        return <Overview />;

      case "Network Monitor":
        return <NetworkMonitor />;

      case "Threat Simulation":
        return <ThreatSimulation />;

      case "Defence Arena":
        return <DefenceArena />;

      case "Incident Reports":
        return <IncidentReports />;

      case "Settings":
        return (
          <div className="page-content">
            <span className="section-eyebrow">
              CONFIGURATION
            </span>

            <h1>Settings</h1>

            <p>
              GREYZONE demonstration environment settings.
            </p>
          </div>
        );

      case "Help & Support":
        return (
          <div className="page-content">
            <span className="section-eyebrow">
              SUPPORT CENTRE
            </span>

            <h1>Help & Support</h1>

            <p>
              Learn about the GREYZONE dashboard and its simulated features.
            </p>
          </div>
        );

      default:
        return <Overview />;
    }
  };

  return (
    <div className="app-layout">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main-content">
        <Header activePage={activePage} />

        {renderPage()}
      </main>

    </div>
  );
}

export default App;