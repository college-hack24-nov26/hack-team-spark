import {
  LayoutDashboard,
  Network,
  ShieldAlert,
  ShieldCheck,
  FileText,
  HelpCircle,
  Activity,
} from "lucide-react";

function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Network Monitor", icon: Network },
    { name: "Threat Simulation", icon: ShieldAlert },
    { name: "Defence Arena", icon: ShieldCheck },
    { name: "Incident Reports", icon: FileText },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Activity size={25} />
        </div>

        <div>
          <h2>GREYZONE</h2>
          <span>CYBER DEFENCE SYSTEM</span>
        </div>
      </div>

      <div className="sidebar-label">MAIN MENU</div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${
            activePage === "Help & Support" ? "active" : ""
          }`}
          onClick={() => setActivePage("Help & Support")}
        >
          <HelpCircle size={19} />
          <span>Help & Support</span>
        </button>

        <div className="system-status">
          <span className="status-dot"></span>
          <div>
            <strong>System Operational</strong>
            <small>Simulation Environment</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;