
import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Server,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle,
  Clock,
  Bug,
  Scan,
  Zap,
  UserX,
  LoaderCircle,
  Network,
  Target,
  Radio,
  Lock,
  ArrowRight,
  Terminal,
} from "lucide-react";

import { api, THREAT_SCENARIOS } from "../api";
import "./ThreatSimulation.css";

const iconMap = {
  activity: Activity,
  scan: Scan,
  "shield-alert": ShieldAlert,
  zap: Zap,
  "user-x": UserX,
  bug: Bug,
};

const targetNames = {
  "demo-login": "Demo Login",
  internet_gateway: "Internet Gateway",
  firewall: "Firewall",
  web_server: "Web Server",
  app_server: "Application Server",
  auth_server: "Authentication Server",
  database_server: "Database Server",
  monitoring_server: "Monitoring Server",
};

const formatTarget = (target) =>
  targetNames[target] || target || "Not specified";

const formatLabel = (value) =>
  String(value || "Unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTime = (value) => {
  if (!value) return "Unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : date.toLocaleString();
};

function ThreatSimulation() {
  const [selectedScenario, setSelectedScenario] = useState(
    THREAT_SCENARIOS[0]
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runSimulation = async () => {
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
      setError(err.message || "Unable to execute the simulation.");
    } finally {
      setIsRunning(false);
    }
  };

  const resetSimulation = () => {
    setResult(null);
    setError("");
  };

  const containment = result?.containment;
  const network = result?.network_state;

  const severity = formatLabel(result?.severity);

  const blockedPaths = Array.isArray(containment?.blocked_paths)
    ? containment.blocked_paths
    : [];

  const affectedNodes = Array.isArray(network?.affected_nodes)
    ? network.affected_nodes
    : [];

  const reachableServices = Array.isArray(network?.reachable_services)
    ? network.reachable_services
    : [];

  const unreachableServices = Array.isArray(network?.unreachable_services)
    ? network.unreachable_services
    : [];

  return (
    <div className="ts-page">

      {/* PAGE HEADER */}

      <header className="ts-header">
        <div>
          <div className="ts-eyebrow">
            <span className="ts-live-dot" />
            GREYZONE / THREAT LAB
          </div>

          <h1>Threat Simulation</h1>

          <p>
            Execute controlled cyber threat scenarios and analyse
            automated defence responses using the Python engine.
          </p>
        </div>

        <div className="ts-engine-badge">
          <Network size={19} />
          <div>
            <strong>PYTHON ENGINE</strong>
            <span>NetworkX Simulation</span>
          </div>
        </div>
      </header>

      {/* TOP METRICS */}

      <section className="ts-metrics">

        <div className="ts-metric">
          <div className="ts-metric-icon cyan">
            <Target size={21} />
          </div>
          <div>
            <span>Available Scenarios</span>
            <strong>
              {String(THREAT_SCENARIOS.length).padStart(2, "0")}
            </strong>
            <small>Supported threat types</small>
          </div>
        </div>

        <div className="ts-metric">
          <div className="ts-metric-icon blue">
            <Network size={21} />
          </div>
          <div>
            <span>Defence Engine</span>
            <strong>NetworkX</strong>
            <small>Python graph simulation</small>
          </div>
        </div>

        <div className="ts-metric">
          <div className="ts-metric-icon green">
            <Activity size={21} />
          </div>
          <div>
            <span>Execution Status</span>
            <strong>{isRunning ? "Running" : "Ready"}</strong>
            <small>
              {isRunning ? "Processing scenario" : "Awaiting execution"}
            </small>
          </div>
        </div>

        <div className="ts-metric">
          <div className="ts-metric-icon purple">
            <Radio size={21} />
          </div>
          <div>
            <span>Connection</span>
            <strong>Backend API</strong>
            <small>Scenario execution endpoint</small>
          </div>
        </div>

      </section>

      {/* SCENARIO SELECTOR */}

      <section className="ts-section">

        <div className="ts-section-heading">
          <div>
            <div className="ts-section-label">01 / SCENARIO SELECTION</div>
            <h2>Choose an Attack Scenario</h2>
            <p>
              Select a threat to execute through the GREYZONE defence engine.
            </p>
          </div>

          <span className="ts-count">
            {THREAT_SCENARIOS.length} SCENARIOS
          </span>
        </div>

        <div className="ts-scenario-grid">

          {THREAT_SCENARIOS.map((scenario, index) => {
            const ScenarioIcon = iconMap[scenario.icon] || Activity;
            const selected = selectedScenario.id === scenario.id;

            return (
              <button
                type="button"
                key={scenario.id}
                className={`ts-scenario-card ${selected ? "selected" : ""}`}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setResult(null);
                  setError("");
                }}
                disabled={isRunning}
              >
                <div className="ts-card-top">
                  <div className="ts-scenario-icon">
                    <ScenarioIcon size={23} />
                  </div>

                  <span
                    className={`ts-severity ${String(
                      scenario.severity
                    ).toLowerCase()}`}
                  >
                    {scenario.severity}
                  </span>
                </div>

                <div className="ts-scenario-number">
                  SCENARIO {String(index + 1).padStart(2, "0")}
                </div>

                <h3>{scenario.name}</h3>

                <p>{scenario.description}</p>

                <div className="ts-target">
                  <Server size={15} />
                  <span>Target</span>
                  <strong>{formatTarget(scenario.target)}</strong>
                </div>

                <div className="ts-card-footer">
                  {selected ? (
                    <>
                      <CheckCircle size={16} />
                      Selected Scenario
                    </>
                  ) : (
                    <>
                      Select Scenario
                      <ArrowRight size={15} />
                    </>
                  )}
                </div>
              </button>
            );
          })}

        </div>
      </section>

      {/* SELECTED SCENARIO */}

      <section className="ts-selected-panel">

        <div className="ts-selected-info">
          <div className="ts-section-label">02 / EXECUTION CONFIGURATION</div>

          <h2>{selectedScenario.name}</h2>

          <p>{selectedScenario.description}</p>

          <div className="ts-config-tags">
            <span>
              <Target size={14} />
              {selectedScenario.id}
            </span>

            <span>
              <Server size={14} />
              {formatTarget(selectedScenario.target)}
            </span>

            <span>
              <Radio size={14} />
              10.10.10.60
            </span>
          </div>
        </div>

        <div className="ts-selected-severity">
          <span>THREAT LEVEL</span>
          <strong className={String(selectedScenario.severity).toLowerCase()}>
            {selectedScenario.severity}
          </strong>
        </div>

      </section>

      {/* EXECUTION CONTROLS */}

      <section className="ts-controls">

        <div>
          <div className="ts-section-label">03 / ENGINE CONTROL</div>
          <h3>Execute Simulation</h3>
          <p>Submit the selected scenario to the backend.</p>
        </div>

        <div className="ts-control-buttons">

          <button
            type="button"
            className="ts-run-button"
            onClick={runSimulation}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <LoaderCircle size={19} className="ts-spinner" />
                Executing...
              </>
            ) : (
              <>
                <Play size={19} />
                Run Threat Simulation
              </>
            )}
          </button>

          <button
            type="button"
            className="ts-reset-button"
            onClick={resetSimulation}
            disabled={isRunning}
          >
            <RotateCcw size={17} />
            Reset Results
          </button>

        </div>
      </section>

      {/* EXECUTION ERROR */}

      {error && (
        <div className="ts-error">
          <AlertTriangle size={21} />
          <div>
            <strong>Simulation Failed</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* LOADING STATE */}

      {isRunning && (
        <div className="ts-loading">
          <LoaderCircle size={27} className="ts-spinner" />
          <div>
            <strong>Executing Defence Engine</strong>
            <p>
              Processing scenario and awaiting the backend response...
            </p>
          </div>
        </div>
      )}

      {/* RESULTS */}

      {result && (
        <section className="ts-results">

          <div className="ts-section-heading">
            <div>
              <div className="ts-section-label">04 / BACKEND RESPONSE</div>
              <h2>Simulation Results</h2>
              <p>
                Actual incident data returned by the GREYZONE backend.
              </p>
            </div>

            <span className="ts-response-badge">
              <CheckCircle size={16} />
              RESPONSE RECEIVED
            </span>
          </div>

          {/* RESULT SUMMARY */}

          <div className="ts-result-grid">

            <div className="ts-result-card">
              <div className="ts-result-card-top">
                <span>THREAT SCORE</span>
                <ShieldAlert size={21} />
              </div>

              <strong className="ts-score">
                {result.score ?? "—"}
                <small>/100</small>
              </strong>

              <div className="ts-score-track">
                <div
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(Number(result.score) || 0, 100)
                    )}%`,
                  }}
                />
              </div>

              <p>
                Severity: <b>{severity}</b>
              </p>
            </div>

            <div className="ts-result-card">
              <div className="ts-result-card-top">
                <span>INCIDENT STATUS</span>
                <ShieldCheck size={21} />
              </div>

              <strong className="ts-status-value">
                {formatLabel(result.status)}
              </strong>

              <p>Recorded backend incident status</p>
            </div>

            <div className="ts-result-card">
              <div className="ts-result-card-top">
                <span>CONTAINMENT</span>
                <Lock size={21} />
              </div>

              <strong className="ts-status-value">
                {containment?.success === true
                  ? "Successful"
                  : containment?.success === false
                    ? "Failed"
                    : "Not Required"}
              </strong>

              <p>Python graph simulation result</p>
            </div>

          </div>

          {/* DETECTION INFORMATION */}

          <div className="ts-detail-grid">

            <article className="ts-detail-card">
              <div className="ts-detail-heading">
                <Activity size={19} />
                <h3>Threat Detection</h3>
              </div>

              <p className="ts-reason">{result.reason || "No reason provided."}</p>

              <div className="ts-data-list">
                <div>
                  <span>Incident ID</span>
                  <strong>{result.id || "Unavailable"}</strong>
                </div>

                <div>
                  <span>Event Type</span>
                  <strong>{formatLabel(result.event_type)}</strong>
                </div>

                <div>
                  <span>Source IP</span>
                  <strong>{result.source_ip || "Unavailable"}</strong>
                </div>

                <div>
                  <span>Target</span>
                  <strong>{formatTarget(result.target)}</strong>
                </div>

                <div>
                  <span>Timestamp</span>
                  <strong>{formatTime(result.created_at)}</strong>
                </div>
              </div>
            </article>

            <article className="ts-detail-card">
              <div className="ts-detail-heading">
                <ShieldCheck size={19} />
                <h3>Containment Analysis</h3>
              </div>

              {containment ? (
                <div className="ts-data-list">
                  <div>
                    <span>Isolation Required</span>
                    <strong>{containment.required ? "Yes" : "No"}</strong>
                  </div>

                  <div>
                    <span>Isolation Attempted</span>
                    <strong>{containment.attempted ? "Yes" : "No"}</strong>
                  </div>

                  <div>
                    <span>Verification</span>
                    <strong>
                      {containment.success === true
                        ? "Successful"
                        : containment.success === false
                          ? "Failed"
                          : "Not Required"}
                    </strong>
                  </div>

                  <div>
                    <span>Isolated Node</span>
                    <strong>{containment.isolated_node || "None"}</strong>
                  </div>
                </div>
              ) : (
                <p>Containment information unavailable.</p>
              )}
            </article>

          </div>

          {/* BLOCKED PATHS */}

          {containment && (
            <article className="ts-detail-card ts-full-card">
              <div className="ts-detail-heading">
                <Network size={19} />
                <h3>Blocked Network Paths</h3>
                <span className="ts-inline-count">
                  {blockedPaths.length} PATHS
                </span>
              </div>

              {blockedPaths.length > 0 ? (
                <div className="ts-path-grid">
                  {blockedPaths.map((path, index) => (
                    <div className="ts-path-item" key={index}>
                      <span>{path[0]}</span>
                      <ArrowRight size={17} />
                      <span>{path[1]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No blocked paths recorded.</p>
              )}
            </article>
          )}

          {/* NETWORK VERIFICATION */}

          {network && (
            <article className="ts-detail-card ts-full-card">
              <div className="ts-detail-heading">
                <Network size={19} />
                <h3>Network Reachability Analysis</h3>
              </div>

              <div className="ts-network-grid">
                <div>
                  <span>Affected Nodes</span>
                  <strong>{affectedNodes.map(formatTarget).join(", ") || "None"}</strong>
                </div>

                <div>
                  <span>Reachable Services</span>
                  <strong>{reachableServices.map(formatTarget).join(", ") || "None"}</strong>
                </div>

                <div>
                  <span>Unreachable Services</span>
                  <strong>{unreachableServices.map(formatTarget).join(", ") || "None"}</strong>
                </div>

                <div>
                  <span>Attacker Can Reach Target</span>
                  <strong>
                    {network.attacker_can_reach_target === undefined
                      ? "Not Reported"
                      : network.attacker_can_reach_target
                        ? "Yes"
                        : "No"}
                  </strong>
                </div>

                <div>
                  <span>Remaining Risk</span>
                  <strong>
                    {network.remaining_risk === undefined
                      ? "Not Reported"
                      : typeof network.remaining_risk === "boolean"
                        ? network.remaining_risk
                          ? "Present"
                          : "Not Detected"
                        : String(network.remaining_risk)}
                  </strong>
                </div>
              </div>
            </article>
          )}

          {/* DEFENCE ACTIONS */}

          {result.actions?.length > 0 && (
            <article className="ts-detail-card ts-full-card">
              <div className="ts-detail-heading">
                <CheckCircle size={19} />
                <h3>Recorded Defence Actions</h3>
              </div>

              <div className="ts-action-list">
                {result.actions.map((action, index) => (
                  <div className="ts-action-item" key={action.id || index}>
                    <CheckCircle size={17} />
                    <div>
                      <strong>{formatLabel(action.action_type)}</strong>
                      <p>{action.details || action.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* ALERTS */}

          {result.alerts?.length > 0 && (
            <article className="ts-detail-card ts-full-card">
              <div className="ts-detail-heading">
                <AlertTriangle size={19} />
                <h3>Security Alerts</h3>
              </div>

              {result.alerts.map((alert, index) => (
                <div className="ts-alert-item" key={alert.id || index}>
                  <AlertTriangle size={17} />
                  <span>{alert.message}</span>
                </div>
              ))}
            </article>
          )}

        </section>
      )}

      {/* DISCLAIMER */}

      <footer className="ts-disclaimer">
        <div className="ts-disclaimer-icon">
          <Terminal size={20} />
        </div>

        <div>
          <strong>Controlled Simulation Environment</strong>
          <p>
            Detection, network isolation and containment verification
            are performed through the GREYZONE Python simulation engine.
            Blocklist operations are virtual. No real network
            infrastructure or operating-system firewall is controlled.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default ThreatSimulation;
