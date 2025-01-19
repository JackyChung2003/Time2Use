import React, { useEffect,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './CreateIngredient.css';

const CreateIngredient = () => {
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
    const navigate = useNavigate();

    useEffect(() => {

        const fetchDropdownData = async () => {
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
                console.error("Error fetching dropdown data:", catError || unitError);
            } else {
                setIngredientCategories(categories || []);
                setQuantityUnits(units || []);
                setInventoryUnits(unitInvs || []);
            }
        };

        fetchDropdownData();
    }, [navigate]);

    // Handle file change
    const handleFileChange = (e) => {
        setIcon(e.target.files[0]);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!ingredientName || !icon || !selectedCategoryId || !selectedUnitId) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            // Upload the icon
            const { data: iconUploadData, error: iconError } = await supabase.storage
                .from("ingredient-icons")
                .upload(`${`icons/${icon.name}`}`, icon, { upsert: true });

            if (iconError) throw iconError;

            const iconPath = iconUploadData.path;

            // Insert ingredient into the database
            const { error: insertError } = await supabase.from("ingredients").insert({
                name: ingredientName,
                icon_path: iconPath,
                nutritional_info: nutritionalInfo,
                pred_shelf_life: predShelfLife,
                storage_tips: storageTips,
                ingredients_category_id: selectedCategoryId,
                quantity_unit_id: selectedUnitId,
                quantity_unitInv_id: selectedUnitInvId,
            });

            if (insertError) throw insertError;

            alert("Ingredient added successfully!");
            resetForm();
        } catch (error) {
            console.error("Error adding ingredient:", error.message);
            alert("Failed to add ingredient.");
        }
    };

    // Reset form fields
    const resetForm = () => {
        setIngredientName("");
        setIcon(null);
        setNutritionalInfo({ fat: "", protein: "", calories: "", carbohydrate: "" });
        setPredShelfLife("");
        setStorageTips("");
        setSelectedCategoryId(null);
        setSelectedUnitId(null);
    };

    return (
        <div className='create-ingredient-container'>
            <div className="admin-content">
                <div className="create-ingredient-container">
                    <h2>Add New Ingredient</h2>
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
                            <label>Icon (Image):</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} required />
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
                            Add Ingredient
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateIngredient;
