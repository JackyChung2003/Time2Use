import "./index.css"; 
import navBarItems from "../navBarItems";
import { LuScan } from "react-icons/lu";
import { Link, useLocation } from "react-router-dom";

const BottomNavBar = () => {
  const location = useLocation();

  return (
    <div className="bottom-nav-container">
      <div className="bottom-nav-wrapper">
        {/* Left-side nav items */}
        {navBarItems.slice(0, 3).map((item, index) => (
          <Link
            to={item.link}
            key={index}
            className={`bottom-nav-links ${location.pathname === item.link ? "active" : ""}`}
          >
            <div className="nav-item">
              <span className="nav-icon">{item.icon}</span>
            </div>
          </Link>
        ))}

        {/* Center scan button */}
        <div className="scan-icon-container">
          <div className="scan-icon-wrapper">
            <Link to="/scan" className="scan-icon-link">
              <LuScan className="scan-icon" />
            </Link>
          </div>
        </div>

        {/* Right-side nav items */}
        {navBarItems.slice(3, 5).map((item, index) => (
          <Link
            to={item.link}
            key={index + 3}
            className={`bottom-nav-links ${location.pathname === item.link ? "active" : ""}`}
          >
            <div className="nav-item">
              <span className="nav-icon">{item.icon}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavBar;
