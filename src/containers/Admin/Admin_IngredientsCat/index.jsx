import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const AdminIngredientsCat = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]); // For filtered data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [sortConfig, setSortConfig] = useState({ key: "category_name", direction: "asc" }); // Default sorting
  const [page, setPage] = useState(1); // Current page
  const [totalPages, setTotalPages] = useState(1); // Total pages

  const limit = 10;

  const fetchCategories = async (pageNumber = 1) => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      const start = (pageNumber - 1) * limit;
      const end = start + limit - 1;

      // Fetch categories from the ingredients_category table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('ingredients_category')
        .select('id, category_name, category_tag');

      if (categoriesError) throw categoriesError;

      setCategories(categoriesData);
      setFilteredCategories(categoriesData); // Initialize filtered data
      setTotalPages(Math.ceil(categoriesData.length / limit)); // Calculate total pages
    } catch (error) {
      setError("Failed to fetch categories.");
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
      const filtered = categories.filter((category) =>
        category.category_name.toLowerCase().includes(term) ||
        category.category_tag.toLowerCase().includes(term)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories); // Reset to full list if no search term
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
    fetchCategories(page);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      fetchCategories(newPage);
    }
  };

  // Fetch data on component mount and when page changes
  useEffect(() => {
    fetchCategories(page);
  }, [page]);

  const deleteCategory = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this category?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('ingredients_category')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCategories((prevCategories) => prevCategories.filter((category) => category.id !== id));
      setFilteredCategories((prevFilteredCategories) =>
        prevFilteredCategories.filter((category) => category.id !== id)
      );

      alert("Category deleted successfully.");
    } catch (err) {
      setError("Failed to delete category.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-ingredients-category'>
      <h1>Manage Ingredients Categories</h1>
      <p>View, create, and manage ingredients categories.</p>

      {/* Search and Refresh */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search categories..."
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
          onClick={() => fetchCategories(page)}
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
            Create Category
        </button>
      </div>

      {/* Show loading state */}
      {loading && <p>Loading categories...</p>}

      {/* Show error state */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Display categories */}
      {!loading && !error && filteredCategories.length > 0 ? (
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
                  onClick={() => handleSort("category_name")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Category Name {sortConfig.key === "category_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("category_tag")}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Category Tag {sortConfig.key === "category_tag" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id}>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{category.id}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{category.category_name}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px" }}>{category.category_tag}</td>
                  <td style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                    <button
                      onClick={() => navigate(`/admin/ingredientscat/view/${category.id}`)}
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
                      onClick={() => navigate(`/admin/ingredientscat/edit/${category.id}`)}
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
                      onClick={() => deleteCategory(category.id)}
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
        !loading && <p>No categories found.</p>
      )}
    </div>
  );
};

export default AdminIngredientsCat;
