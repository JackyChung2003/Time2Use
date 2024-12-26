import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";

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
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#333" }}>Manage Categories</h1>
            <p style={{ color: "#555" }}>View, create, and edit recipe categories.</p>

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
                    onClick={fetchCategories}
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
                    onClick={() => navigate("create")} // Navigate to the create category page
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#2196F3",
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
                            <th
                                onClick={() => handleSort("description")}
                                style={{
                                    border: "1px solid #ccc",
                                    padding: "10px",
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                            >
                                Description {sortConfig.key === "description" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                            </th>
                            <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.map((category) => (
                            <tr key={category.id}>
                                <td style={{ border: "1px solid #ccc", padding: "10px" }}>{category.id}</td>
                                <td style={{ border: "1px solid #ccc", padding: "10px" }}>{category.name}</td>
                                <td style={{ border: "1px solid #ccc", padding: "10px" }}>{category.description}</td>
                                <td
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "center",
                                    }}
                                >
                                    <button
                                        // onClick={() => console.log(`Edit ${category.id}`)}
                                        
                                        onClick={() => navigate(`edit/${category.id}`)} // Navigate to the edit page
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
                                        onClick={() => handleDelete(category.id)} // Call delete function
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
            ) : (
                !loading && <p>No categories found.</p>
            )}
        </div>
    );
};

export default Categories;
