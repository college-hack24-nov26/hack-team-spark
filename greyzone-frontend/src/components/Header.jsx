import { Bell, Search, ShieldCheck, ChevronDown } from "lucide-react";

function Header({ activePage }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="breadcrumb">
          <span>GREYZONE</span>
          <span className="separator">/</span>
          <strong>{activePage}</strong>
        </div>

        <p>Intelligent Cyber Defence Platform</p>
      </div>

      <div className="header-right">
        <div className="simulation-badge">
          <span className="status-dot"></span>
          SIMULATION MODE
        </div>

        <button className="header-icon" aria-label="Search">
          <Search size={19} />
        </button>

        <button className="header-icon" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot"></span>
        </button>

        <div className="profile">
          <div className="profile-avatar">
            <ShieldCheck size={20} />
          </div>

          <div className="profile-info">
            <strong>Security Admin</strong>
            <small>Administrator</small>
          </div>

          <ChevronDown size={15} />
        </div>
      </div>
    </header>
  );
}

export default Header;