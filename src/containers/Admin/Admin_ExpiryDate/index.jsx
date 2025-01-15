import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const AdminExpiryDate = () => {
  const navigate = useNavigate();

  const [expiryDates, setExpiryDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages

  const limit = 10;

  const fetchExpiryDates = async (pageNumber = 1) => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const start = (pageNumber - 1) * limit;
      const end = start + limit - 1;

      // Fetch expiry dates from the expiry_date table
      const { data: expiryData, error: expiryError } = await supabase
        .from('expiry_date')
        .select('id, date')
        .range(start, end);

      if (expiryError) throw expiryError;

      setExpiryDates(expiryData);
      const { count } = await supabase
        .from('expiry_date')
        .select('*', { count: 'exact', head: true });
      setTotalPages(Math.ceil(count / limit));
    } catch (error) {
      setError("Failed to fetch expiry dates.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchExpiryDates(newPage);
    }
  };

  // Fetch data on component mount and when page changes
  useEffect(() => {
    fetchExpiryDates(page);
  }, [page]);

  const deleteExpiryDate = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this expiry date?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('expiry_date')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpiryDates((prevExpiryDates) => prevExpiryDates.filter((item) => item.id !== id));
      alert("Expiry date deleted successfully.");
    } catch (err) {
      setError("Failed to delete expiry date.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-expiry-date'>
      <h1>Manage Expiry Dates</h1>
      <p>View and manage expiry dates.</p>

      {/* Search and Refresh */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
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
            Create Expiry Date
        </button>
      </div>

      {/* Show loading state */}
      {loading && <p>Loading expiry dates...</p>}

      {/* Show error state */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display expiry dates */}
      {!loading && !error && expiryDates.length > 0 ? (
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
                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "left" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {expiryDates.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{item.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{item.date}</td>
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
        !loading && <p>No expiry dates found.</p>
      )}
    </div>
  );
};

export default AdminExpiryDate;
