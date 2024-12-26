import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";

const Recipes = () => {
    const navigate = useNavigate();
    
    const [recipes, setRecipes] = useState([]);
    const [filteredRecipes, setFilteredRecipes] = useState([]); // For filtered data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // For search functionality
    const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" }); // Default sorting
    const [page, setPage] = useState(1); // Current page
    const [totalPages, setTotalPages] = useState(1); // Total pages

    const limit = 10; // Number of recipes per page

    // Fetch recipes from Supabase
    const fetchRecipes = async (pageNumber = 1) => {
        setLoading(true);
        setError(null); // Reset error state before fetching
        try {
            const start = (pageNumber - 1) * limit;
            const end = start + limit - 1;

            const { data, count, error } = await supabase
                .from("recipes") // Ensure this matches your Supabase table name
                .select("*", { count: "exact" }) // Include count to calculate total pages
                .order(sortConfig.key, { ascending: sortConfig.direction === "asc" })
                .range(start, end); // Paginate results

            if (error) throw error;

            setRecipes(data);
            setFilteredRecipes(data); // Initialize filtered data
            setTotalPages(Math.ceil(count / limit)); // Calculate total pages
        } catch (err) {
            setError("Failed to fetch recipes.");
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
            const filtered = recipes.filter((recipe) =>
                recipe.name.toLowerCase().includes(term) ||
                recipe.description.toLowerCase().includes(term)
            );
            setFilteredRecipes(filtered);
        } else {
            setFilteredRecipes(recipes); // Reset to full list if no search term
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
        fetchRecipes(page);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setPage(newPage);
            fetchRecipes(newPage);
        }
    };

    // Fetch data on component mount and when page changes
    useEffect(() => {
        fetchRecipes(page);
    }, [page]);

    const deleteRecipe = async (id, imagePath) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this recipe?");
        if (!confirmDelete) return;
    
        try {
            setLoading(true);
    
            // Step 1: Delete the image from Supabase Storage
            const { error: storageError } = await supabase.storage
                .from("recipe-pictures") // Replace with your actual bucket name
                .remove([imagePath]); // Pass the path to the file
    
            if (storageError) {
                console.error("Failed to delete image:", storageError);
                setError("Failed to delete recipe image.");
                return;
            }
    
            // Step 2: Delete the recipe from the database
            const { error } = await supabase
                .from("recipes") // Ensure this matches your Supabase table name
                .delete()
                .eq("id", id); // Delete the recipe with the specific ID
    
            if (error) throw error;
    
            // Update the recipes state to remove the deleted recipe
            setRecipes((prevRecipes) => prevRecipes.filter((recipe) => recipe.id !== id));
            setFilteredRecipes((prevFilteredRecipes) =>
                prevFilteredRecipes.filter((recipe) => recipe.id !== id)
            );
    
            alert("Recipe and image deleted successfully.");
        } catch (err) {
            setError("Failed to delete recipe.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#333" }}>Manage Recipes</h1>
            <p style={{ color: "#555" }}>View, create, and edit recipes.</p>

            {/* Search and Refresh */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="Search recipes..."
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
                    onClick={() => fetchRecipes(page)}
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
                    Create Recipe
                </button>
            </div>

            {/* Show loading state */}
            {loading && <p>Loading recipes...</p>}

            {/* Show error state */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Display recipes */}
            {!loading && !error && filteredRecipes.length > 0 ? (
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
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Description</th>
                                <th
                                    onClick={() => handleSort("prep_time")}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    Prep Time {sortConfig.key === "prep_time" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    onClick={() => handleSort("cook_time")}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cook Time {sortConfig.key === "cook_time" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th
                                    onClick={() => handleSort("created_at")}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    Created At {sortConfig.key === "created_at" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Image</th>
                                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecipes.map((recipe) => (
                                <tr key={recipe.id}>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{recipe.id}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{recipe.name}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{recipe.description}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{recipe.prep_time} mins</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{recipe.cook_time} mins</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{new Date(recipe.created_at).toLocaleString()}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        <img
                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                                            alt={recipe.name}
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
                                            onClick={() => navigate(`view/${recipe.id}`)} // Navigate to the detail page
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
                                            onClick={() => navigate(`edit/${recipe.id}`)} // Navigate to the edit page
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
                                            onClick={() => deleteRecipe(recipe.id, recipe.image_path)}
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
                !loading && <p>No recipes found.</p>
            )}
        </div>
    );
};

export default Recipes;
