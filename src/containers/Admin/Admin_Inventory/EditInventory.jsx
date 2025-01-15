import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const EditInventory = () => {
    const { id } = useParams(); // Get the inventory ID from the URL
    const [userId, setUserId] = useState("");
    const [ingredientId, setIngredientId] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [initQuantity, setInitQuantity] = useState("");
    const [conditionId, setConditionId] = useState(null);
    const [expiryDateId, setExpiryDateId] = useState(null);
    const [expiryDate, setExpiryDate] = useState(""); // To display the expiry date
    const [daysLeft, setDaysLeft] = useState("");
    const [users, setUsers] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [conditions, setConditions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInventoryData = async () => {
            const { data, error } = await supabase
                .from("inventory")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
                console.error("Error fetching inventory data:", error?.message);
                alert("Failed to load inventory data.");
                return;
            }

            setUserId(data.user_id);
            setIngredientId(data.ingredient_id);
            setQuantity(data.quantity);
            setInitQuantity(data.init_quantity);
            setConditionId(data.condition_id);
            setExpiryDateId(data.expiry_date_id);

            // Fetch expiry date details
            const { data: expiryData, error: expiryError } = await supabase
                .from("expiry_date")
                .select("id, date")
                .eq("id", data.expiry_date_id)
                .single();

            if (expiryError || !expiryData) {
                console.error("Error fetching expiry date:", expiryError?.message);
                return;
            }

            setExpiryDate(expiryData.date);

            const currentDate = new Date();
            const expiryDateObj = new Date(expiryData.date);
            const timeDiff = expiryDateObj - currentDate;
            const daysLeftValue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            setDaysLeft(daysLeftValue);
        };

        const fetchDropdownData = async () => {
            const { data: ingredientData } = await supabase
                .from("ingredients")
                .select("id, name");

            const { data: conditionData } = await supabase
                .from("condition")
                .select("id, condition");

            const { data: userData } = await supabase
                .from("profile")
                .select("user, username");

            setIngredients(ingredientData || []);
            setConditions(conditionData || []);
            setUsers(userData || []);
        };

        fetchInventoryData();
        fetchDropdownData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId || !ingredientId || !quantity || !initQuantity || !conditionId || !expiryDateId) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const { error } = await supabase
                .from("inventory")
                .update({
                    user_id: userId,
                    ingredient_id: ingredientId,
                    quantity: parseFloat(quantity),
                    init_quantity: parseFloat(initQuantity),
                    condition_id: conditionId,
                    expiry_date_id: expiryDateId,
                    days_left: daysLeft,
                })
                .eq("id", id);

            if (error) throw error;

            alert("Inventory updated successfully!");
            navigate("/inventory"); // Redirect to inventory list
        } catch (error) {
            console.error("Error updating inventory:", error.message);
            alert("Failed to update inventory.");
        }
    };

    return (
        <div className="edit-inventory-container">
            <h2>Edit Inventory</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>User:</label>
                    <select
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        required
                    >
                        <option value="" disabled>
                            Select a user
                        </option>
                        {users.map((user) => (
                            <option key={user.user} value={user.user}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Ingredient:</label>
                    <select
                        value={ingredientId || ""}
                        onChange={(e) => setIngredientId(parseInt(e.target.value))}
                        required
                    >
                        <option value="" disabled>
                            Select an ingredient
                        </option>
                        {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Quantity:</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Initial Quantity:</label>
                    <input
                        type="number"
                        value={initQuantity}
                        onChange={(e) => setInitQuantity(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Condition:</label>
                    <select
                        value={conditionId || ""}
                        onChange={(e) => setConditionId(parseInt(e.target.value))}
                        required
                    >
                        <option value="" disabled>
                            Select a condition
                        </option>
                        {conditions.map((condition) => (
                            <option key={condition.id} value={condition.id}>
                                {condition.condition}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Expiry Date:</label>
                    <input type="text" value={expiryDate} readOnly />
                </div>

                <div className="form-group">
                    <label>Days Left:</label>
                    <input type="text" value={daysLeft} readOnly />
                </div>

                <button type="submit" className="submit-btn">
                    Update Inventory
                </button>
            </form>
        </div>
    );
};

export default EditInventory;
