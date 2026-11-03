
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";

import NetworkMonitor from "./pages/NetworkMonitor";
import ThreatSimulation from "./pages/ThreatSimulation";
import DefenceArena from "./pages/DefenceArena";
import IncidentReports from "./pages/IncidentReports";

import { api } from "./api";

import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Server,
  Clock,
  ArrowUpRight,
  Wifi,
  Database,
  RefreshCw,
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
// NETWORK GRAPH COMPONENTS
// ======================================

const NETWORK_NODES = [
  {
    id: "internet_gateway",
    name: "Internet Gateway",
    detail: "External network entry",
    icon: Wifi,
  },
  {
    id: "firewall",
    name: "Firewall",
    detail: "Network boundary node",
    icon: ShieldCheck,
  },
  {
    id: "web_server",
    name: "Web Server",
    detail: "Web services",
    icon: Server,
  },
  {
    id: "app_server",
    name: "Application Server",
    detail: "Application services",
    icon: Server,
  },
  {
    id: "auth_server",
    name: "Authentication Server",
    detail: "Authentication services",
    icon: ShieldCheck,
  },
  {
    id: "database_server",
    name: "Database Server",
    detail: "Data storage",
    icon: Database,
  },
  {
    id: "monitoring_server",
    name: "Monitoring Server",
    detail: "Monitoring services",
    icon: Activity,
  },
];

// ======================================
// HELPER FUNCTIONS
// ======================================

const formatTarget = (target) => {
  switch (target) {
    case "demo-login":
      return "Demo Login";
    case "internet_gateway":
      return "Internet Gateway";
    case "firewall":
      return "Firewall";
    case "web_server":
      return "Web Server";
    case "app_server":
      return "Application Server";
    case "auth_server":
      return "Authentication Server";
    case "database_server":
      return "Database Server";
    case "monitoring_server":
      return "Monitoring Server";
    default:
      return target || "Not specified";
  }
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN");
};

const formatStatus = (value) => {
  if (!value) return "Unknown";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// ======================================
// BACKEND RESPONSE NORMALIZATION
// ======================================

function normalizeStatusResponse(response) {
  const payload = response?.data ?? response ?? {};

  // Support root-level statistics and nested statistics.
  return {
    ...(payload.statistics || {}),
    ...payload,
  };
}

function normalizeIncidentResponse(response) {
  const payload = response?.data ?? response ?? {};

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.incidents)) {
    return payload.incidents;
  }

  return [];
}

// ======================================
// OVERVIEW DASHBOARD
// ======================================

function Overview({ onNavigate }) {
  const [status, setStatus] = useState(null);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ======================================
  // LOAD DASHBOARD DATA
  // ======================================

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const [statusResult, incidentResult] =
        await Promise.allSettled([
          api.getStatus(),
          api.getIncidents(),
        ]);

      // Fetch global backend statistics.
      if (statusResult.status === "fulfilled") {
        const statusData = normalizeStatusResponse(
          statusResult.value
        );

        setStatus(statusData);

        console.log(
          "GREYZONE Dashboard Statistics:",
          statusData
        );
      } else {
        throw statusResult.reason;
      }

      // Fetch incident records.
      if (incidentResult.status === "fulfilled") {
        const incidentData = normalizeIncidentResponse(
          incidentResult.value
        );

        setIncidents(incidentData);
      } else {
        console.error(
          "Unable to load incident records:",
          incidentResult.reason
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load dashboard data from the backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ======================================
  // INITIAL AND AUTOMATIC REFRESH
  // ======================================

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 30 * 1000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  // ======================================
  // REFRESH WHEN TAB BECOMES VISIBLE
  // ======================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadDashboard]);

  // ======================================
  // SORT INCIDENTS
  // ======================================

  const sortedIncidents = useMemo(() => {
    return [...incidents].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );
  }, [incidents]);

  const latestIncident = sortedIncidents[0];

  // ======================================
  // INCIDENT SEVERITY DISTRIBUTION
  // ======================================

  const severityData = useMemo(() => {
    const counts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    incidents.forEach((incident) => {
      const severity = String(
        incident.severity || ""
      ).toLowerCase();

      if (severity === "low") counts.Low++;
      else if (severity === "medium") counts.Medium++;
      else if (severity === "high") counts.High++;
      else if (severity === "critical") counts.Critical++;
    });

    return Object.entries(counts).map(
      ([severity, count]) => ({
        severity,
        count,
      })
    );
  }, [incidents]);

  // ======================================
  // NETWORK COMPONENT STATUS
  // ======================================

  const affectedNodes =
    latestIncident?.network_state?.affected_nodes || [];

  const getNodeStatus = (nodeId) => {
    return affectedNodes.includes(nodeId)
      ? "Isolated"
      : "In Graph";
  };

  // ======================================
  // INCIDENT STATUS
  // ======================================

  const getIncidentStatus = (value) => {
    const incidentStatus = String(
      value || "unknown"
    ).toLowerCase();

    if (incidentStatus === "contained") return "Contained";
    if (incidentStatus === "failed") return "Failed";
    if (incidentStatus === "safe") return "Safe";

    return formatStatus(incidentStatus);
  };

  // ======================================
  // GLOBAL BACKEND STATISTICS
  // ======================================

  const totalIncidents =
    status?.totalIncidents ?? incidents.length;

  const activeThreats =
    status?.activeThreats ?? 0;

  const containedIncidents =
    status?.containedIncidents ?? 0;

  const blockedSources =
    status?.blockedSources ?? 0;

  // ======================================
  // DASHBOARD UI
  // ======================================

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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >

          <button
            className="incident-view-button"
            onClick={loadDashboard}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "spin" : ""}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Dashboard"}
          </button>

          <div className="simulation-badge">
            <span className="live-dot"></span>
            SIMULATION ACTIVE
          </div>

        </div>

      </section>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          className="dashboard-panel"
          style={{ marginBottom: 20 }}
        >
          <p style={{ color: "#ff7777" }}>
            Backend connection error: {error}
          </p>
        </div>
      )}

      {/* STATISTICS CARDS */}

      <section className="stats-grid">

        <StatCard
          title="Total Incidents"
          value={
            loading ? "..." : totalIncidents
          }
          change="Backend Data"
          description="Recorded security events"
          icon={Activity}
          color="cyan"
        />

        <StatCard
          title="Active Threats"
          value={
            loading ? "..." : activeThreats
          }
          change="Current Count"
          description="Detected threat incidents"
          icon={AlertTriangle}
          color="orange"
        />

        <StatCard
          title="Contained Incidents"
          value={
            loading ? "..." : containedIncidents
          }
          change="Backend Data"
          description="Successfully contained simulations"
          icon={ShieldCheck}
          color="green"
        />

        <StatCard
          title="Blocked Sources"
          value={
            loading ? "..." : blockedSources
          }
          change="Virtual Blocklist"
          description="Recorded blocked source entries"
          icon={Server}
          color="blue"
        />

      </section>

      {/* MAIN DASHBOARD PANELS */}

      <section className="dashboard-grid">

        {/* INCIDENT SEVERITY CHART */}

        <div className="dashboard-panel activity-panel">

          <div className="panel-heading">

            <div>
              <h2>Incident Severity Distribution</h2>

              <p>
                Severity breakdown from fetched backend incident records
              </p>
            </div>

            <span className="panel-icon">
              <Activity size={19} />
            </span>

          </div>

          <div className="activity-chart">

            {loading ? (
              <p>Loading incident statistics...</p>
            ) : incidents.length === 0 ? (
              <p>No incident data available yet.</p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={severityData}>

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
                    dataKey="severity"
                    stroke="#8494aa"
                    tick={{ fontSize: 11 }}
                  />

                  <YAxis
                    allowDecimals={false}
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
                    dataKey="count"
                    name="Incidents"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#activityGradient)"
                  />

                </AreaChart>
              </ResponsiveContainer>
            )}

          </div>

          <div className="chart-footer">

            <span>
              <span className="chart-dot"></span>
              Fetched incident records
            </span>

            <span>
              Showing: {incidents.length} / {totalIncidents}
            </span>

          </div>

        </div>

        {/* NETWORK COMPONENTS */}

        <div className="dashboard-panel system-panel">

          <div className="panel-heading">

            <div>
              <h2>Network Components</h2>
              <p>NetworkX simulation topology</p>
            </div>

            <span className="panel-icon">
              <Server size={19} />
            </span>

          </div>

          <div className="system-status-list">

            {NETWORK_NODES.map((node) => {
              const NodeIcon = node.icon;
              const nodeStatus = getNodeStatus(node.id);

              return (
                <div
                  className="system-status-item"
                  key={node.id}
                >

                  <div className="system-status-left">

                    <NodeIcon size={18} />

                    <div>
                      <strong>{node.name}</strong>
                      <span>{node.detail}</span>
                    </div>

                  </div>

                  <span
                    className={`status-pill ${
                      nodeStatus === "Isolated"
                        ? "monitoring"
                        : "operational"
                    }`}
                  >
                    {nodeStatus}
                  </span>

                </div>
              );
            })}

          </div>

          {/* CLICKABLE NETWORK TOPOLOGY NAVIGATION */}

          <button
            type="button"
            className="system-panel-footer"
            onClick={() => onNavigate("Network Monitor")}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              font: "inherit",
              textAlign: "left",
            }}
          >
            <span>View network topology</span>
            <ArrowUpRight size={16} />
          </button>

        </div>

      </section>

      {/* RECENT SECURITY EVENTS */}

      <section className="dashboard-panel incidents-panel">

        <div className="panel-heading">

          <div>
            <h2>Recent Security Events</h2>

            <p>
              Latest incidents retrieved from the GREYZONE backend
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

              {loading ? (
                <tr>
                  <td colSpan="6">
                    Loading incidents...
                  </td>
                </tr>
              ) : sortedIncidents.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    No incidents recorded yet.
                  </td>
                </tr>
              ) : (
                sortedIncidents.slice(0, 5).map((incident) => {

                  const severity = formatStatus(
                    incident.severity
                  );

                  const incidentStatus = getIncidentStatus(
                    incident.status
                  );

                  return (
                    <tr key={incident.id}>

                      <td className="incident-id">
                        {incident.id}
                      </td>

                      <td>
                        {formatStatus(incident.event_type)}
                      </td>

                      <td>
                        {formatTarget(incident.target)}
                      </td>

                      <td>
                        <span
                          className={`severity ${String(
                            incident.severity || ""
                          ).toLowerCase()}`}
                        >
                          {severity}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`incident-status ${String(
                            incident.status || ""
                          )
                            .toLowerCase()
                            .replaceAll("_", "-")}`}
                        >
                          {incidentStatus}
                        </span>
                      </td>

                      <td className="incident-time">
                        <Clock size={13} />
                        {formatDate(incident.created_at)}
                      </td>

                    </tr>
                  );
                })
              )}

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
          Dashboard metrics are retrieved from backend records.
          Network isolation is simulated using NetworkX.
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

  // ======================================
  // PAGE NAVIGATION
  // ======================================

  const renderPage = () => {

    switch (activePage) {

      case "Overview":
        return (
          <Overview onNavigate={setActivePage} />
        );

      case "Network Monitor":
        return <NetworkMonitor />;

      case "Threat Simulation":
        return <ThreatSimulation />;

      case "Defence Arena":
        return <DefenceArena />;

      case "Incident Reports":
        return <IncidentReports />;

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
        return (
          <Overview onNavigate={setActivePage} />
        );
    }
  };

  // ======================================
  // APPLICATION LAYOUT
  // ======================================

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
