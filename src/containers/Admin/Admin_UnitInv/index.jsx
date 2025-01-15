import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const AdminUnitInv = () => {
  const navigate = useNavigate();

  const [unitInvs, setUnitInvs] = useState([]);
  const [filteredUnitInvs, setFilteredUnitInvs] = useState([]); // For filtered data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [sortConfig, setSortConfig] = useState({ key: "unitInv_tag", direction: "asc" }); // Default sorting
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages

  const limit = 10;

  const fetchUnitInvs = async (pageNumber = 1) => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const start = (pageNumber - 1) * limit;
      const end = start + limit - 1;

      // Fetch unit inventory from the unit_inv table
      const { data: unitInvData, error: unitInvError } = await supabase
        .from('unitInv')
        .select('id, unitInv_tag, conversion_rate_to_grams_for_check');

      if (unitInvError) throw unitInvError;

      setUnitInvs(unitInvData);
      setFilteredUnitInvs(unitInvData); // Initialize filtered data
      setTotalPages(Math.ceil(unitInvData.length / limit)); // Calculate total pages
    } catch (error) {
      setError("Failed to fetch unit inventory.");
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
      const filtered = unitInvs.filter((unitInv) =>
        unitInv.unitinv_tag.toLowerCase().includes(term)
      );
      setFilteredUnitInvs(filtered);
    } else {
      setFilteredUnitInvs(unitInvs); // Reset to full list if no search term
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
    fetchUnitInvs(page);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchUnitInvs(newPage);
    }
  };

  // Fetch data on component mount and when page changes
  useEffect(() => {
    fetchUnitInvs(page);
  }, [page]);

  const deleteUnitInv = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this unit inventory?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('unitInv')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUnitInvs((prevUnitInvs) => prevUnitInvs.filter((unitInv) => unitInv.id !== id));
      setFilteredUnitInvs((prevFilteredUnitInvs) =>
        prevFilteredUnitInvs.filter((unitInv) => unitInv.id !== id)
      );

      alert("Unit inventory deleted successfully.");
    } catch (err) {
      setError("Failed to delete unit inventory.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-unit-inv'>
      <h1>Manage Unit Inventory</h1>
      <p>View and manage unit inventory.</p>

      {/* Search and Refresh */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search unit inventory..."
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
          onClick={() => fetchUnitInvs(page)}
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
        <button
          onClick={() => navigate("create")} // Navigate to the create page
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "white",
            cursor: "pointer",
          }}
        >
          Create Unit Inventory
        </button>
      </div>

      {/* Show loading state */}
      {loading && <p>Loading unit inventory...</p>}

      {/* Show error state */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display unit inventory */}
      {!loading && !error && filteredUnitInvs.length > 0 ? (
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
                  onClick={() => handleSort("unitInv_tag")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Unit Inventory Tag {sortConfig.key === "unitInv_tag" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("conversion_rate_to_grams_for_check")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Conversion Rate to Grams for Check {sortConfig.key === "conversion_rate_to_grams_for_check" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnitInvs.map((unitInv) => (
                <tr key={unitInv.id}>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{unitInv.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{unitInv.unitInv_tag}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{unitInv.conversion_rate_to_grams_for_check}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => navigate(`/admin/unitinv/view/${unitInv.id}`)}
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
                      onClick={() => navigate(`/admin/unitinv/edit/${unitInv.id}`)}
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
                      onClick={() => deleteUnitInv(unitInv.id)}
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
        !loading && <p>No unit inventory found.</p>
      )}
    </div>
  );
};

export default AdminUnitInv;
