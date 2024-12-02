import { NavLink } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa"; // Icons for toggle button
import PropTypes from "prop-types"; // Import PropTypes for props validation
import adminNavBarItems from "../AdminNavBarItems";
import "./index.css"; // Side navigation styles

const SideNavBar = ({ isCollapsed, toggleSidebar }) => {
    return (
        <div className={`side-nav-container ${isCollapsed ? "collapsed" : ""}`}>
            {/* Toggle button */}
            <div className="toggle-btn" onClick={toggleSidebar}>
                {isCollapsed ? <FaBars /> : <FaTimes />}
            </div>

            {/* Navigation Items */}
            <ul className="side-nav-items">
                {adminNavBarItems.map((item, index) => (
                    <li key={index} className="side-nav-item">
                        <NavLink
                            to={item.link}
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            <div className="nav-icon">{item.icon}</div>
                            {!isCollapsed && <span className="nav-title">{item.title}</span>}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
};

SideNavBar.propTypes = {
    isCollapsed: PropTypes.bool.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
};

export default SideNavBar;
