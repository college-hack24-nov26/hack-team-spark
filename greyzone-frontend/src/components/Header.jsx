
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
      </div>
    </header>
  );
}

export default Header;
