import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../../config/supabaseClient";
import "./EditIngredient.css";

const EditIngredient = () => {
    const { id } = useParams(); // Get ingredient ID from URL params
    const [ingredientName, setIngredientName] = useState("");
    const [icon, setIcon] = useState(null);
    const [nutritionalInfo, setNutritionalInfo] = useState({
        fat: "",
        protein: "",
        calories: "",
        carbohydrate: "",
    });
    const [predShelfLife, setPredShelfLife] = useState("");
    const [storageTips, setStorageTips] = useState("");
    const [ingredientCategories, setIngredientCategories] = useState([]);
    const [quantityUnits, setQuantityUnits] = useState([]);
    const [inventoryUnits, setInventoryUnits] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [selectedUnitInvId, setSelectedUnitInvId] = useState(null);
    const [currentIconPath, setCurrentIconPath] = useState(""); // To display existing icon
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch ingredient data and dropdown options
        const fetchIngredientData = async () => {
            try {
                // Fetch ingredient details
                const { data: ingredient, error: ingredientError } = await supabase
                    .from("ingredients")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (ingredientError) throw ingredientError;

                // Populate form with existing data
                setIngredientName(ingredient.name);
                setNutritionalInfo(ingredient.nutritional_info || {});
                setPredShelfLife(ingredient.pred_shelf_life);
                setStorageTips(ingredient.storage_tips);
                setSelectedCategoryId(ingredient.ingredients_category_id);
                setSelectedUnitId(ingredient.quantity_unit_id);
                setSelectedUnitInvId(ingredient.quantity_unitInv_id);
                setCurrentIconPath(ingredient.icon_path);

                // Fetch dropdown data
                const { data: categories, error: catError } = await supabase
                    .from("ingredients_category")
                    .select("id, category_name");

                const { data: units, error: unitError } = await supabase
                    .from("unit")
                    .select("id, unit_description");

                const { data: unitInvs, error: unitInvsError } = await supabase
                    .from("unitInv")
                    .select("id, unitInv_tag");

                if (catError || unitError || unitInvsError) {
                    console.error("Error fetching dropdown data:", catError || unitError || unitInvsError);
                } else {
                    setIngredientCategories(categories || []);
                    setQuantityUnits(units || []);
                    setInventoryUnits(unitInvs || []);
                }
            } catch (error) {
                console.error("Error fetching ingredient data:", error.message);
            }
        };

        fetchIngredientData();
    }, [id]);

    // Handle file change
    const handleFileChange = (e) => {
        setIcon(e.target.files[0]);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!ingredientName || !selectedCategoryId || !selectedUnitId) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            let iconPath = currentIconPath;

            // Upload new icon if provided
            if (icon) {
                const { data: iconUploadData, error: iconError } = await supabase.storage
                    .from("ingredient-icons")
                    .upload(`icons/${icon.name}`, icon, { upsert: true });

                if (iconError) throw iconError;

                iconPath = iconUploadData.path;
            }

            // Update ingredient in the database
            const { error: updateError } = await supabase
                .from("ingredients")
                .update({
                    name: ingredientName,
                    icon_path: iconPath,
                    nutritional_info: nutritionalInfo,
                    pred_shelf_life: predShelfLife,
                    storage_tips: storageTips,
                    ingredients_category_id: selectedCategoryId,
                    quantity_unit_id: selectedUnitId,
                    quantity_unitInv_id: selectedUnitInvId,
                })
                .eq("id", id);

            if (updateError) throw updateError;

            alert("Ingredient updated successfully!");
            navigate("/admin/ingredients"); // Redirect to ingredient list
        } catch (error) {
            console.error("Error updating ingredient:", error.message);
            alert("Failed to update ingredient.");
        }
    };

    return (
        <div className="edit-ingredient-container">
            <div className="admin-content">
                <div className="edit-ingredient-container">
                    <h2>Edit Ingredient</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Ingredient Name:</label>
                            <input
                                type="text"
                                value={ingredientName}
                                onChange={(e) => setIngredientName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Current Icon:</label>
                            {currentIconPath && (
                                <img
                                    src={`${supabase.storage.from("ingredient-icons").getPublicUrl(currentIconPath).publicURL}`}
                                    alt="Current Icon"
                                    className="current-icon"
                                />
                            )}
                            <label>New Icon (optional):</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                        </div>

                        <div className="form-group">
                            <label>Nutritional Info:</label>
                            <input
                                type="text"
                                placeholder="Fat"
                                value={nutritionalInfo.fat}
                                onChange={(e) =>
                                    setNutritionalInfo((prev) => ({ ...prev, fat: e.target.value }))
                                }
                            />
                            <input
                                type="text"
                                placeholder="Protein"
                                value={nutritionalInfo.protein}
                                onChange={(e) =>
                                    setNutritionalInfo((prev) => ({ ...prev, protein: e.target.value }))
                                }
                            />
                            <input
                                type="text"
                                placeholder="Calories"
                                value={nutritionalInfo.calories}
                                onChange={(e) =>
                                    setNutritionalInfo((prev) => ({ ...prev, calories: e.target.value }))
                                }
                            />
                            <input
                                type="text"
                                placeholder="Carbohydrate"
                                value={nutritionalInfo.carbohydrate}
                                onChange={(e) =>
                                    setNutritionalInfo((prev) => ({
                                        ...prev,
                                        carbohydrate: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Predicted Shelf Life:</label>
                            <input
                                type="text"
                                value={predShelfLife}
                                onChange={(e) => setPredShelfLife(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Storage Tips:</label>
                            <textarea
                                value={storageTips}
                                onChange={(e) => setStorageTips(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Ingredient Category:</label>
                            <select
                                value={selectedCategoryId || ""}
                                onChange={(e) => setSelectedCategoryId(e.target.value)}
                                required
                            >
                                <option value="" disabled>
                                    Select a category
                                </option>
                                {ingredientCategories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.category_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Quantity Unit:</label>
                            <select
                                value={selectedUnitId || ""}
                                onChange={(e) => setSelectedUnitId(e.target.value)}
                                required
                            >
                                <option value="" disabled>
                                    Select a unit
                                </option>
                                {quantityUnits.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.unit_description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Inventory Unit:</label>
                            <select
                                value={selectedUnitInvId || ""}
                                onChange={(e) => setSelectedUnitInvId(e.target.value)}
                                required
                            >
                                <option value="" disabled>
                                    Select an inventory unit
                                </option>
                                {inventoryUnits.map((unitInv) => (
                                    <option key={unitInv.id} value={unitInv.id}>
                                        {unitInv.unitInv_tag}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="submit-btn">
                            Update Ingredient
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditIngredient;
