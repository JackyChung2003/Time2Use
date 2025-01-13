import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";
import "./index.css";
import CommonLoader from "../../../../components/Loader/CommonLoader";

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
        <div className="recipes-container">
            <h1 className="recipes-title">Manage Recipes</h1>
            <p className="recipes-description">View, create, and edit recipes.</p>

            {/* Search and Refresh */}
            <div className="recipes-controls">
                <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="recipes-search"
                />
                <button
                    onClick={() => fetchRecipes(page)}
                    className="recipes-refresh-button"
                >
                    Refresh
                </button>
                <button
                    onClick={() => navigate("create")} // Navigate to the create page
                    className="recipes-create-button"
                >
                    Create Recipe
                </button>
            </div>

            {/* Show loading state */}
            {loading &&  <CommonLoader />}

            {/* Show error state */}
            {error && <p className="recipes-error">{error}</p>}

            {/* Display recipes */}
            {!loading && !error && filteredRecipes.length > 0 ? (
                <>
                    <table className="recipes-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("id")} className="recipes-table-header">ID {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}</th>
                                <th onClick={() => handleSort("name")} className="recipes-table-header">Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}</th>
                                <th className="recipes-table-header">Description</th>
                                <th onClick={() => handleSort("prep_time")} className="recipes-table-header">Prep Time {sortConfig.key === "prep_time" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}</th>
                                <th onClick={() => handleSort("cook_time")} className="recipes-table-header">Cook Time {sortConfig.key === "cook_time" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}</th>
                                <th onClick={() => handleSort("created_at")} className="recipes-table-header">Created At {sortConfig.key === "created_at" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}</th>
                                <th className="recipes-table-header">Image</th>
                                <th className="recipes-table-header">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecipes.map((recipe) => (
                                <tr key={recipe.id} className="recipes-table-row">
                                    <td>{recipe.id}</td>
                                    <td>{recipe.name}</td>
                                    <td>{recipe.description}</td>
                                    <td>{recipe.prep_time} mins</td>
                                    <td>{recipe.cook_time} mins</td>
                                    <td>{new Date(recipe.created_at).toLocaleString()}</td>
                                    <td>
                                        <img
                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                                            alt={recipe.name}
                                            className="recipes-image"
                                        />
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => navigate(`view/${recipe.id}`)}
                                            className="recipes-action-button recipes-view-button"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => navigate(`edit/${recipe.id}`)}
                                            className="recipes-action-button recipes-edit-button"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deleteRecipe(recipe.id, recipe.image_path)}
                                            className="recipes-action-button recipes-delete-button"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="recipes-pagination">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalPages}</span>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages}
                            className="pagination-button"
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
