import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';
import CommonLoader from '../../../components/Loader/CommonLoader';

// Ingredients Table Component
const IngredientsTable = ({ ingredients, handleEditIngredient, handleDeleteIngredient }) => {
  return (
    <div>
      <h2>Manage Ingredients</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category ID</th>
            <th>Unit ID</th>
            <th>Unit Inv ID</th>
            <th>Fat</th>
            <th>Protein</th>
            <th>Calories</th>
            <th>Carbohydrate</th>
            <th>Shelf Life</th>
            <th>Storage Tips</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient) => (
            <tr key={ingredient.id}>
              <td>{ingredient.name}</td>
              <td>{ingredient.ingredients_category_id}</td>
              <td>{ingredient.quantity_unit_id}</td>
              <td>{ingredient.quantity_unitInv_id}</td>
              <td>{ingredient.nutritional_info?.fat || ""}</td>
              <td>{ingredient.nutritional_info?.protein || ""}</td>
              <td>{ingredient.nutritional_info?.calories || ""}</td>
              <td>{ingredient.nutritional_info?.carbohydrate || ""}</td>
              <td>{ingredient.pred_shelf_life}</td>
              <td>{ingredient.storage_tips}</td>
              <td>
              <button className="edit-btn" onClick={() => handleEditIngredient(ingredient)}>Edit</button>
              <button className="delete-btn" onClick={() => handleDeleteIngredient(ingredient.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminIngredients = () => {
  const navigate = useNavigate();
    
    const [ingredients, setIngredients] = useState([]);
    const [filteredIngredients, setFilteredIngredients] = useState([]); // For filtered data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // For search functionality
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" }); // Default sorting
    const [page, setPage] = useState(1); // Current page
    const [totalPages, setTotalPages] = useState(1); // Total pages

    const limit = 10; 

    const fetchIngredients = async (pageNumber = 1) => {
        setLoading(true);
        setError(null); // Reset error state before fetching
        try {
            const start = (pageNumber - 1) * limit;
            const end = start + limit - 1;

            const { data, count, error } = await supabase
                .from("ingredients") // Ensure this matches your Supabase table name
                .select("*", { count: "exact" }) // Include count to calculate total pages
                .order(sortConfig.key, { ascending: sortConfig.direction === "asc" })
                .range(start, end); // Paginate results

            if (error) throw error;

            setIngredients(data);
            setFilteredIngredients(data); // Initialize filtered data
            setTotalPages(Math.ceil(count / limit)); // Calculate total pages
        } catch (err) {
            setError("Failed to fetch ingredients.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle search functionality
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        if (term) {
            const filtered = ingredients.filter((ingredient) =>
                ingredient.name.toLowerCase().includes(term)
            );
            setFilteredIngredients(filtered);
        } else {
            setFilteredIngredients(ingredients); // Reset to full list if no search term
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
        fetchIngredients(page);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setPage(newPage);
            fetchIngredients(newPage);
        }
    };

    // Fetch data on component mount and when page changes
    useEffect(() => {
        fetchIngredients(page);
    }, [page]);

    const deleteIngredient = async (id, imagePath) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this ingredient?");
        if (!confirmDelete) return;
    
        try {
            setLoading(true);
    
            // Step 1: Delete the image from Supabase Storage
            const { error: storageError } = await supabase.storage
                .from("ingredient-icons") // Replace with your actual bucket name
                .remove([imagePath]); // Pass the path to the file
    
            if (storageError) {
                console.error("Failed to delete ingredient:", storageError);
                setError("Failed to delete ingredient image.");
                return;
            }
    
            // Step 2: Delete the recipe from the database
            const { error } = await supabase
                .from("ingredients") // Ensure this matches your Supabase table name
                .delete()
                .eq("id", id); // Delete the recipe with the specific ID
    
            if (error) throw error;
    
            setIngredients((prevIngredients) => prevIngredients.filter((ingredient) => ingredient.id !== id));
            setFilteredIngredients((prevFilteredIngredients) =>
                prevFilteredIngredients.filter((ingredient) => ingredient.id !== id)
            );
    
            alert("Ingredient and image deleted successfully.");
        } catch (err) {
            setError("Failed to delete ingredient.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className='admin-ingredients'>
            <h1 style={{ color: "#333" }}>Manage Ingredient</h1>
            <p style={{ color: "#555" }}>View, create, and edit ingredients.</p>

            {/* Search and Refresh */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="Search ingredients..."
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
                    onClick={() => fetchIngredients(page)}
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
                    Create Ingredient
                </button>
            </div>

            {/* Show loading state */}
            {loading && <p>Loading ingredients...</p>}

            {/* Show error state */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Display ingredients */}
            {!loading && !error && filteredIngredients.length > 0 ? (
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
                                <th
                                    onClick={() => handleSort("id")}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    ID {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    onClick={() => handleSort("name")}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Nutritional Info</th>
                                <th
                                    onClick={() => handleSort("pred_shelf_life")}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    Pred Shelf Life {sortConfig.key === "pred_shelf_life" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Image</th>
                                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIngredients.map((ingredient) => (
                                <tr key={ingredient.id}>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{ingredient.id}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{ingredient.name}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        {Object.entries(ingredient.nutritional_info)
                                            .map(([key, value]) => `${key}: ${value}`)
                                            .join(', ')}
                                    </td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{ingredient.pred_shelf_life} mins</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        <img
                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.icon_path}`}
                                            alt={ingredient.name}
                                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                                        />
                                    </td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: "10px",
                                            textAlign: "center",
                                        }}
                                    >

                                        <button
                                            onClick={() => navigate(`/admin/ingredients/view/${ingredient.id}`)}
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
                                            onClick={() => navigate(`/admin/ingredients/edit/${ingredient.id}`)} // Navigate to the edit page
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
                                            // onClick={() => console.log(`Delete ${recipe.id}`)}
                                            onClick={() => deleteIngredient(ingredient.id, ingredient.icon_path)}
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
                !loading && <p>No ingredients found.</p>
            )}
        </div>
  );
};

export default AdminIngredients;
