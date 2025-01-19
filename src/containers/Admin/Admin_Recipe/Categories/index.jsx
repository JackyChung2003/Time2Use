import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";
import "./index.css";
import CommonLoader from "../../../../components/Loader/CommonLoader";

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]); // For filtered data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // For search functionality
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" }); // For sorting
    const navigate = useNavigate(); // Initialize navigate function

    // Fetch categories from Supabase
    // Fetch categories from Supabase
    const fetchCategories = async () => {
        setLoading(true);
        setError(null); // Reset error state before fetching
        try {
            const { data, error } = await supabase
                .from("category")
                .select("*")
                .order("id", { ascending: true }); // Fetch categories sorted by ID

            if (error) throw error;

            setCategories(data);
            setFilteredCategories(data); // Initialize filtered data
        } catch (err) {
            setError("Failed to fetch categories.");
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
            const filtered = categories.filter(
                (category) =>
                    category.name.toLowerCase().includes(term) ||
                    category.description.toLowerCase().includes(term)
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

        const sortedCategories = [...filteredCategories].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === "asc" ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        setFilteredCategories(sortedCategories);
    };

    // Handle delete functionality
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this category?");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            // Step 1: Delete the category from Supabase
            const { error } = await supabase
                .from("category") // Ensure this matches your Supabase table name
                .delete()
                .eq("id", id); // Delete the category with the specific ID

            if (error) throw error;

            // Step 2: Update the local state
            setCategories((prevCategories) =>
                prevCategories.filter((category) => category.id !== id)
            );
            setFilteredCategories((prevFilteredCategories) =>
                prevFilteredCategories.filter((category) => category.id !== id)
            );

            alert("Category deleted successfully!");
        } catch (err) {
            console.error("Failed to delete category:", err);
            setError("Failed to delete category.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <div className="categories-container">
            <h1 className="categories-title">Manage Categories</h1>
            <p className="categories-description">View, create, and edit recipe categories.</p>
    
            {/* Search and Refresh */}
            <div className="categories-controls">
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="categories-search"
                />
                <button
                    onClick={fetchCategories}
                    className="categories-refresh-button"
                >
                    Refresh
                </button>
                <button
                    onClick={() => navigate("create")}
                    className="categories-create-button"
                >
                    Create Category
                </button>
            </div>
    
            {/* Show loading state */}
            {loading &&  <CommonLoader />}
            {/* {loading && <p className="categories-loading">Loading categories...</p>} */}
    
            {/* Show error state */}
            {error && <p className="categories-error">{error}</p>}
    
            {/* Display categories */}
            {!loading && !error && filteredCategories.length > 0 ? (
                <table className="categories-table">
                    <thead>
                        <tr className="categories-table-header-row">
                            <th
                                onClick={() => handleSort("id")}
                                className="categories-table-header"
                            >
                                ID {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}
                            </th>
                            <th
                                onClick={() => handleSort("name")}
                                className="categories-table-header"
                            >
                                Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}
                            </th>
                            <th
                                onClick={() => handleSort("description")}
                                className="categories-table-header"
                            >
                                Description {sortConfig.key === "description" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}
                            </th>
                            <th className="categories-table-header actions-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.map((category) => (
                            <tr key={category.id} className="categories-table-row">
                                <td className="categories-table-cell">{category.id}</td>
                                <td className="categories-table-cell">{category.name}</td>
                                <td className="categories-table-cell">{category.description}</td>
                                <td className="categories-table-cell actions-cell">
                                    <button
                                        onClick={() => navigate(`edit/${category.id}`)}
                                        className="categories-action-button categories-edit-button"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="categories-action-button categories-delete-button"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                !loading && <p className="categories-empty">No categories found.</p>
            )}
        </div>
    );
    
};

export default Categories;
