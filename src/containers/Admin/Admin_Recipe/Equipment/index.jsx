import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";
import "./index.css";

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
        <div className="manage-equipment-container">
            <h1 className="manage-equipment-title">Manage Equipment</h1>
            <p className="manage-equipment-description">View, create, and edit equipment items.</p>
    
            {/* Search and Refresh */}
            <div className="manage-equipment-actions">
                <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                />
                <button onClick={fetchEquipment} className="button-primary">
                    Refresh
                </button>
                <button onClick={() => navigate("create")} className="button-primary">
                    Create Equipment
                </button>
            </div>
    
            {/* Show loading state */}
            {loading && <p className="loading-text">Loading equipment...</p>}
    
            {/* Show error state */}
            {error && <p className="error-text">{error}</p>}
    
            {/* Display equipment */}
            {!loading && !error && filteredEquipment.length > 0 ? (
                <table className="equipment-table">
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
                        {filteredEquipment.map((item) => (
                            <tr key={item.id}>
                                <td className="table-cell">{item.id}</td>
                                <td className="table-cell">{item.name}</td>
                                <td className="table-cell actions-cell">
                                    <button onClick={() => navigate(`edit/${item.id}`)} className="button-edit">
                                        Edit
                                    </button>
                                    <button onClick={() => deleteEquipment(item.id)} className="button-delete">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                !loading && <p className="no-equipment-text">No equipment found.</p>
            )}
        </div>
    );
    
};

export default Equipment;
