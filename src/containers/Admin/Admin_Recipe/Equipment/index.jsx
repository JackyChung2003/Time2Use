import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";

const Equipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [filteredEquipment, setFilteredEquipment] = useState([]); // For filtered data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // For search functionality
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" }); // For sorting
    const navigate = useNavigate(); // Navigation function for Create and Edit

    // Fetch equipment from Supabase
    const fetchEquipment = async () => {
        setLoading(true);
        setError(null); // Reset error state before fetching
        try {
            const { data, error } = await supabase
                .from("equipment")
                .select("*")
                .order("id", { ascending: true }); // Fetch equipment sorted by ID

            if (error) throw error;

            setEquipment(data);
            setFilteredEquipment(data); // Initialize filtered data
        } catch (err) {
            setError("Failed to fetch equipment.");
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
            const filtered = equipment.filter((item) =>
                item.name.toLowerCase().includes(term)
            );
            setFilteredEquipment(filtered);
        } else {
            setFilteredEquipment(equipment); // Reset to full list if no search term
        }
    };

    // Handle sorting functionality
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedEquipment = [...filteredEquipment].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === "asc" ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === "asc" ? 1 : -1;
            }
            return 0;
        });
        setFilteredEquipment(sortedEquipment);
    };

    // Handle delete functionality
    const deleteEquipment = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this equipment?");
        if (!confirmDelete) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from("equipment")
                .delete()
                .eq("id", id);

            if (error) throw error;

            // Update the state to remove the deleted equipment
            setEquipment((prev) => prev.filter((item) => item.id !== id));
            setFilteredEquipment((prev) => prev.filter((item) => item.id !== id));
            alert("Equipment deleted successfully.");
        } catch (err) {
            setError("Failed to delete equipment.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchEquipment();
    }, []);

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#333" }}>Manage Equipment</h1>
            <p style={{ color: "#555" }}>View, create, and edit equipment items.</p>

            {/* Search and Refresh */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="Search equipment..."
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
                    onClick={fetchEquipment}
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
                    onClick={() => navigate("create")} // Navigate to the Create Equipment page
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#007BFF",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Create Equipment
                </button>
            </div>

            {/* Show loading state */}
            {loading && <p>Loading equipment...</p>}

            {/* Show error state */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Display equipment */}
            {!loading && !error && filteredEquipment.length > 0 ? (
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
                        {filteredEquipment.map((item) => (
                            <tr key={item.id}>
                                <td style={{ border: "1px solid #ccc", padding: "10px" }}>{item.id}</td>
                                <td style={{ border: "1px solid #ccc", padding: "10px" }}>{item.name}</td>
                                <td
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "center",
                                    }}
                                >
                                    <button
                                        onClick={() => navigate(`edit/${item.id}`)} // Navigate to the Edit Equipment page
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
                                        onClick={() => deleteEquipment(item.id)} // Delete equipment
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
                !loading && <p>No equipment found.</p>
            )}
        </div>
    );
};

export default Equipment;
