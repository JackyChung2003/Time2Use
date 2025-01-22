import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from "../../../config/supabaseClient";

import BackButton from "../../../components/Button/BackButton";

const ViewInventory = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [inventory, setInventory] = useState(null);
    const [ingredient, setIngredient] = useState(null);
    const [profile, setProfile] = useState(null);
    const [expiryDate, setExpiryDate] = useState(null);
    const [freshnessStatus, setFreshnessStatus] = useState(null);
    const [condition, setCondition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInventoryDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch the inventory details based on the provided id
                const { data: inventoryData, error: inventoryError } = await supabase
                    .from("inventory")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (inventoryError) throw inventoryError;

                setInventory(inventoryData);

                // Fetch ingredient name
                const { data: ingredientData, error: ingredientError } = await supabase
                    .from("ingredients")
                    .select("name")
                    .eq("id", inventoryData.ingredient_id)
                    .single();

                setIngredient(ingredient);

                // Fetch user profile details
                const { data: profileData, error: profileError } = await supabase
                    .from("profile")
                    .select("username")
                    .eq("user", inventoryData.user_id)
                    .single();
                if (profileError) throw profileError;

                setProfile(profileData);

                if (!inventoryData?.expiry_date_id) {
                    setExpiryDate({ date: 0 }); // Set to 0 if expiry_date_id is missing
                } else {
                    // Fetch expiry date from expiry_date table
                    const { data: expiryDateData, error: expiryDateError } = await supabase
                        .from("expiry_date")
                        .select("date")
                        .eq("id", inventoryData.expiry_date_id)
                        .single();
                    if (expiryDateError) throw expiryDateError;

                    setExpiryDate(expiryDateData);
                }

                // Fetch freshness status based on expiry date
                const { data: freshnessData, error: freshnessError } = await supabase
                    .from("freshness_status")
                    .select("status_color")
                    .eq("id", inventoryData.freshness_status_id)
                    .single();
                if (freshnessError) throw freshnessError;

                setFreshnessStatus(freshnessData);

                const { data: conditionData, error: conditionError } = await supabase
                    .from("condition")
                    .select("condition")
                    .eq("id", inventoryData.condition_id)
                    .single();
                if (conditionError) throw conditionError;

                setCondition(conditionData);

            } catch (err) {
                setError("Failed to fetch inventory details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInventoryDetails();
    }, [id]);

    const deleteInventory = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this inventory?");
        if (!confirmDelete) return;

        try {
            setLoading(true);

            // Delete inventory from the database
            const { error: inventoryError } = await supabase
                .from("inventory")
                .delete()
                .eq("id", id);

            if (inventoryError) throw inventoryError;

            alert("Inventory deleted successfully.");
            navigate("/admin/inventories"); // Redirect after deletion
        } catch (err) {
            setError("Failed to delete inventory.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading inventory...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            {/* Back Button */}
            <BackButton />

            {/* Action Buttons */}
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                    onClick={() => navigate(`/admin/inventories/edit/${id}`)} // Navigate to the edit page
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#FFA500",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Edit Inventory
                </button>
                <button
                    onClick={() => deleteInventory(inventory.id)} // Pass id to deleteInventory
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#f44336",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Delete Inventory
                </button>
            </div>

            <h1>{inventory.name}</h1>
            <p><span style={{ fontWeight: 'bold' }}>Quantity:</span> {inventory.quantity}</p>
            <p><span style={{ fontWeight: 'bold' }}>Initial Quantity:</span> {inventory.init_quantity}</p>
            {ingredient && <p><span style={{ fontWeight: 'bold' }}>Ingredient Name:</span> {ingredient.name}</p>}
            {profile && <p><span style={{ fontWeight: 'bold' }}>Added by:</span> {profile.username}</p>}
            <p><span style={{ fontWeight: 'bold' }}>Expiry Date:</span> {expiryDate.expiry_date}</p>
            <p><span style={{ fontWeight: 'bold' }}>Days Left:</span> {inventory.days_left}</p>
            {freshnessStatus && <p><span style={{ fontWeight: 'bold' }}>Freshness Status:</span> <span style={{ color: freshnessStatus.status_color }}>{freshnessStatus.status_color}</span></p>}
            <p><span style={{ fontWeight: 'bold' }}>Condition:</span> {condition.condition}</p> 

            {inventory.icon_path && (
                <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${inventory.icon_path}`}
                    alt={inventory.name}
                    style={{
                        width: "300px",
                        height: "300px",
                        objectFit: "cover",
                        borderRadius: "8px",
                    }}
                />
            )}
        </div>
    );
};

export default ViewInventory;
