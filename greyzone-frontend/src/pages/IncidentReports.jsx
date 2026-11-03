import { useState } from "react";
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  X,
  Activity,
} from "lucide-react";

const incidents = [
  {
    id: "INC-001",
    title: "Unusual Network Activity",
    target: "Bunker 01",
    severity: "High",
    status: "Contained",
    time: "10:42 AM",
    date: "03 Nov 2026",
    risk: 78,
    description:
      "A fictional unusual activity event was detected in Bunker 01.",
    response:
      "Simulated selective restrictions were applied and containment was verified.",
  },
  {
    id: "INC-002",
    title: "Suspicious Access Pattern",
    target: "Core Gateway",
    severity: "Medium",
    status: "Monitoring",
    time: "09:18 AM",
    date: "03 Nov 2026",
    risk: 52,
    description:
      "A simulated access pattern was flagged for further review.",
    response:
      "The component remains under simulated monitoring.",
  },
  {
    id: "INC-003",
    title: "Unknown Device Detected",
    target: "Bunker 03",
    severity: "Low",
    status: "Resolved",
    time: "08:35 AM",
    date: "03 Nov 2026",
    risk: 30,
    description:
      "A fictional unfamiliar device event appeared in the simulation.",
    response:
      "The simulated event was reviewed and marked as resolved.",
  },
  {
    id: "INC-004",
    title: "Network Traffic Anomaly",
    target: "Data Centre",
    severity: "Medium",
    status: "Contained",
    time: "Yesterday",
    date: "02 Nov 2026",
    risk: 48,
    description:
      "An illustrative traffic anomaly was generated for demonstration.",
    response:
      "A simulated containment response was recorded.",
  },
];

function IncidentReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedIncident, setSelectedIncident] = useState(null);

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "All" || incident.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="incident-page">

      {/* HEADER */}
      <div className="incident-header">
        <div>
          <span className="incident-eyebrow">
            GREYZONE / SECURITY OPERATIONS
          </span>

          <h1>Incident Reports</h1>

          <p>
            Review simulated security events and response history.
          </p>
        </div>

        <div className="incident-mode">
          <span></span>
          SIMULATION RECORDS
        </div>
      </div>

      {/* STATISTICS */}
      <div className="incident-stats">

        <div className="incident-stat-card">
          <div className="incident-stat-icon blue">
            <FileText size={21} />
          </div>
          <span>Total Incidents</span>
          <h2>04</h2>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon red">
            <ShieldAlert size={21} />
          </div>
          <span>High Severity</span>
          <h2>01</h2>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon green">
            <ShieldCheck size={21} />
          </div>
          <span>Contained / Resolved</span>
          <h2>03</h2>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon orange">
            <Clock size={21} />
          </div>
          <span>Under Monitoring</span>
          <h2>01</h2>
        </div>

      </div>

      {/* INCIDENT TABLE */}
      <section className="incident-table-section">

        <div className="incident-table-heading">
          <div>
            <h2>Incident History</h2>
            <p>Fictional security events generated for demonstration.</p>
          </div>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="incident-controls">

          <div className="incident-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Contained">Contained</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Resolved">Resolved</option>
          </select>

        </div>

        {/* TABLE */}
        <div className="incident-table-wrapper">
          <table className="incident-table">

            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Incident</th>
                <th>Target</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredIncidents.map((incident) => (
                <tr key={incident.id}>

                  <td className="incident-id">
                    {incident.id}
                  </td>

                  <td>{incident.title}</td>

                  <td>{incident.target}</td>

                  <td>
                    <span
                      className={`incident-severity ${incident.severity.toLowerCase()}`}
                    >
                      {incident.severity}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`incident-status ${incident.status.toLowerCase()}`}
                    >
                      {incident.status}
                    </span>
                  </td>

                  <td>
                    <div>{incident.time}</div>
                    <small>{incident.date}</small>
                  </td>

                  <td>
                    <button
                      className="incident-view-button"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      View Details
                    </button>
                  </td>

                </tr>
              ))}

              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan="7" className="incident-empty">
                    No matching incidents found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>

      </section>

      {/* INCIDENT DETAILS MODAL */}
      {selectedIncident && (
        <div
          className="incident-modal-overlay"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="incident-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="incident-modal-header">
              <div>
                <span>INCIDENT DETAILS</span>
                <h2>{selectedIncident.id}</h2>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="incident-close-button"
              >
                <X size={20} />
              </button>
            </div>

            <h3>{selectedIncident.title}</h3>

            <div className="incident-detail-grid">

              <div>
                <span>Target Component</span>
                <strong>{selectedIncident.target}</strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>{selectedIncident.severity}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedIncident.status}</strong>
              </div>

              <div>
                <span>Risk Score</span>
                <strong>{selectedIncident.risk}/100</strong>
              </div>

              <div>
                <span>Detection Time</span>
                <strong>{selectedIncident.time}</strong>
              </div>

              <div>
                <span>Detection Date</span>
                <strong>{selectedIncident.date}</strong>
              </div>

            </div>

            <div className="incident-detail-description">
              <h4>
                <Activity size={16} /> Event Description
              </h4>
              <p>{selectedIncident.description}</p>
            </div>

            <div className="incident-detail-description">
              <h4>
                <ShieldCheck size={16} /> Response Summary
              </h4>
              <p>{selectedIncident.response}</p>
            </div>

            <button
              className="incident-modal-done"
              onClick={() => setSelectedIncident(null)}
            >
              Close Report
            </button>

          </div>
        </div>
      )}

      {/* DISCLAIMER */}
      <div className="incident-disclaimer">
        <strong>Demo Environment</strong>
        <p>
          These incident records are fictional and intended for
          controlled demonstration. They do not represent real
          network telemetry or actual security events.
        </p>
      </div>

    </div>
  );
}

export default IncidentReports;