
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const DEFAULT_SOURCE_IP = "10.10.10.60";

// Actual scenarios supported by the Python defence engine.
export const THREAT_SCENARIOS = [
  {
    id: "normal_traffic",
    name: "Normal Traffic",
    description: "Simulates legitimate network traffic.",
    target: "demo-login",
    severity: "Low",
    icon: "activity",
  },
  {
    id: "port_scan",
    name: "Port Scan",
    description: "Simulates suspicious port scanning activity.",
    target: "web_server",
    severity: "High",
    icon: "scan",
  },
  {
    id: "brute_force",
    name: "Brute Force",
    description: "Simulates repeated authentication attempts.",
    target: "demo-login",
    severity: "High",
    icon: "shield-alert",
  },
  {
    id: "ddos",
    name: "DDoS Attack",
    description: "Simulates a distributed denial-of-service attack.",
    target: "web_server",
    severity: "Critical",
    icon: "zap",
  },
  {
    id: "suspicious_login",
    name: "Suspicious Login",
    description: "Simulates suspicious authentication activity.",
    target: "demo-login",
    severity: "Medium",
    icon: "user-x",
  },
  {
    id: "malware_beacon",
    name: "Malware Beacon",
    description: "Simulates suspicious outbound beaconing activity.",
    target: "app_server",
    severity: "Critical",
    icon: "bug",
  },
];

async function http(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      "Cannot connect to GREYZONE backend. Check that the server is running on port 5000."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Backend request failed (${response.status})`
    );
  }

  return data;
}

export const api = {
  // Backend health and dashboard statistics
  getHealth: () => http("/health"),

  getStatus: () => http("/status"),

  // Incident management
  getIncidents: async () => {
    const data = await http("/incidents");
    return data.incidents;
  },

  getIncident: async (id) => {
    const data = await http(`/incidents/${encodeURIComponent(id)}`);
    return data.incident;
  },

  // Attack scenario execution
  runScenario: async ({
    scenario,
    sourceIp = DEFAULT_SOURCE_IP,
    target,
  }) => {
    const data = await http("/scenarios", {
      method: "POST",
      body: JSON.stringify({
        scenario,
        sourceIp,
        target,
      }),
    });

    return data.incident;
  },

  // Custom event processing
  submitEvent: async (event) => {
    const data = await http("/events", {
      method: "POST",
      body: JSON.stringify(event),
    });

    return data.incident;
  },

  // Alert management
  getAlerts: async () => {
    const data = await http("/alerts");
    return data.alerts;
  },

  acknowledgeAlert: (id) =>
    http(`/alerts/${encodeURIComponent(id)}/acknowledge`, {
      method: "PATCH",
    }),

  // Virtual blocklist
  getBlockedSources: async () => {
    const data = await http("/blocked-sources");
    return data.blockedSources;
  },
};

export const THREAT_TYPES = Object.freeze(
  THREAT_SCENARIOS.reduce((types, scenario) => {
    types[scenario.id] = scenario.name;
    return types;
  }, {})
);
