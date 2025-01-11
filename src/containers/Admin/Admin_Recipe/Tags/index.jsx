import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";
import "./index.css";

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
        <div className="manage-tags-container">
            <h1 className="manage-tags-title">Manage Tags</h1>
            <p className="manage-tags-description">View, create, and edit recipe tags.</p>
    
            {/* Search and Refresh */}
            <div className="manage-tags-actions">
                <input
                    type="text"
                    placeholder="Search tags..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                />
                <button onClick={fetchTags} className="button-primary">
                    Refresh
                </button>
                <button onClick={() => navigate("create")} className="button-primary">
                    Create Tag
                </button>
            </div>
    
            {/* Show loading state */}
            {loading && <p className="loading-text">Loading tags...</p>}
    
            {/* Show error state */}
            {error && <p className="error-text">{error}</p>}
    
            {/* Display tags */}
            {!loading && !error && filteredTags.length > 0 ? (
                <table className="tags-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort("id")} className="sortable-header">
                                ID {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                            </th>
                            <th onClick={() => handleSort("name")} className="sortable-header">
                                Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="actions-header">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTags.map((tag) => (
                            <tr key={tag.id}>
                                <td className="table-cell">{tag.id}</td>
                                <td className="table-cell">{tag.name}</td>
                                <td className="table-cell actions-cell">
                                    <button onClick={() => navigate(`edit/${tag.id}`)} className="button-edit">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(tag.id)} className="button-delete">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                !loading && <p className="no-tags-text">No tags found.</p>
            )}
        </div>
    );
    
};

export default Tags;
