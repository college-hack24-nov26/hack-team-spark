import { useCallback, useState } from "react";
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
} from "lucide-react";

import "../index.css";

function CustomNode({ data }) {
  const Icon = data.icon;

  return (
    <div className={`custom-node ${data.status.toLowerCase()}`}>
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

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes = [
  {
    id: "gateway",
    type: "custom",
    position: { x: 300, y: 30 },
    data: {
      label: "Core Gateway",
      status: "Operational",
      icon: Network,
    },
  },
  {
    id: "bunker1",
    type: "custom",
    position: { x: 80, y: 200 },
    data: {
      label: "Bunker 01",
      status: "Monitoring",
      icon: ShieldCheck,
    },
  },
  {
    id: "bunker2",
    type: "custom",
    position: { x: 300, y: 200 },
    data: {
      label: "Bunker 02",
      status: "Operational",
      icon: ShieldCheck,
    },
  },
  {
    id: "bunker3",
    type: "custom",
    position: { x: 520, y: 200 },
    data: {
      label: "Bunker 03",
      status: "Operational",
      icon: ShieldCheck,
    },
  },
  {
    id: "database",
    type: "custom",
    position: { x: 300, y: 380 },
    data: {
      label: "Data Centre",
      status: "Operational",
      icon: Database,
    },
  },
];

const initialEdges = [
  {
    id: "e1",
    source: "gateway",
    target: "bunker1",
    animated: true,
  },
  {
    id: "e2",
    source: "gateway",
    target: "bunker2",
    animated: true,
  },
  {
    id: "e3",
    source: "gateway",
    target: "bunker3",
    animated: true,
  },
  {
    id: "e4",
    source: "bunker1",
    target: "database",
    animated: true,
  },
  {
    id: "e5",
    source: "bunker2",
    target: "database",
    animated: true,
  },
  {
    id: "e6",
    source: "bunker3",
    target: "database",
    animated: true,
  },
];

function NetworkMonitor() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState(null);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="network-page">
      <div className="network-heading">
        <div>
          <h1>Network Monitor</h1>
          <p>
            Interactive topology of the GREYZONE simulated environment.
          </p>
        </div>

        <div className="network-badge">
          <span className="status-dot"></span>
          SIMULATION ACTIVE
        </div>
      </div>

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
            <strong>04</strong>
            <span>Operational</span>
          </div>
        </div>

        <div className="network-summary-card">
          <AlertTriangle />
          <div>
            <strong>01</strong>
            <span>Monitoring</span>
          </div>
        </div>

        <div className="network-summary-card">
          <Server />
          <div>
            <strong>{edges.length}</strong>
            <span>Connections</span>
          </div>
        </div>
      </div>

      <div className="network-workspace">
        <div className="network-visual">
          <div className="network-visual-heading">
            <h3>Interactive Network Topology</h3>
            <span>DRAG NODES TO REPOSITION</span>
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
              elementsSelectable
            >
              <Background color="#31445c" gap={20} />
              <Controls />
              <MiniMap
                nodeColor={(node) =>
                  node.data.status === "Monitoring"
                    ? "#eab308"
                    : "#22c55e"
                }
                maskColor="rgba(5, 12, 25, 0.7)"
              />
            </ReactFlow>
          </div>

          <div className="topology-legend">
            <span>
              <i className="legend-green"></i>
              Operational
            </span>
            <span>
              <i className="legend-yellow"></i>
              Monitoring
            </span>
            <span>
              <i className="legend-red"></i>
              Simulated Threat
            </span>
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

              <p>
                Selected simulated network component.
              </p>

              <div className="detail-row">
                <span>Component ID</span>
                <strong>{selectedNode.id}</strong>
              </div>

              <div className="detail-row">
                <span>Status</span>
                <strong
                  className={selectedNode.data.status.toLowerCase()}
                >
                  {selectedNode.data.status}
                </strong>
              </div>

              <div className="detail-row">
                <span>Position</span>
                <strong>
                  {Math.round(selectedNode.position.x)},{" "}
                  {Math.round(selectedNode.position.y)}
                </strong>
              </div>
            </>
          ) : (
            <div className="empty-node">
              <Network size={38} />
              <h3>No Node Selected</h3>
              <p>
                Click any network component to inspect its details.
              </p>
            </div>
          )}

          <div className="simulation-note">
            This topology represents a fictional network. All statuses
            and connections are simulated demonstration data.
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkMonitor;