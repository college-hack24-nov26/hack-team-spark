
import { useCallback, useEffect, useState } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  Network,
  Server,
  ShieldCheck,
  Database,
  AlertTriangle,
  RefreshCw,
  Globe,
  Activity,
} from "lucide-react";

import { api } from "../api";
import "../index.css";

const initialNodes = [
  {
    id: "internet_gateway",
    type: "custom",
    position: { x: 300, y: 0 },
    data: { label: "Internet Gateway", status: "Operational", icon: Globe },
  },
  {
    id: "firewall",
    type: "custom",
    position: { x: 300, y: 130 },
    data: { label: "Firewall", status: "Operational", icon: ShieldCheck },
  },
  {
    id: "web_server",
    type: "custom",
    position: { x: 100, y: 280 },
    data: { label: "Web Server", status: "Operational", icon: Server },
  },
  {
    id: "app_server",
    type: "custom",
    position: { x: 300, y: 430 },
    data: { label: "Application Server", status: "Operational", icon: Activity },
  },
  {
    id: "auth_server",
    type: "custom",
    position: { x: 520, y: 280 },
    data: { label: "Authentication Server", status: "Operational", icon: ShieldCheck },
  },
  {
    id: "database_server",
    type: "custom",
    position: { x: 100, y: 580 },
    data: { label: "Database Server", status: "Operational", icon: Database },
  },
  {
    id: "monitoring_server",
    type: "custom",
    position: { x: 500, y: 580 },
    data: { label: "Monitoring Server", status: "Operational", icon: Activity },
  },
];

const connections = [
  ["internet_gateway", "firewall"],
  ["firewall", "web_server"],
  ["web_server", "app_server"],
  ["app_server", "auth_server"],
  ["app_server", "database_server"],
  ["app_server", "monitoring_server"],
];

function CustomNode({ data }) {
  const Icon = data.icon;

  return (
    <div className={`custom-node ${data.status.toLowerCase().replaceAll(" ", "-")}`}>
      <Handle type="target" position={Position.Top} />

      <div className="custom-node-icon">
        <Icon size={23} />
      </div>

      <strong>{data.label}</strong>
      <span>{data.status}</span>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { custom: CustomNode };

function makeTopology(incident) {
  const affected = new Set(
    incident?.network_state?.affected_nodes ?? []
  );

  const blockedPaths = incident?.containment?.blocked_paths ?? [];

  const blockedEdges = new Set(
    blockedPaths.map(([a, b]) => [a, b].sort().join("|"))
  );

  const nodes = initialNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      status: affected.has(node.id)
        ? "Isolated"
        : "Operational",
    },
  }));

  const edges = connections.map(([source, target], index) => {
    const isBlocked = blockedEdges.has(
      [source, target].sort().join("|")
    );

    return {
      id: `edge-${index}`,
      source,
      target,
      animated: !isBlocked,
      style: {
        stroke: isBlocked ? "#ef4444" : "#22c55e",
        strokeWidth: isBlocked ? 3 : 2,
      },
      label: isBlocked ? "BLOCKED" : undefined,
      labelStyle: { fill: "#ef4444", fontSize: 10 },
    };
  });

  return { nodes, edges };
}

function NetworkMonitor() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [latestIncident, setLatestIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshNetwork = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const incidents = await api.getIncidents();
      const latest = incidents?.[0] ?? null;

      setLatestIncident(latest);

      const topology = makeTopology(latest);
      setNodes(topology.nodes);
      setEdges(topology.edges);

      setSelectedNode((current) => {
        if (!current) return null;
        return topology.nodes.find((node) => node.id === current.id) ?? null;
      });
    } catch (err) {
      setError(err.message || "Unable to load network state.");
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    refreshNetwork();
  }, [refreshNetwork]);

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node);
  }, []);

  const isolatedCount = nodes.filter(
    (node) => node.data.status === "Isolated"
  ).length;

  const blockedCount = edges.filter(
    (edge) => edge.label === "BLOCKED"
  ).length;

  return (
    <div className="network-page">
      <div className="network-heading">
        <div>
          <h1>Network Monitor</h1>
          <p>
            Live topology based on the latest GREYZONE backend incident.
          </p>
        </div>

        <button
          onClick={refreshNetwork}
          disabled={loading}
          className="reset-simulation-btn"
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh Network"}
        </button>
      </div>

      {error && (
        <div className="simulation-note">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="network-summary">
        <div className="network-summary-card">
          <Network />
          <div>
            <strong>{nodes.length}</strong>
            <span>Total Nodes</span>
          </div>
        </div>

        <div className="network-summary-card">
          <ShieldCheck />
          <div>
            <strong>{nodes.length - isolatedCount}</strong>
            <span>Operational</span>
          </div>
        </div>

        <div className="network-summary-card">
          <AlertTriangle />
          <div>
            <strong>{isolatedCount}</strong>
            <span>Isolated Nodes</span>
          </div>
        </div>

        <div className="network-summary-card">
          <Server />
          <div>
            <strong>{blockedCount}</strong>
            <span>Blocked Connections</span>
          </div>
        </div>
      </div>

      <div className="network-workspace">
        <div className="network-visual">
          <div className="network-visual-heading">
            <h3>Network Topology</h3>
            <span>BACKEND SIMULATION STATE</span>
          </div>

          <div className="react-flow-wrapper">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              nodesDraggable
              nodesConnectable={false}
            >
              <Background color="#31445c" gap={20} />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.data.status === "Isolated") return "#ef4444";
                  return "#22c55e";
                }}
                maskColor="rgba(5, 12, 25, 0.7)"
              />
            </ReactFlow>
          </div>

          <div className="topology-legend">
            <span><i className="legend-green"></i> Operational</span>
            <span><i className="legend-red"></i> Isolated / Blocked</span>
          </div>
        </div>

        <div className="node-details">
          <div className="network-visual-heading">
            <h3>Node Details</h3>
          </div>

          {selectedNode ? (
            <>
              <div className="selected-node-icon">
                {(() => {
                  const Icon = selectedNode.data.icon;
                  return <Icon size={30} />;
                })()}
              </div>

              <h2>{selectedNode.data.label}</h2>

              <div className="detail-row">
                <span>Component ID</span>
                <strong>{selectedNode.id}</strong>
              </div>

              <div className="detail-row">
                <span>Status</span>
                <strong>{selectedNode.data.status}</strong>
              </div>
            </>
          ) : (
            <div className="empty-node">
              <Network size={38} />
              <h3>No Node Selected</h3>
              <p>Click a network component to inspect it.</p>
            </div>
          )}

          <div className="simulation-note">
            This topology visualizes the backend's simulated network state.
            It does not control real network infrastructure.
          </div>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Latest Backend Incident</h2>
            <p>Most recent incident retrieved from MongoDB.</p>
          </div>
        </div>

        {latestIncident ? (
          <>
            <p><strong>Event:</strong> {latestIncident.event_type}</p>
            <p><strong>Target:</strong> {latestIncident.target}</p>
            <p><strong>Threat score:</strong> {latestIncident.score}/100</p>
            <p><strong>Incident status:</strong> {latestIncident.status}</p>
            <p><strong>Reason:</strong> {latestIncident.reason}</p>
          </>
        ) : (
          <p>No incidents have been recorded yet.</p>
        )}

        {loading && <p>Loading backend network state...</p>}
      </section>
    </div>
  );
}

export default NetworkMonitor;
