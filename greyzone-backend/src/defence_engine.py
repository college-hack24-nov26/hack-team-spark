
import json
import sys
import ipaddress
import networkx as nx


SCENARIO_SCORES = {
    "normal_traffic": 5,
    "port_scan": 75,
    "brute_force": 85,
    "ddos": 95,
    "suspicious_login": 65,
    "malware_beacon": 90,
}

SCENARIO_TARGETS = {
    "normal_traffic": None,
    "port_scan": "web_server",
    "brute_force": "auth_server",
    "ddos": "web_server",
    "suspicious_login": "auth_server",
    "malware_beacon": "app_server",
}

SERVICE_NODES = {
    "web_server": "Web Server",
    "app_server": "Application Server",
    "auth_server": "Authentication Server",
    "database_server": "Database Server",
    "monitoring_server": "Monitoring Server",
}

PROTECTED_SERVICES = [
    "app_server",
    "auth_server",
    "database_server",
    "monitoring_server",
]


def build_network():
    """Build the deterministic simulated GREYZONE network."""

    graph = nx.Graph()

    nodes = [
        ("internet_gateway", "gateway", False),
        ("firewall", "security", True),
        ("web_server", "service", True),
        ("app_server", "service", True),
        ("auth_server", "service", True),
        ("database_server", "data", True),
        ("monitoring_server", "monitoring", True),
    ]

    for node_id, node_type, critical in nodes:
        graph.add_node(
            node_id,
            node_type=node_type,
            critical=critical,
            status="online",
            compromised=False,
        )

    connections = [
        ("internet_gateway", "firewall"),
        ("firewall", "web_server"),
        ("web_server", "app_server"),
        ("app_server", "auth_server"),
        ("app_server", "database_server"),
        ("app_server", "monitoring_server"),
    ]

    graph.add_edges_from(connections)

    return graph


def resolve_target(target, scenario):
    """Resolve the event target to a simulated network component."""

    value = target.lower().replace("-", "_").replace(" ", "_")

    aliases = {
        "web_server": ["web", "website", "http", "frontend"],
        "app_server": ["app", "application", "api", "backend"],
        "auth_server": ["auth", "login", "identity", "authentication"],
        "database_server": ["database", "db", "mongo", "sql"],
        "monitoring_server": ["monitor", "logging", "metrics"],
        "firewall": ["firewall", "network_firewall"],
        "internet_gateway": ["gateway", "internet_gateway"],
    }

    for node_id, keywords in aliases.items():
        if value == node_id or any(keyword in value for keyword in keywords):
            return node_id

    return SCENARIO_TARGETS[scenario]


def service_name(node_id):
    return SERVICE_NODES.get(node_id, node_id.replace("_", " ").title())


def analyse_event(event):
    """Analyse an event and simulate network containment."""

    scenario = event["type"]
    source_ip = event["sourceIp"]
    target = event["target"]

    score = SCENARIO_SCORES[scenario]
    threatened = score >= 60

    graph = build_network()

    if not threatened:
        reachable = [
            service_name(node)
            for node in SERVICE_NODES
            if nx.has_path(graph, "internet_gateway", node)
        ]

        return {
            "score": score,
            "reason": "No significant threat indicators",
            "containment": {
                "required": False,
                "attempted": False,
                "success": None,
                "isolated_node": None,
                "blocked_paths": [],
            },
            "network_state": {
                "affected_nodes": [],
                "reachable_services": reachable,
                "unreachable_services": [],
                "remaining_risk": False,
                "simulation": True,
            },
        }

    affected_node = resolve_target(target, scenario)

    if affected_node not in graph:
        raise ValueError("Unable to resolve target network component")

    graph.nodes[affected_node]["compromised"] = True
    graph.nodes[affected_node]["status"] = "isolated"

    # Add the external source to the simulated network.
    attacker_node = "external_source"
    graph.add_node(
        attacker_node,
        node_type="external",
        critical=False,
        status="online",
        source_ip=source_ip,
    )
    graph.add_edge(attacker_node, "internet_gateway")

    # Record and remove only the affected node's communication links.
    blocked_paths = [
        [affected_node, neighbour]
        for neighbour in list(graph.neighbors(affected_node))
    ]

    graph.remove_edges_from(blocked_paths)

    # Verify that the external attacker can no longer reach
    # the compromised network component after isolation.

    attacker_can_reach_target = nx.has_path(graph, attacker_node, affected_node)

    containment_success = not attacker_can_reach_target

    remaining_paths = []

    for protected_node in PROTECTED_SERVICES:
        if protected_node == affected_node:
            continue

    if nx.has_path(graph, attacker_node, protected_node):
        remaining_paths.append(protected_node)

    # Identify services still reachable from the external network.
    reachable_services = []
    unreachable_services = []

    for node_id in SERVICE_NODES:
        if nx.has_path(graph, attacker_node, node_id):
            reachable_services.append(service_name(node_id))
        else:
            unreachable_services.append(service_name(node_id))

    reason = (
        f"Suspicious {scenario.replace('_', ' ')} detected. "
        f"Affected component: {service_name(affected_node)}. "
        f"Selective network isolation "
        f"{'verified' if containment_success else 'incomplete'}."
    )

    return {
        "score": score,
        "reason": reason,
        "containment": {
            "required": True,
            "attempted": True,
            "success": containment_success,
            "isolated_node": affected_node,
            "blocked_paths": blocked_paths,
        },
        "network_state": {
            "affected_nodes": [affected_node],
            "reachable_services": reachable_services,
            "unreachable_services": unreachable_services,
            "remaining_risk": not containment_success,
            "attacker_can_reach_target": attacker_can_reach_target,
            "simulation": True,
        },
    }


def main():
    try:
        if len(sys.argv) == 2:
            raw_input = sys.argv[1]
        elif len(sys.argv) == 1:
            raw_input = sys.stdin.read()
        else:
            raise ValueError("Expected one JSON event argument")

        event = json.loads(raw_input)

        if not isinstance(event, dict):
            raise ValueError("Event must be a JSON object")

        scenario = event.get("type")
        source_ip = event.get("sourceIp")
        target = event.get("target")

        if scenario not in SCENARIO_SCORES:
            raise ValueError("Unsupported scenario")

        if not isinstance(source_ip, str):
            raise ValueError("Invalid source IP")

        ipaddress.ip_address(source_ip)

        if not isinstance(target, str) or not target.strip() or len(target) > 120:
            raise ValueError("Invalid target")

        result = analyse_event(event)

        # stdout is reserved exclusively for machine-readable JSON.
        print(json.dumps(result))

    except Exception as error:
        print(
            json.dumps({
                "error": str(error)
            })
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
