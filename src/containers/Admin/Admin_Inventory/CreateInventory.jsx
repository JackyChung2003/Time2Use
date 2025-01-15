import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const CreateInventory = () => {
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
        const fetchDropdownData = async () => {
            const { data: ingredientData, error: ingredientError } = await supabase
                .from("ingredients")
                .select("id, name");

            const { data: conditionData, error: conditionError } = await supabase
                .from("condition")
                .select("id, condition");

            const { data: userData, error: userError } = await supabase
                .from("profile")
                .select("user, username");

            if (ingredientError || conditionError || userError) {
                console.error("Error fetching dropdown data:", ingredientError || conditionError || userError);
            } else {
                setIngredients(ingredientData || []);
                setConditions(conditionData || []);
                setUsers(userData || []);
            }
        };

        fetchDropdownData();
    }, []);

    const handleUserChange = (selectedUserId) => {
        setUserId(selectedUserId);
    };

    const handleIngredientChange = async (selectedIngredientId) => {
        setIngredientId(selectedIngredientId);

        try {
            const { data: expiryData, error: expiryError } = await supabase
                .from("ingredients_expiry")
                .select("date_id")
                .eq("ingredients_id", selectedIngredientId)
                .order("date_id", { ascending: false })
                .limit(1);

            if (expiryError || !expiryData || expiryData.length === 0) {
                throw new Error("No expiry data found for the selected ingredient.");
            }

            const dateId = expiryData[0].date_id;

            const { data: dateData, error: dateError } = await supabase
                .from("expiry_date")
                .select("id, date")
                .eq("id", dateId)
                .single();

            if (dateError || !dateData) {
                throw new Error("No date found for the given date ID.");
            }

            setExpiryDateId(dateData.id); // Store the ID
            setExpiryDate(dateData.date); // Display the date

            const currentDate = new Date();
            const expiryDateObj = new Date(dateData.date);
            const timeDiff = expiryDateObj - currentDate;
            const daysLeftValue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            setDaysLeft(daysLeftValue);
        } catch (error) {
            console.error("Error retrieving expiry date or calculating days left:", error.message);
            setExpiryDateId(null);
            setExpiryDate(""); // Clear expiry date
            setDaysLeft("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId || !ingredientId || !quantity || !initQuantity || !conditionId || !expiryDateId) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            const { error: insertError } = await supabase.from("inventory").insert({
                user_id: userId,
                ingredient_id: ingredientId,
                quantity: parseFloat(quantity),
                init_quantity: parseFloat(initQuantity),
                condition_id: conditionId,
                expiry_date_id: expiryDateId,
                days_left: daysLeft,
            });

            if (insertError) throw insertError;

            alert("Inventory added successfully!");
            resetForm();
        } catch (error) {
            console.error("Error adding inventory:", error.message);
            alert("Failed to add inventory.");
        }
    };

    const resetForm = () => {
        setUserId("");
        setIngredientId(null);
        setQuantity("");
        setInitQuantity("");
        setConditionId(null);
        setExpiryDateId(null);
        setExpiryDate(""); // Reset expiry date
        setDaysLeft("");
    };

    return (
        <div className="create-inventory-container">
            <h2>Add New Inventory</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>User:</label>
                    <select
                        value={userId}
                        onChange={(e) => handleUserChange(e.target.value)}
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
                        onChange={(e) => handleIngredientChange(parseInt(e.target.value))}
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
                    Add Inventory
                </button>
            </form>
        </div>
    );
};

export default CreateInventory;
