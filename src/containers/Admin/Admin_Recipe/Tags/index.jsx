import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";

const Tags = () => {
    const [tags, setTags] = useState([]);
    const [filteredTags, setFilteredTags] = useState([]); // For filtered data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // For search functionality
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" }); // For sorting
    const navigate = useNavigate(); // Initialize navigate function

    // Fetch tags from Supabase
    const fetchTags = async () => {
        setLoading(true);
        setError(null); // Reset error state before fetching
        try {
            const { data, error } = await supabase
                .from("tags") // Ensure this matches your Supabase table name
                .select("*")
                .order("id", { ascending: true }); // Fetch tags sorted by ID

            if (error) throw error;

            setTags(data);
            setFilteredTags(data); // Initialize filtered data
        } catch (err) {
            setError("Failed to fetch tags.");
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
            const filtered = tags.filter((tag) =>
                tag.name.toLowerCase().includes(term)
            );
            setFilteredTags(filtered);
        } else {
            setFilteredTags(tags); // Reset to full list if no search term
        }
    };

    // Handle sorting functionality
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedTags = [...filteredTags].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === "asc" ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        setFilteredTags(sortedTags);
    };

    // Handle delete functionality
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this tag?");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from("tags") // Ensure this matches your Supabase table name
                .delete()
                .eq("id", id); // Delete the tag with the specific ID

            if (error) throw error;

            // Update the local state
            setTags((prevTags) => prevTags.filter((tag) => tag.id !== id));
            setFilteredTags((prevFilteredTags) =>
                prevFilteredTags.filter((tag) => tag.id !== id)
            );

            alert("Tag deleted successfully!");
        } catch (err) {
            console.error("Failed to delete tag:", err);
            setError("Failed to delete tag.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchTags();
    }, []);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#333" }}>Manage Tags</h1>
            <p style={{ color: "#555" }}>View, create, and edit recipe tags.</p>

            {/* Search and Refresh */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="Search tags..."
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
                    onClick={fetchTags}
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
                    onClick={() => navigate("create")} // Navigate to the create tag page
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#2196F3",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Create Tag
                </button>
            </div>

            {/* Show loading state */}
            {loading && <p>Loading tags...</p>}

            {/* Show error state */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Display tags */}
            {!loading && !error && filteredTags.length > 0 ? (
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
                            <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTags.map((tag) => (
                            <tr key={tag.id}>
                                <td style={{ border: "1px solid #ccc", padding: "10px" }}>{tag.id}</td>
                                <td style={{ border: "1px solid #ccc", padding: "10px" }}>{tag.name}</td>
                                <td
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "center",
                                    }}
                                >
                                    <button
                                        onClick={() => navigate(`edit/${tag.id}`)} // Navigate to the edit page
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
                                        onClick={() => handleDelete(tag.id)} // Call delete function
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
                !loading && <p>No tags found.</p>
            )}
        </div>
    );
};

export default Tags;
