import { useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const scenarios = [
  {
    id: 1,
    name: "Unusual Network Activity",
    target: "Bunker 01",
    risk: 78,
    disruption: 25,
    severity: "High",
    description:
      "Unusual activity detected in a simulated network component.",
  },
  {
    id: 2,
    name: "Suspicious Access Pattern",
    target: "Core Gateway",
    risk: 52,
    disruption: 15,
    severity: "Medium",
    description:
      "An unusual access pattern has been identified in the simulation.",
  },
  {
    id: 3,
    name: "Unknown Device Detected",
    target: "Bunker 03",
    risk: 30,
    disruption: 8,
    severity: "Low",
    description:
      "An unfamiliar device has appeared in the fictional network.",
  },
];

function DefenceArena() {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runComparison = () => {
    setIsRunning(true);
    setResults(null);

    setTimeout(() => {
      const fullIsolation = {
        strategy: "Full Isolation",
        residualRisk: Math.max(5, selectedScenario.risk - 45),
        disruption: 75,
      };

      const selectiveRestrictions = {
        strategy: "Selective Restrictions",
        residualRisk: Math.max(10, selectedScenario.risk - 25),
        disruption: selectedScenario.disruption,
      };

      setResults([fullIsolation, selectiveRestrictions]);
      setIsRunning(false);
    }, 1200);
  };

  const resetSimulation = () => {
    setResults(null);
    setIsRunning(false);
    setSelectedScenario(scenarios[0]);
  };

  const recommendedStrategy = results
    ? results.reduce((best, current) => {
        const bestScore = best.residualRisk + best.disruption;
        const currentScore = current.residualRisk + current.disruption;

        return currentScore < bestScore ? current : best;
      })
    : null;

  const chartData = results
    ? results.map((item) => ({
        name: item.strategy,
        "Residual Risk": item.residualRisk,
        "Service Disruption": item.disruption,
      }))
    : [];

  return (
    <div className="defence-arena">
      {/* HEADER */}
      <div className="arena-header">
        <div>
          <p className="arena-eyebrow">GREYZONE / RESPONSE LAB</p>
          <h1>Defence Arena</h1>
          <p className="arena-subtitle">
            Compare defensive strategies in a controlled simulation.
          </p>
        </div>

        <div className="arena-mode-badge">
          <span className="arena-live-dot"></span>
          SIMULATION MODE
        </div>
      </div>

      {/* SCENARIO SELECTION */}
      <section className="arena-section">
        <div className="arena-section-heading">
          <div>
            <h2>Select Threat Scenario</h2>
            <p>Choose a fictional event to evaluate.</p>
          </div>
        </div>

        <div className="arena-scenario-grid">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              className={`arena-scenario-card ${
                selectedScenario.id === scenario.id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedScenario(scenario);
                setResults(null);
              }}
            >
              <div className="arena-card-top">
                <span className="arena-card-label">SCENARIO 0{scenario.id}</span>

                <span
                  className={`arena-severity ${scenario.severity.toLowerCase()}`}
                >
                  {scenario.severity}
                </span>
              </div>

              <h3>{scenario.name}</h3>

              <p>{scenario.description}</p>

              <div className="arena-scenario-metrics">
                <span>Target</span>
                <strong>{scenario.target}</strong>
              </div>

              <div className="arena-scenario-metrics">
                <span>Initial Risk</span>
                <strong>{scenario.risk}/100</strong>
              </div>

              {selectedScenario.id === scenario.id && (
                <div className="arena-selected-label">
                  ✓ SELECTED
                </div>
              )}
            </button>
          ))}
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
        </div>

        <div className="arena-risk-box">
          <span>Initial Risk Score</span>
          <strong>{selectedScenario.risk}/100</strong>
        </div>
      </section>

      {/* STRATEGIES */}
      <section className="arena-section">
        <div className="arena-section-heading">
          <div>
            <h2>Defence Strategies</h2>
            <p>Evaluate two response approaches.</p>
          </div>
        </div>

        <div className="arena-strategy-grid">
          <div className="arena-strategy-card">
            <div className="arena-strategy-icon isolation-icon">
              01
            </div>

            <h3>Full Isolation</h3>

            <p>
              Completely isolates the selected simulated component.
              This approach prioritizes risk reduction but may affect
              service availability.
            </p>

            <div className="arena-strategy-tag">
              HIGH SERVICE DISRUPTION
            </div>
          </div>

          <div className="arena-strategy-card">
            <div className="arena-strategy-icon selective-icon">
              02
            </div>

            <h3>Selective Restrictions</h3>

            <p>
              Applies limited simulated restrictions while attempting
              to preserve essential services.
            </p>

            <div className="arena-strategy-tag">
              SERVICE CONTINUITY FOCUSED
            </div>
          </div>
        </div>
      </section>

      {/* ACTION BUTTONS */}
      <div className="arena-actions">
        <button
          className="arena-run-button"
          onClick={runComparison}
          disabled={isRunning}
        >
          {isRunning ? "Comparing Strategies..." : "▶ Run Defence Comparison"}
        </button>

        <button
          className="arena-reset-button"
          onClick={resetSimulation}
        >
          ↻ Reset
        </button>
      </div>

      {/* LOADING */}
      {isRunning && (
        <div className="arena-loading">
          <div className="arena-spinner"></div>
          <p>Evaluating simulated defence strategies...</p>
        </div>
      )}

      {/* RESULTS */}
      {results && (
        <section className="arena-results">
          <div className="arena-section-heading">
            <div>
              <h2>Comparison Results</h2>
              <p>Illustrative outcomes from the selected scenario.</p>
            </div>

            <span className="arena-completed-badge">
              ✓ ANALYSIS COMPLETE
            </span>
          </div>

          <div className="arena-result-grid">
            {results.map((item) => (
              <div className="arena-result-card" key={item.strategy}>
                <h3>{item.strategy}</h3>

                <div className="arena-result-metric">
                  <span>Residual Risk</span>
                  <strong>{item.residualRisk}/100</strong>
                </div>

                <div className="arena-progress-track">
                  <div
                    className="arena-progress-fill risk-fill"
                    style={{ width: `${item.residualRisk}%` }}
                  ></div>
                </div>

                <div className="arena-result-metric">
                  <span>Service Disruption</span>
                  <strong>{item.disruption}/100</strong>
                </div>

                <div className="arena-progress-track">
                  <div
                    className="arena-progress-fill disruption-fill"
                    style={{ width: `${item.disruption}%` }}
                  ></div>
                </div>

                <p className="arena-score-note">
                  Combined illustrative score:{" "}
                  <strong>
                    {item.residualRisk + item.disruption}
                  </strong>
                </p>

                {recommendedStrategy.strategy === item.strategy && (
                  <div className="arena-recommended-tag">
                    ★ RECOMMENDED STRATEGY
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PERFORMANCE CHART */}
          <div className="arena-chart-card">
            <div className="arena-chart-heading">
              <h3>Strategy Performance</h3>
              <p>Residual risk versus service disruption</p>
            </div>

            <div className="arena-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 15,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#263449"
                  />

                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5e1" }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111c2e",
                      border: "1px solid #334155",
                      borderRadius: "10px",
                      color: "#ffffff",
                    }}
                  />

                  <Legend />

                  <Bar
                    dataKey="Residual Risk"
                    fill="#38bdf8"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="Service Disruption"
                    fill="#f59e0b"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RECOMMENDATION */}
          <div className="arena-recommendation-panel">
            <span className="arena-panel-label">
              SYSTEM RECOMMENDATION
            </span>

            <h3>{recommendedStrategy.strategy}</h3>

            <p>
              Based on the illustrative combined score of residual risk
              and service disruption, this strategy offers the better
              balance in the current simulation.
            </p>

            <div className="arena-recommendation-score">
              Combined Score:{" "}
              <strong>
                {recommendedStrategy.residualRisk +
                  recommendedStrategy.disruption}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* DISCLAIMER */}
      <div className="arena-disclaimer">
        <strong>Simulation Disclaimer</strong>
        <p>
          All scenarios, scores and outcomes are fictional demonstration
          data. The scoring formula is illustrative, not a validated
          cybersecurity model. No real network is accessed or controlled.
        </p>
      </div>
    </div>
  );
}

export default DefenceArena;