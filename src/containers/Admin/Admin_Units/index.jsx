import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
//import './index.css';

const AdminUnits = () => {
  const navigate = useNavigate();

  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]); // For filtered data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [sortConfig, setSortConfig] = useState({ key: "unit_description", direction: "asc" }); // Default sorting
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages

  const limit = 10;

  const fetchUnits = async (pageNumber = 1) => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const start = (pageNumber - 1) * limit;
      const end = start + limit - 1;

      // Fetch units from the units table
      const { data: unitsData, error: unitsError } = await supabase
        .from('unit')
        .select('id, unit_description, unit_tag, conversion_rate_to_grams');

      if (unitsError) throw unitsError;

      setUnits(unitsData);
      setFilteredUnits(unitsData); // Initialize filtered data
      setTotalPages(Math.ceil(unitsData.length / limit)); // Calculate total pages
    } catch (error) {
      setError("Failed to fetch units.");
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
      const filtered = units.filter((unit) =>
        unit.unit_description.toLowerCase().includes(term) ||
        unit.unit_tag.toLowerCase().includes(term)
      );
      setFilteredUnits(filtered);
    } else {
      setFilteredUnits(units); // Reset to full list if no search term
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
    fetchUnits(page);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchUnits(newPage);
    }
  };

  // Fetch data on component mount and when page changes
  useEffect(() => {
    fetchUnits(page);
  }, [page]);

  const deleteUnit = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this unit?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('unit')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== id));
      setFilteredUnits((prevFilteredUnits) =>
        prevFilteredUnits.filter((unit) => unit.id !== id)
      );

      alert("Unit deleted successfully.");
    } catch (err) {
      setError("Failed to delete unit.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-units'>
      <h1>Manage Units</h1>
      <p>View, create, and manage units.</p>

      {/* Search and Refresh */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search units..."
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
          onClick={() => fetchUnits(page)}
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
            Create Unit
        </button>
      </div>

      {/* Show loading state */}
      {loading && <p>Loading units...</p>}

      {/* Show error state */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display units */}
      {!loading && !error && filteredUnits.length > 0 ? (
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
                  onClick={() => handleSort("unit_description")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Unit Description {sortConfig.key === "unit_description" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("unit_tag")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Unit Tag {sortConfig.key === "unit_tag" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("conversion_rate_to_grams")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Conversion Rate to Grams {sortConfig.key === "conversion_rate_to_grams" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.id}>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{unit.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{unit.unit_description}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{unit.unit_tag}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{unit.conversion_rate_to_grams}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => navigate(`/admin/units/view/${unit.id}`)}
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
                      onClick={() => navigate(`/admin/units/edit/${unit.id}`)}
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
                      onClick={() => deleteUnit(unit.id)}
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
        !loading && <p>No units found.</p>
      )}
    </div>
  );
};

export default AdminUnits;
