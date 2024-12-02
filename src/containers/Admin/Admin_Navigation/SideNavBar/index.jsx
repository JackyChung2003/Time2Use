import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaAngleUp, FaAngleDown, FaChevronDown} from "react-icons/fa"; // Icons for toggle button
import PropTypes from "prop-types"; // Import PropTypes for props validation
import adminNavBarItems from "../AdminNavBarItems";
import "./index.css"; // Side navigation styles

const SideNavBar = ({ isCollapsed, toggleSidebar }) => {
    const [expandedSections, setExpandedSections] = useState({}); // To track expanded/collapsed sections
    const [expandedDropdown, setExpandedDropdown] = useState(null); // For dropdowns

    const toggleSection = (index) => {
        setExpandedSections((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const toggleDropdown = (index) => {
        setExpandedDropdown(expandedDropdown === index ? null : index);
      };

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
                        {item.dropdown ? (
                            // If item has dropdown subsection, render a collapsible menu
                            // <>
                            <li key={index} className="side-nav-item">
                                <div
                                    className="dropdown-header"
                                    // onClick={() => toggleSection(index)}
                                    onClick={() => toggleDropdown(index)}
                                >
                                    <div className="nav-icon">{item.icon}</div>
                                    {/* {!isCollapsed && (
                                        <>
                                            <span className="nav-title">{item.title}</span>
                                            <span className="dropdown-icon">
                                                {expandedSections[index] ? <FaAngleUp /> : <FaAngleDown />}
                                            </span>
                                        </>
                                    )} */}
                                    <span className="nav-title">{item.title}</span>
                                    {/* <FaChevronDown
                                      className={`dropdown-arrow ${
                                        expandedDropdown === index ? "expanded" : ""
                                      }`}
                                    /> */}
                                    {expandedDropdown === index ? (
                                      <FaAngleUp className="dropdown-arrow" />
                                    ) : (
                                      <FaChevronDown className="dropdown-arrow" />
                                    )}
                                </div>
                                {/* Subsections */}
                                {/* {expandedSections[index] && (
                                    <ul className="nested-menu">
                                        {item.subsections.map((subItem, subIndex) => (
                                            <li key={subIndex} className="nested-item">
                                                <NavLink
                                                    to={subItem.link}
                                                    className={({ isActive }) =>
                                                        isActive ? "active" : ""
                                                    }
                                                >
                                                    <span className="nested-title">{subItem.title}</span>
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )} */}
                            {/* </> */}
                            <ul
                                className={`nested-menu ${
                                  expandedDropdown === index ? "expanded" : ""
                                }`}
                              >
                                {item.items.map((subItem, subIndex) => (
                                  <li key={subIndex} className="nested-item">
                                    <a href={subItem.link}>{subItem.title}</a>
                                  </li>
                                ))}
                              </ul>
                            </li>
                        ) : (
                            // Normal navigation item
                            <NavLink
                                to={item.link}
                                className={({ isActive }) => (isActive ? "active" : "")}
                            >
                                <div className="nav-icon">{item.icon}</div>
                                {!isCollapsed && <span className="nav-title">{item.title}</span>}
                            </NavLink>
                        )}
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
