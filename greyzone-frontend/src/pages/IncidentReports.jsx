
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  X,
  Activity,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { api } from "../api";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status) {
  const labels = {
    contained: "Contained",
    failed: "Failed",
    safe: "Safe",
    processing: "Processing",
  };

  return labels[status] || status || "Unknown";
}

// Normalize the backend status response.
// Supports direct fetch JSON and Axios-style responses.
function normalizeStats(response) {
  const payload = response?.data ?? response ?? {};

  // Some APIs may place aggregate values inside "statistics".
  // Root-level values take precedence when available.
  return {
    ...(payload.statistics || {}),
    ...payload,
  };
}

function IncidentReports() {
  const [incidents, setIncidents] = useState([]);
  const [backendStats, setBackendStats] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");

  const [selectedIncident, setSelectedIncident] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch incident records and global backend statistics.
  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [incidentsResult, statusResult] =
        await Promise.allSettled([
          api.getIncidents(),
          api.getStatus(),
        ]);

      // Fetch incident history.
      if (incidentsResult.status === "fulfilled") {
        const data = incidentsResult.value;

        setIncidents(Array.isArray(data) ? data : []);
      } else {
        throw incidentsResult.reason;
      }

      // Fetch global statistics.
      if (statusResult.status === "fulfilled") {
        const stats = normalizeStats(statusResult.value);

        setBackendStats(stats);

        console.log("GREYZONE backend statistics:", stats);
      } else {
        console.error(
          "Unable to load backend statistics:",
          statusResult.reason
        );
      }
    } catch (err) {
      setError(
        err.message || "Unable to load incident reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data loading.
  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Refresh when returning to the browser tab.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadIncidents();
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
  }, [loadIncidents]);

  // Fetch complete details for an individual incident.
  const openIncident = async (id) => {
    setDetailLoading(true);
    setSelectedIncident(null);

    try {
      const incident = await api.getIncident(id);
      setSelectedIncident(incident);
    } catch (err) {
      setError(
        err.message || "Unable to load incident details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // Search and filter incident records.
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch = [
        incident.id,
        incident.event_type,
        incident.target,
        incident.source_ip,
      ].some((value) =>
        String(value || "").toLowerCase().includes(search)
      );

      const matchesFilter =
        filter === "All" || incident.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [incidents, searchTerm, filter]);

  // Global statistics from the backend.
  // Fall back to fetched incident records if a field is unavailable.
  const total =
    backendStats?.totalIncidents ??
    incidents.length;

  const contained =
    backendStats?.containedIncidents ??
    incidents.filter(
      (incident) => incident.status === "contained"
    ).length;

  const failed =
    backendStats?.failedIncidents ??
    incidents.filter(
      (incident) => incident.status === "failed"
    ).length;

  const processing = incidents.filter(
    (incident) => incident.status === "processing"
  ).length;

  return (
    <div className="incident-page">

      {/* PAGE HEADER */}
      <div className="incident-header">
        <div>
          <span className="incident-eyebrow">
            GREYZONE / SECURITY OPERATIONS
          </span>

          <h1>Incident Reports</h1>

          <p>
            Review real incident records generated by the GREYZONE backend.
          </p>
        </div>

        <button
          className="incident-view-button"
          onClick={loadIncidents}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh Reports"}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="simulation-note">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="incident-stats">

        <div className="incident-stat-card">
          <div className="incident-stat-icon blue">
            <FileText size={21} />
          </div>

          <span>Total Incidents</span>
          <h2>{total}</h2>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon green">
            <ShieldCheck size={21} />
          </div>

          <span>Contained</span>
          <h2>{contained}</h2>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon red">
            <ShieldAlert size={21} />
          </div>

          <span>Failed</span>
          <h2>{failed}</h2>
        </div>

        <div className="incident-stat-card">
          <div className="incident-stat-icon orange">
            <Clock size={21} />
          </div>

          <span>Processing</span>
          <h2>{processing}</h2>
        </div>

      </div>

      {/* INCIDENT HISTORY */}
      <section className="incident-table-section">

        <div className="incident-table-heading">
          <div>
            <h2>Incident History</h2>
            <p>Records retrieved directly from MongoDB.</p>
          </div>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="incident-controls">

          <div className="incident-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by ID, event, target or source IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="contained">Contained</option>
            <option value="failed">Failed</option>
            <option value="safe">Safe</option>
            <option value="processing">Processing</option>
          </select>

        </div>

        {/* INCIDENT TABLE */}
        <div className="incident-table-wrapper">

          <table className="incident-table">

            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Event</th>
                <th>Target</th>
                <th>Score</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="8" className="incident-empty">
                    Loading incident records...
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="incident-empty">
                    No matching incidents found.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id}>

                    <td className="incident-id">
                      {incident.id?.slice(0, 8) || "—"}
                    </td>

                    <td>
                      {incident.event_type?.replaceAll("_", " ") || "—"}
                    </td>

                    <td>{incident.target || "—"}</td>

                    <td>
                      <strong>
                        {incident.score ?? "—"}/100
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`incident-severity ${incident.severity || ""}`}
                      >
                        {incident.severity?.toUpperCase() || "—"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`incident-status ${incident.status || ""}`}
                      >
                        {formatStatus(incident.status)}
                      </span>
                    </td>

                    <td>
                      <div>{formatDate(incident.created_at)}</div>
                    </td>

                    <td>
                      <button
                        className="incident-view-button"
                        onClick={() => openIncident(incident.id)}
                      >
                        View Details
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </section>

      {/* INCIDENT DETAIL LOADING */}
      {detailLoading && (
        <div className="simulation-note">
          Loading complete incident details...
        </div>
      )}

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

            {/* MODAL HEADER */}
            <div className="incident-modal-header">

              <div>
                <span>BACKEND INCIDENT DETAILS</span>
                <h2>{selectedIncident.id}</h2>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="incident-close-button"
              >
                <X size={20} />
              </button>

            </div>

            <h3>
              {selectedIncident.event_type?.replaceAll("_", " ")}
            </h3>

            {/* INCIDENT INFORMATION */}
            <div className="incident-detail-grid">

              <div>
                <span>Target Component</span>
                <strong>{selectedIncident.target || "—"}</strong>
              </div>

              <div>
                <span>Source IP</span>
                <strong>{selectedIncident.source_ip || "—"}</strong>
              </div>

              <div>
                <span>Threat Score</span>
                <strong>
                  {selectedIncident.score ?? "—"}/100
                </strong>
              </div>

              <div>
                <span>Severity</span>
                <strong>
                  {selectedIncident.severity?.toUpperCase() || "—"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {formatStatus(selectedIncident.status)}
                </strong>
              </div>

              <div>
                <span>Detected</span>
                <strong>
                  {formatDate(selectedIncident.created_at)}
                </strong>
              </div>

            </div>

            {/* DETECTION ANALYSIS */}
            <div className="incident-detail-description">

              <h4>
                <Activity size={16} /> Detection Analysis
              </h4>

              <p>
                {selectedIncident.reason || "No detection analysis recorded."}
              </p>

            </div>

            {/* PYTHON CONTAINMENT ANALYSIS */}
            {selectedIncident.containment && (
              <div className="incident-detail-description">

                <h4>
                  <ShieldCheck size={16} /> Python Containment Analysis
                </h4>

                <p>
                  Isolation required:{" "}
                  <strong>
                    {selectedIncident.containment.required ? "Yes" : "No"}
                  </strong>
                </p>

                <p>
                  Isolation attempted:{" "}
                  <strong>
                    {selectedIncident.containment.attempted ? "Yes" : "No"}
                  </strong>
                </p>

                <p>
                  Verification:{" "}
                  <strong>
                    {selectedIncident.containment.success === null ||
                    selectedIncident.containment.success === undefined
                      ? "Not applicable"
                      : selectedIncident.containment.success
                        ? "Successful"
                        : "Failed"}
                  </strong>
                </p>

                <p>
                  Isolated node:{" "}
                  <strong>
                    {selectedIncident.containment.isolated_node || "None"}
                  </strong>
                </p>

                <p>
                  <strong>Blocked paths:</strong>
                </p>

                {selectedIncident.containment.blocked_paths?.length ? (
                  selectedIncident.containment.blocked_paths.map(
                    (path, index) => (
                      <p key={index}>
                        {Array.isArray(path)
                          ? `${path[0]} → ${path[1]}`
                          : String(path)}
                      </p>
                    )
                  )
                ) : (
                  <p>No blocked paths recorded.</p>
                )}

              </div>
            )}

            {/* NETWORK STATE VERIFICATION */}
            {selectedIncident.network_state && (
              <div className="incident-detail-description">

                <h4>
                  <Activity size={16} /> Network State Verification
                </h4>

                <p>
                  Affected nodes:{" "}
                  <strong>
                    {selectedIncident.network_state.affected_nodes?.join(", ") || "None"}
                  </strong>
                </p>

                <p>
                  Reachable services:{" "}
                  <strong>
                    {selectedIncident.network_state.reachable_services?.join(", ") || "None"}
                  </strong>
                </p>

                <p>
                  Unreachable services:{" "}
                  <strong>
                    {selectedIncident.network_state.unreachable_services?.join(", ") || "None"}
                  </strong>
                </p>

                <p>
                  Attacker can reach target:{" "}
                  <strong>
                    {selectedIncident.network_state.attacker_can_reach_target === undefined
                      ? "Not available"
                      : selectedIncident.network_state.attacker_can_reach_target
                        ? "Yes"
                        : "No"}
                  </strong>
                </p>

              </div>
            )}

            {/* RECORDED DEFENCE ACTIONS */}
            <div className="incident-detail-description">

              <h4>
                <ShieldCheck size={16} /> Recorded Defence Actions
              </h4>

              {selectedIncident.actions?.length ? (
                selectedIncident.actions.map((action) => (
                  <p key={action.id}>
                    <strong>{action.action_type}</strong>
                    {" — "}
                    {action.status}

                    <br />

                    {action.details}
                  </p>
                ))
              ) : (
                <p>No defence actions recorded.</p>
              )}

            </div>

            {/* SECURITY ALERTS */}
            <div className="incident-detail-description">

              <h4>
                <AlertTriangle size={16} /> Security Alerts
              </h4>

              {selectedIncident.alerts?.length ? (
                selectedIncident.alerts.map((alert) => (
                  <p key={alert.id}>
                    {alert.message}

                    <br />

                    Status:{" "}
                    {alert.acknowledged
                      ? "Acknowledged"
                      : "Unacknowledged"}
                  </p>
                ))
              ) : (
                <p>No security alerts recorded.</p>
              )}

            </div>

            {/* CLOSE MODAL */}
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

        <strong>Simulation Environment</strong>

        <p>
          These records are retrieved from the GREYZONE backend.
          Detection and containment results represent simulated network
          analysis, not real-world network activity.
        </p>

      </div>

    </div>
  );
}

export default IncidentReports;
