import { useState, useEffect } from "react";
import supabase from "../../../../../config/supabaseClient";
import SortableIngredientList from "../../../../../components/SortableDragAndDrop/Ingredient_List";

const CreateRecipe = () => {
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]); // All tags from Supabase
    const [selectedTags, setSelectedTags] = useState([]); // Selected tags
    const [newTag, setNewTag] = useState(""); // For adding new tags dynamically
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]); // Selected equipment
    const [newEquipment, setNewEquipment] = useState(""); // For adding new equipment dynamically
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        prep_time: "",
        cook_time: "",
        total_time: 0,
        category_id: "",
        tag_ids: [],
        equipment_ids: [],
        ingredients: [{ name: "", quantity: "", unit: "" }],
        steps: [{ description: "" }],
        image: null,
    });
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [ingredients, setIngredients] = useState([]);

    // Fetch data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            const { data: categories } = await supabase.from("category").select("*");
            const { data: tags } = await supabase.from("tags").select("*").order("name", { ascending: true });
            const { data: equipment } = await supabase.from("equipment").select("*");

            setCategories(categories);
            setTags(tags);
            setEquipment(equipment);
        };

        fetchData();
    }, []);

    // Auto-calculate total time
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            total_time: Number(prev.prep_time || 0) + Number(prev.cook_time || 0),
        }));
    }, [formData.prep_time, formData.cook_time]);

    // Add new category
    const handleAddCategory = async () => {
        if (newCategory.trim() === "") return;

        const { data, error } = await supabase.from("category").insert({ name: newCategory });
        if (error) {
            console.error("Error adding category:", error);
        } else {
            setCategories((prev) => [...prev, data[0]]);
            setIsCategoryModalOpen(false);
            setNewCategory("");
        }
    };

    // Add new tag/equipment dynamically
    const handleAddDynamicItem = async (table, name, setter) => {
        if (!name.trim()) return;
        const { data, error } = await supabase.from(table).insert({ name }).select();
        if (error) {
            console.error(`Error adding ${table}:`, error);
        } else {
            setter((prev) => [...prev, ...data]);
            if (table === "tags") setNewTag("");
            if (table === "equipment") setNewEquipment("");
        }
    };

    // Add selected tag or equipment
    const handleAddSelection = (selected, setter, item) => {
        if (!selected.some((selectedItem) => selectedItem.id === item.id)) {
            setter([...selected, item]);
        }
    };

    // Remove selected tag or equipment
    const handleRemoveSelection = (selected, setter, itemId) => {
        setter(selected.filter((item) => item.id !== itemId));
    };

    const handleIngredientUpdate = (updatedIngredients) => {
        setIngredients(updatedIngredients);
      };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Create New Recipe</h1>

            {/* Recipe Information */}
            <div>
                <label>Recipe Name:</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: "100%", margin: "5px 0", padding: "10px" }}
                />

                <label>Description:</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: "100%", margin: "5px 0", padding: "10px" }}
                />

                <label>Image:</label>
                <input
                    type="file"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                />
            </div>

            {/* Preparation Details */}
            <div>
                <label>Preparation Time (mins):</label>
                <input
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                />

                <label>Cooking Time (mins):</label>
                <input
                    type="number"
                    value={formData.cook_time}
                    onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                />

                <label>Total Time (mins):</label>
                <input type="number" value={formData.total_time} readOnly />
            </div>

            {/* Category Selection */}
            <h2>Category</h2>
            <div>
                <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                <button onClick={() => setIsCategoryModalOpen(true)}>+ Add New Category</button>
            </div>

            {/* Tags */}
            <h2>Tags</h2>
            <select
                onChange={(e) => {
                    const tagId = Number(e.target.value);
                    const tag = tags.find((t) => t.id === tagId);
                    if (tag) handleAddSelection(selectedTags, setSelectedTags, tag);
                    e.target.value = ""; // Reset dropdown
                }}
            >
                <option value="">Select a tag...</option>
                {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                        {tag.name}
                    </option>
                ))}
            </select>

            {/* Selected Tags */}
            <div>
                <h3>Selected Tags:</h3>
                {selectedTags.map((tag) => (
                    <div key={tag.id}>
                        {tag.name}{" "}
                        <button onClick={() => handleRemoveSelection(selectedTags, setSelectedTags, tag.id)}>
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            {/* Equipment */}
            <h2>Equipment</h2>
            <select
                onChange={(e) => {
                    const equipmentId = Number(e.target.value);
                    const equip = equipment.find((e) => e.id === equipmentId);
                    if (equip) handleAddSelection(selectedEquipment, setSelectedEquipment, equip);
                    e.target.value = ""; // Reset dropdown
                }}
            >
                <option value="">Select equipment...</option>
                {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>

            {/* Selected Equipment */}
            <div>
                <h3>Selected Equipment:</h3>
                {selectedEquipment.map((equip) => (
                    <div key={equip.id}>
                        {equip.name}{" "}
                        <button
                            onClick={() =>
                                handleRemoveSelection(selectedEquipment, setSelectedEquipment, equip.id)
                            }
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal for Adding New Category */}
            {isCategoryModalOpen && (
                <div>
                    <h2>Add New Category</h2>
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button onClick={handleAddCategory}>Add</button>
                    <button onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                </div>
            )}

            {/* Submit and Cancel Buttons */}
            <div>
                <button type="submit">Submit</button>
                <button type="button" onClick={() => console.log("Cancel")}>
                    Cancel
                </button>
            </div>

            <div style={{ padding: "20px" }}>
                <h1>Create Recipe</h1>
                <SortableIngredientList
                    initialIngredients={ingredients}
                    onIngredientUpdate={handleIngredientUpdate}
                />
                <button
                    style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    }}
                    onClick={() => console.log("Ingredients:", ingredients)}
                >
                    Save Recipe
                </button>
            </div>
        </div>
    );
};

export default CreateRecipe;
