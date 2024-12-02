import PropTypes from "prop-types";
import SideNavBar from "../../containers/Admin/Admin_Navigation/SideNavBar";
import "./index.css"; // Admin layout-specific styles

const AdminLayout = ({ children, isCollapsed, toggleSidebar }) => {
  return (
    <div className={`admin-layout-container ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <SideNavBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="admin-content-wrapper">
        {/* Optional: Admin Header */}
        <header className="admin-header">
          <h1>Admin Panel</h1>
        </header>

        {/* Page Content */}
        <div className="admin-content">{children}</div>

        {/* Optional: Footer */}
        <footer className="admin-footer">
          <p>Admin Panel &copy; 2024</p>
        </footer>
      </div>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired, // Page content
  isCollapsed: PropTypes.bool.isRequired, // Sidebar collapse state
  toggleSidebar: PropTypes.func.isRequired, // Toggle function
};

export default AdminLayout;
