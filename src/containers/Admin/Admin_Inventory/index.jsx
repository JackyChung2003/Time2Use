import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';

const AdminInventories = () => {
  const navigate = useNavigate();
    
    const [inventories, setInventories] = useState([]);
    const [filteredInventories, setFilteredInventories] = useState([]); // For filtered data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // For search functionality
    const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" }); // Default sorting
    const [page, setPage] = useState(1); // Current page
    const [totalPages, setTotalPages] = useState(1); // Total pages

    const limit = 10; 

    const fetchInventories = async (pageNumber = 1) => {
        setLoading(true);
        setError(null); // Reset error state before fetching
        try {
            const start = (pageNumber - 1) * limit;
            const end = start + limit - 1;

            const { data: inventories, error: inventoriesError, count } = await supabase
                .from("inventory") // Ensure this matches your Supabase table name
                .select("*, ingredients:ingredient_id(name)", { count: "exact" }) // Include count to calculate total pages
                .order(sortConfig.key, { ascending: sortConfig.direction === "asc" })
                .range(start, end); // Paginate results

            if (inventoriesError) throw inventoriesError;

            const { data: expiryDates, error: expiryDatesError } = await supabase
                .from("expiry_date")
                .select("id, date");

            if (expiryDatesError) throw expiryDatesError;

            const { data: freshness, error: freshnessError } = await supabase
                .from("freshness_status")
                .select("id, status_color")
            
            if (freshnessError) throw freshnessError;

            const { data: conditions, error: conditionsError } = await supabase
                .from("condition")
                .select("id, condition");

            if (conditionsError) throw conditionsError;

            const combinedData = inventories.map(inventory => {
                // Find matching category
                const invExpiryDate = expiryDates.find(cat => cat.id === inventory.expiry_date_id);
                const invFreshness = freshness.find(sup => sup.id === inventory.freshness_status_id);
                const invCondition = conditions.find(nut => nut.id === inventory.condition_id);

                return {
                    ...inventory,
                    ingredientName: inventory.ingredients?.name || "Unknown",
                    ingredient_expirydate: invExpiryDate ? invExpiryDate.date : null,
                    ingredient_freshness: invFreshness ? invFreshness.status_color : null,
                    ingredient_condition: invCondition ? invCondition.condition : null,
                };
            });

            setInventories(combinedData);
            setFilteredInventories(combinedData); // Initialize filtered data
            setTotalPages(Math.ceil(count / limit)); // Calculate total pages
        } catch (err) {
            setError("Failed to fetch inventories.");
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
            const filtered = inventories.filter((inventory) =>
                inventory.name.toLowerCase().includes(term)
            );
            setFilteredInventories(filtered);
        } else {
            setFilteredInventories(inventories); // Reset to full list if no search term
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
        fetchInventories(page);
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setPage(newPage);
            fetchInventories(newPage);
        }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true,
        }).format(date);
    };

    // Fetch data on component mount and when page changes
    useEffect(() => {
        fetchInventories(page);
    }, [page]);

    const deleteInventory = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this inventory?");
        if (!confirmDelete) return;
    
        try {
            setLoading(true);
    
            const { error } = await supabase
                .from("inventory") // Ensure this matches your Supabase table name
                .delete()
                .eq("id", id); 
    
            if (error) throw error;
    
            setInventories((prevInventories) => prevInventories.filter((inventory) => inventory.id !== id));
            setFilteredInventories((prevFilteredInventories) =>
                prevFilteredInventories.filter((inventory) => inventory.id !== id)
            );
    
            alert("Inventory and image deleted successfully.");
        } catch (err) {
            setError("Failed to delete inventory.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className='admin-ingredients'>
            <h1 style={{ color: "#333" }}>Manage Inventory</h1>
            <p style={{ color: "#555" }}>View, create, and edit ingredients.</p>

            {/* Search and Refresh */}
            <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    placeholder="Search inventories..."
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
                    onClick={() => fetchInventories(page)}
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
                    Create Inventory
                </button>
            </div>

            {/* Show loading state */}
            {loading && <p>Loading inventories...</p>}

            {/* Show error state */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {/* Display ingredients */}
            {!loading && !error && filteredInventories.length > 0 ? (
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
                                    onClick={() => handleSort("ingredientName")}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "10px",
                                        textAlign: "left",
                                        cursor: "pointer",
                                    }}
                                >
                                    Ingredient Name {sortConfig.key === "ingredientName" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Quantity</th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Initial Quantity</th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Days Left</th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Expiry Date</th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Freshness Status</th>
                                <th style={{ border: "1px solid #ccc", padding: "10px" }}>Condition</th>
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
                                <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventories.map((inventory) => (
                                <tr key={inventory.id}>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{inventory.id}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{inventory.ingredientName}</td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        {inventory.quantity}
                                    </td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        {inventory.init_quantity}
                                    </td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        {inventory.days_left}
                                    </td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        {inventory.ingredient_expirydate}
                                    </td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        {inventory.ingredient_freshness}
                                    </td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>
                                        {inventory.ingredient_condition}
                                    </td>
                                    <td style={{ border: "1px solid #ccc", padding: "10px" }}>{formatDate(inventory.created_at)}</td>
                                    <td
                                        style={{
                                            border: "1px solid #ccc",
                                            padding: "10px",
                                            textAlign: "center",
                                        }}
                                    >

                                        <button
                                            onClick={() => navigate(`/admin/inventories/view/${inventory.id}`)}
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
                                            onClick={() => navigate(`/admin/inventories/edit/${inventory.id}`)} // Navigate to the edit page
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
                                            onClick={() => deleteInventory(inventory.id)}
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
                !loading && <p>No inventories found.</p>
            )}
        </div>
  );
};

export default AdminInventories;
