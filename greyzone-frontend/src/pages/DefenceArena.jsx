
import { useState } from "react";

import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Server,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  Network,
  Zap,
  Bug,
  Scan,
  UserX,
  LoaderCircle,
} from "lucide-react";

import { api, THREAT_SCENARIOS } from "../api";

const iconMap = {
  activity: Activity,
  scan: Scan,
  "shield-alert": ShieldAlert,
  zap: Zap,
  "user-x": UserX,
  bug: Bug,
};

function DefenceArena() {
  const [selectedScenario, setSelectedScenario] = useState(
    THREAT_SCENARIOS[0]
  );

  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const runDefenceAnalysis = async () => {
    setIsRunning(true);
    setResult(null);
    setError("");

    try {
      const incident = await api.runScenario({
        scenario: selectedScenario.id,
        target: selectedScenario.target,
      });

      setResult(incident);
    } catch (err) {
      setError(err.message || "Defence analysis failed.");
    } finally {
      setIsRunning(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError("");
  };

  const containment = result?.containment;
  const network = result?.network_state;

  const verificationLabel =
    containment?.success === true
      ? "SUCCESSFUL"
      : containment?.success === false
        ? "FAILED"
        : "NOT REQUIRED";

  const formatStatus = (status) => {
    if (!status) return "UNKNOWN";
    return status.replaceAll("_", " ").toUpperCase();
  };

  return (
    <div className="defence-arena">
      {/* HEADER */}

      <div className="arena-header">
        <div>
          <p className="arena-eyebrow">GREYZONE / RESPONSE LAB</p>

          <h1>Defence Arena</h1>

          <p className="arena-subtitle">
            Analyse automated cyber defence responses using the
            GREYZONE Python NetworkX engine.
          </p>
        </div>

        <div className="arena-mode-badge">
          <span className="arena-live-dot"></span>
          DEFENCE ANALYSIS
        </div>
      </div>

      {/* SUMMARY */}

      <div className="simulation-stats">
        <div className="simulation-stat-card">
          <div className="simulation-stat-icon">
            <Activity size={22} />
          </div>

          <div>
            <p>Attack Scenarios</p>
            <h2>{THREAT_SCENARIOS.length}</h2>
          </div>
        </div>

        <div className="simulation-stat-card">
          <div className="simulation-stat-icon">
            <Network size={22} />
          </div>

          <div>
            <p>Defence Engine</p>
            <h2>NetworkX</h2>
          </div>
        </div>

        <div className="simulation-stat-card">
          <div className="simulation-stat-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <p>Analysis Status</p>
            <h2>{isRunning ? "Running" : "Ready"}</h2>
          </div>
        </div>
      </div>

      {/* SCENARIO SELECTION */}

      <section className="arena-section">
        <div className="arena-section-heading">
          <div>
            <h2>Select Threat Scenario</h2>
            <p>
              Choose an attack scenario supported by the backend.
            </p>
          </div>
        </div>

        <div className="arena-scenario-grid">
          {THREAT_SCENARIOS.map((scenario, index) => {
            const Icon = iconMap[scenario.icon] || Activity;

            return (
              <button
                key={scenario.id}
                className={`arena-scenario-card ${
                  selectedScenario.id === scenario.id ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setResult(null);
                  setError("");
                }}
                disabled={isRunning}
              >
                <div className="arena-card-top">
                  <span className="arena-card-label">
                    SCENARIO {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={`arena-severity ${scenario.severity.toLowerCase()}`}
                  >
                    {scenario.severity}
                  </span>
                </div>

                <div style={{ margin: "12px 0" }}>
                  <Icon size={24} />
                </div>

                <h3>{scenario.name}</h3>

                <p>{scenario.description}</p>

                <div className="arena-scenario-metrics">
                  <span>Target</span>
                  <strong>{scenario.target}</strong>
                </div>

                {selectedScenario.id === scenario.id && (
                  <div className="arena-selected-label">
                    ✓ SELECTED
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* SELECTED SCENARIO */}

      <section className="arena-selected-panel">
        <div>
          <span className="arena-panel-label">SELECTED SCENARIO</span>

          <h3>{selectedScenario.name}</h3>

          <p>
            Target: <strong>{selectedScenario.target}</strong>
          </p>

          <p>
            Scenario ID: <strong>{selectedScenario.id}</strong>
          </p>
        </div>

        <div className="arena-risk-box">
          <span>Execution Mode</span>
          <strong>Python Engine</strong>
        </div>
      </section>

      {/* DEFENCE CAPABILITIES */}

      <section className="arena-section">
        <div className="arena-section-heading">
          <div>
            <h2>Defence Capabilities</h2>
            <p>Operations performed by the existing backend.</p>
          </div>
        </div>

        <div className="arena-strategy-grid">
          <div className="arena-strategy-card">
            <div className="arena-strategy-icon isolation-icon">
              01
            </div>

            <h3>Network Isolation Simulation</h3>

            <p>
              The NetworkX engine simulates isolating the affected
              network component by removing its graph connections.
            </p>

            <div className="arena-strategy-tag">
              GRAPH-BASED ISOLATION
            </div>
          </div>

          <div className="arena-strategy-card">
            <div className="arena-strategy-icon selective-icon">
              02
            </div>

            <h3>Containment Verification</h3>

            <p>
              The engine checks whether the simulated attacker
              can still reach the affected target after isolation.
            </p>

            <div className="arena-strategy-tag">
              REACHABILITY VERIFICATION
            </div>
          </div>
        </div>
      </section>

      {/* ACTIONS */}

      <div className="arena-actions">
        <button
          className="arena-run-button"
          onClick={runDefenceAnalysis}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <LoaderCircle size={18} />
              Analysing Threat...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Defence Analysis
            </>
          )}
        </button>

        <button
          className="arena-reset-button"
          onClick={resetAnalysis}
          disabled={isRunning}
        >
          <RotateCcw size={17} />
          Reset
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="arena-disclaimer">
          <AlertTriangle size={18} />
          <div>
            <strong>Analysis Failed</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ACTUAL RESULTS */}

      {result && (
        <section className="arena-results">
          <div className="arena-section-heading">
            <div>
              <h2>Defence Analysis Results</h2>
              <p>Actual results returned by the GREYZONE backend.</p>
            </div>

            <span className="arena-completed-badge">
              <CheckCircle size={15} />
              RESPONSE RECEIVED
            </span>
          </div>

          {/* THREAT SUMMARY */}

          <div className="arena-result-grid">
            <div className="arena-result-card">
              <h3>Threat Score</h3>

              <div className="arena-result-metric">
                <span>Detection Score</span>
                <strong>{result.score}/100</strong>
              </div>

              <div className="arena-progress-track">
                <div
                  className="arena-progress-fill risk-fill"
                  style={{
                    width: `${result.score}%`,
                  }}
                />
              </div>

              <p className="arena-score-note">
                Severity: <strong>{result.severity?.toUpperCase()}</strong>
              </p>
            </div>

            <div className="arena-result-card">
              <h3>Containment Verification</h3>

              <div className="arena-result-metric">
                <span>Verification</span>
                <strong>{verificationLabel}</strong>
              </div>

              <div className="arena-progress-track">
                <div
                  className="arena-progress-fill disruption-fill"
                  style={{
                    width: containment?.success === true ? "100%" : "0%",
                  }}
                />
              </div>

              <p className="arena-score-note">
                Incident status: <strong>{formatStatus(result.status)}</strong>
              </p>
            </div>
          </div>

          {/* INCIDENT INFORMATION */}

          <div className="arena-recommendation-panel">
            <span className="arena-panel-label">
              DETECTION ANALYSIS
            </span>

            <h3>{result.event_type?.replaceAll("_", " ")}</h3>

            <p>{result.reason}</p>

            <p>
              <strong>Incident ID:</strong> {result.id}
            </p>

            <p>
              <strong>Source IP:</strong> {result.source_ip}
            </p>

            <p>
              <strong>Target:</strong> {result.target}
            </p>
          </div>

          {/* CONTAINMENT */}

          <div className="arena-chart-card">
            <div className="arena-chart-heading">
              <h3>
                <ShieldCheck size={19} />
                Python Containment Report
              </h3>
              <p>Network isolation and verification results.</p>
            </div>

            {containment ? (
              <div style={{ padding: "18px", color: "#e2e8f0" }}>
                <p>
                  Isolation required:{" "}
                  <strong>{containment.required ? "Yes" : "No"}</strong>
                </p>

                <p>
                  Isolation attempted:{" "}
                  <strong>{containment.attempted ? "Yes" : "No"}</strong>
                </p>

                <p>
                  Isolation verification: <strong>{verificationLabel}</strong>
                </p>

                <p>
                  Isolated node:{" "}
                  <strong>{containment.isolated_node || "None"}</strong>
                </p>

                <h4 style={{ marginTop: "20px" }}>Blocked Network Paths</h4>

                {containment.blocked_paths?.length ? (
                  containment.blocked_paths.map((path, index) => (
                    <p key={index}>
                      {path[0]} → {path[1]}
                    </p>
                  ))
                ) : (
                  <p>No blocked paths recorded.</p>
                )}
              </div>
            ) : (
              <p style={{ padding: "18px" }}>
                Containment information unavailable.
              </p>
            )}
          </div>

          {/* NETWORK STATE */}

          {network && (
            <div className="arena-chart-card">
              <div className="arena-chart-heading">
                <h3>
                  <Network size={19} />
                  Network Reachability Analysis
                </h3>
                <p>Network state returned by the Python engine.</p>
              </div>

              <div style={{ padding: "18px", color: "#e2e8f0" }}>
                <p>
                  <strong>Affected nodes:</strong>{" "}
                  {network.affected_nodes.join(", ") || "None"}
                </p>

                <p>
                  <strong>Reachable services:</strong>{" "}
                  {network.reachable_services.join(", ") || "None"}
                </p>

                <p>
                  <strong>Unreachable services:</strong>{" "}
                  {network.unreachable_services.join(", ") || "None"}
                </p>

                <p>
                  <strong>Attacker can reach target:</strong>{" "}
                  {network.attacker_can_reach_target === undefined
                    ? "Not reported"
                    : network.attacker_can_reach_target
                      ? "Yes"
                      : "No"}
                </p>

                <p>
                  <strong>Remaining risk:</strong>{" "}
                  {network.remaining_risk ? "Present" : "Not detected"}
                </p>
              </div>
            </div>
          )}

          {/* ACTIONS */}

          <div className="arena-chart-card">
            <div className="arena-chart-heading">
              <h3>
                <CheckCircle size={19} />
                Recorded Defence Actions
              </h3>
              <p>Actions persisted by the backend.</p>
            </div>

            <div style={{ padding: "18px", color: "#e2e8f0" }}>
              {result.actions?.length ? (
                result.actions.map((action) => (
                  <div key={action.id} style={{ marginBottom: "16px" }}>
                    <strong>{action.action_type}</strong>
                    <p>Status: {action.status}</p>
                    <p>{action.details}</p>
                  </div>
                ))
              ) : (
                <p>No defence actions recorded.</p>
              )}
            </div>
          </div>

          {/* ALERTS */}

          {result.alerts?.length > 0 && (
            <div className="arena-chart-card">
              <div className="arena-chart-heading">
                <h3>
                  <AlertTriangle size={19} />
                  Security Alerts
                </h3>
              </div>

              <div style={{ padding: "18px", color: "#e2e8f0" }}>
                {result.alerts.map((alert) => (
                  <p key={alert.id}>
                    {alert.message}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* DISCLAIMER */}

      <div className="arena-disclaimer">
        <AlertTriangle size={18} />

        <div>
          <strong>Controlled Simulation Environment</strong>
          <p>
            All results are returned by the GREYZONE backend.
            Network isolation and containment verification are
            graph simulations. No real network infrastructure
            or operating-system firewall is controlled.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DefenceArena;
