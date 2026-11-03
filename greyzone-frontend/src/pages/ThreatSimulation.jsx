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
  Lock,
  Zap,
} from "lucide-react";

const scenarios = [
  {
    id: 1,
    name: "Unusual Network Activity",
    description:
      "Simulates unusual activity detected in a fictional network component.",
    severity: "High",
    target: "Bunker 01",
    risk: 78,
    disruption: 25,
    icon: Activity,
  },
  {
    id: 2,
    name: "Suspicious Access Pattern",
    description:
      "Simulates an unexpected access pattern involving the core gateway.",
    severity: "Medium",
    target: "Core Gateway",
    risk: 52,
    disruption: 15,
    icon: ShieldAlert,
  },
  {
    id: 3,
    name: "Unknown Device Detected",
    description:
      "Simulates an unidentified device appearing in the fictional network.",
    severity: "Low",
    target: "Bunker 03",
    risk: 30,
    disruption: 8,
    icon: Server,
  },
];

function ThreatSimulation() {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);
  const [strategy, setStrategy] = useState("selective");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runSimulation = () => {
    setIsRunning(true);
    setResult(null);

    setTimeout(() => {
      let residualRisk;
      let disruption;

      if (strategy === "full") {
        residualRisk = Math.max(5, selectedScenario.risk - 45);
        disruption = 75;
      } else {
        residualRisk = Math.max(10, selectedScenario.risk - 25);
        disruption = selectedScenario.disruption;
      }

      setResult({
        residualRisk,
        disruption,
        strategy:
          strategy === "full"
            ? "Full Isolation"
            : "Selective Restrictions",
      });

      setIsRunning(false);
    }, 1500);
  };

  const resetSimulation = () => {
    setResult(null);
    setIsRunning(false);
    setStrategy("selective");
  };

  return (
    <div className="simulation-page">
      <div className="page-heading">
        <div>
          <h1>Threat Simulation</h1>
          <p>
            Run controlled scenarios and evaluate defensive response
            strategies.
          </p>
        </div>

        <div className="simulation-status">
          <span className="status-dot"></span>
          SIMULATION MODE
        </div>
      </div>

      {/* Summary cards */}

      <div className="simulation-stats">
        <div className="simulation-stat-card">
          <div className="simulation-stat-icon">
            <Activity size={22} />
          </div>
          <div>
            <p>Available Scenarios</p>
            <h2>03</h2>
          </div>
        </div>

        <div className="simulation-stat-card">
          <div className="simulation-stat-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p>Response Strategies</p>
            <h2>02</h2>
          </div>
        </div>

        <div className="simulation-stat-card">
          <div className="simulation-stat-icon">
            <Clock size={22} />
          </div>
          <div>
            <p>Simulation Status</p>
            <h2>{isRunning ? "Running" : "Ready"}</h2>
          </div>
        </div>
      </div>

      {/* Scenario selection */}

      <section className="simulation-section">
        <div className="section-heading">
          <div>
            <h2>Select a Scenario</h2>
            <p>Choose a predefined fictional threat event.</p>
          </div>
        </div>

        <div className="scenario-grid">
          {scenarios.map((scenario) => {
            const ScenarioIcon = scenario.icon;

            return (
              <button
                key={scenario.id}
                className={`scenario-card ${
                  selectedScenario.id === scenario.id ? "selected" : ""
                }`}
                onClick={() => {
                  setSelectedScenario(scenario);
                  setResult(null);
                }}
                disabled={isRunning}
              >
                <div className="scenario-card-top">
                  <div className="scenario-icon">
                    <ScenarioIcon size={23} />
                  </div>

                  <span
                    className={`severity-badge ${scenario.severity.toLowerCase()}`}
                  >
                    {scenario.severity}
                  </span>
                </div>

                <h3>{scenario.name}</h3>
                <p>{scenario.description}</p>

                <div className="scenario-target">
                  <Server size={15} />
                  Target: {scenario.target}
                </div>

                <div className="scenario-select">
                  {selectedScenario.id === scenario.id ? (
                    <>
                      <CheckCircle size={16} />
                      Selected
                    </>
                  ) : (
                    "Select Scenario"
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Response strategy */}

      <section className="simulation-section">
        <div className="section-heading">
          <div>
            <h2>Choose Defence Strategy</h2>
            <p>Compare two simulated containment approaches.</p>
          </div>
        </div>

        <div className="strategy-grid">
          <button
            className={`strategy-card ${
              strategy === "full" ? "active" : ""
            }`}
            onClick={() => {
              setStrategy("full");
              setResult(null);
            }}
            disabled={isRunning}
          >
            <div className="strategy-icon">
              <Lock size={23} />
            </div>

            <h3>Full Isolation</h3>

            <p>
              Simulates completely isolating the selected component.
              This model assumes greater service disruption.
            </p>

            <span className="strategy-label">Higher disruption</span>
          </button>

          <button
            className={`strategy-card ${
              strategy === "selective" ? "active" : ""
            }`}
            onClick={() => {
              setStrategy("selective");
              setResult(null);
            }}
            disabled={isRunning}
          >
            <div className="strategy-icon">
              <ShieldCheck size={23} />
            </div>

            <h3>Selective Restrictions</h3>

            <p>
              Simulates restricting selected connections while
              maintaining essential fictional services.
            </p>

            <span className="strategy-label">Service continuity focus</span>
          </button>
        </div>
      </section>

      {/* Simulation controls */}

      <div className="simulation-controls">
        <button
          className="run-simulation-btn"
          onClick={runSimulation}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className="simulation-spinner"></span>
              Running Simulation...
            </>
          ) : (
            <>
              <Play size={18} />
              Run Simulation
            </>
          )}
        </button>

        <button
          className="reset-simulation-btn"
          onClick={resetSimulation}
          disabled={isRunning}
        >
          <RotateCcw size={17} />
          Reset
        </button>
      </div>

      {/* Results */}

      {result && (
        <section className="simulation-results">
          <div className="section-heading">
            <div>
              <h2>Simulation Results</h2>
              <p>Illustrative outcome for the selected scenario.</p>
            </div>

            <span className="result-success">
              <CheckCircle size={16} />
              Completed
            </span>
          </div>

          <div className="result-summary">
            <div className="result-card">
              <div className="result-icon risk-icon">
                <ShieldAlert size={22} />
              </div>
              <p>Residual Risk Index</p>
              <h2>{result.residualRisk}/100</h2>
              <span>Illustrative risk score</span>
            </div>

            <div className="result-card">
              <div className="result-icon disruption-icon">
                <Zap size={22} />
              </div>
              <p>Disruption Index</p>
              <h2>{result.disruption}/100</h2>
              <span>Illustrative service impact</span>
            </div>
          </div>

          <div className="result-details">
            <h3>
              <ShieldCheck size={19} />
              Assessment Summary
            </h3>

            <p>
              The <strong>{result.strategy}</strong> strategy was
              evaluated for the <strong>{selectedScenario.name}</strong>{" "}
              scenario affecting <strong>{selectedScenario.target}</strong>.
            </p>

            <p>
              The simulated residual risk is{" "}
              <strong>{result.residualRisk}/100</strong>, while the
              simulated disruption index is{" "}
              <strong>{result.disruption}/100</strong>.
            </p>

            <div className="assessment-note">
              <AlertTriangle size={18} />
              These values are produced using illustrative formulas.
              They are not validated cybersecurity measurements.
            </div>
          </div>
        </section>
      )}

      {/* Disclaimer */}

      <div className="simulation-disclaimer">
        <AlertTriangle size={18} />

        <div>
          <strong>Controlled Simulation Environment</strong>
          <p>
            All scenarios, events, scores and outcomes are fictional
            demonstration data. This module does not connect to or
            control real network infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ThreatSimulation;