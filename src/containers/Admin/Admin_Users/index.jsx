import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';

const AdminUsers = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // For filtered data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [sortConfig, setSortConfig] = useState({ key: "username", direction: "asc" }); // Default sorting
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages

  const limit = 10; 

  const fetchUsers = async (pageNumber = 1) => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const start = (pageNumber - 1) * limit;
      const end = start + limit - 1;

      // Fetch users from auth.users
      const { data: users, error: usersError } = await supabase
        .from('profile')
        .select('id,username, user');

      if (usersError) throw usersError;

      // Fetch roles from user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_id');

      if (rolesError) throw rolesError;

      // Merge the data
      const usersWithRoles = users.map(user => {
        const userRole = roles.find(role => role.user_id === user.user);
        return {
          id: user.id,
          username: user.username,
          unique_id: user.user,
          role: userRole
            ? userRole.role_id === 1
              ? 'Admin'
              : 'Client'
            : 'Unknown' // Default if no role is found
        };
      });

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles); // Initialize filtered data
      setTotalPages(Math.ceil(usersWithRoles.length / limit)); // Calculate total pages
    } catch (error) {
      setError("Failed to fetch users.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search functionality
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term) {
      const filtered = users.filter((user) =>
        user.username.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users); // Reset to full list if no search term
    }
  };

  // Handle sorting functionality
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    // Refetch sorted data
    fetchUsers(page);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchUsers(newPage);
    }
  };

  // Fetch data on component mount and when page changes
  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profile')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
      setFilteredUsers((prevFilteredUsers) =>
        prevFilteredUsers.filter((user) => user.id !== id)
      );

      alert("User deleted successfully.");
    } catch (err) {
      setError("Failed to delete user.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-users'>
      <h1>Manage Users</h1>
      <p>View, create, and manage users.</p>

      {/* Search and Refresh */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            width: "100%",
            maxWidth: "400px",
          }}
        />
        <button
          onClick={() => fetchUsers(page)}
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "white",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Show loading state */}
      {loading && <p>Loading users...</p>}

      {/* Show error state */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display users */}
      {!loading && !error && filteredUsers.length > 0 ? (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f4f4f4" }}>
              <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>ID</th>
                <th
                  onClick={() => handleSort("username")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Username {sortConfig.key === "username" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("role")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Role {sortConfig.key === "role" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{user.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{user.username}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{user.role}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                  <button
                    onClick={() => navigate(`/admin/users/view/${user.id}`)}
                    style={{
                        marginRight: "10px",
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor: "#FFA500",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                    }}
                  >
                    View
                  </button>
                    <button
                      onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                      style={{
                        marginRight: "10px",
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              style={{
                marginRight: "10px",
                padding: "8px 12px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: page === 1 ? "not-allowed" : "pointer",
              }}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              style={{
                marginLeft: "10px",
                padding: "8px 12px",
                backgroundColor: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: page === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        !loading && <p>No users found.</p>
      )}
    </div>
  );
};

export default AdminUsers;
