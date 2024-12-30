import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import SortableIngredientList from "../../../../../components/SortableDragAndDrop/Ingredient_List";

import BackButton from "../../../../../components/Button/BackButton";

const EditRecipe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [originalFormData, setOriginalFormData] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        prep_time: "",
        cook_time: "",
        total_time: 0,
        category_ids: [],
        tag_ids: [],
        equipment_ids: [],
        ingredients: [{ name: "", quantity: "", unit: "" }],
        steps: [{ id: null, description: "" }],
        image: null,
        image_path: "",
    });
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: recipe, error: recipeError } = await supabase
                    .from("recipes")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (recipeError) throw recipeError;

                const { data: categories } = await supabase.from("category").select("*");
                const { data: tags } = await supabase.from("tags").select("*").order("name", { ascending: true });
                const { data: equipment } = await supabase.from("equipment").select("*");
                const { data: recipeIngredients } = await supabase
                    .from("recipe_ingredients")
                    .select(`
                        ingredient_id,
                        quantity,
                        ingredients (
                            name,
                            quantity_unit_id,
                            icon_path,
                            unit:unit!ingredients_quantity_unit_id_fkey (
                                unit_tag
                            )
                        )
                    `)
                    .eq("recipe_id", id);

                // console.log("Recipe Ingredients:", recipeIngredients);
                const { data: steps } = await supabase
                    .from("steps")
                    .select("*")
                    .eq("recipe_id", id)
                    .order("step_number", { ascending: true });
                const { data: recipeTags } = await supabase.from("recipe_tags").select("tag_id").eq("recipe_id", id);
                const { data: recipeEquipment } = await supabase.from("recipe_equipment").select("equipment_id").eq("recipe_id", id);
                const { data: recipeCategories } = await supabase.from("recipe_category").select("category_id").eq("recipe_id", id);

                const populatedFormData = {
                    name: recipe.name,
                    description: recipe.description,
                    prep_time: recipe.prep_time,
                    cook_time: recipe.cook_time,
                    total_time: recipe.prep_time + recipe.cook_time,
                    image_path: recipe.image_path,
                    steps: steps.map((step) => ({ id: step.id, description: step.instruction })),
                    category_ids: recipeCategories.map((category) => category.category_id),
                    tag_ids: recipeTags.map((tag) => tag.tag_id),
                    equipment_ids: recipeEquipment.map((equip) => equip.equipment_id),
                };
                setFormData(populatedFormData);
                setOriginalFormData(populatedFormData);

                setIngredients(
                    recipeIngredients.map((ingredient, index) => ({
                        id: ingredient.ingredient_id,
                        name: ingredient.ingredients.name,
                        quantity: ingredient.quantity,
                        ingredient_id: ingredient.ingredient_id,
                        unit: ingredient.ingredients.unit ? ingredient.ingredients.unit.unit_tag : null,
                        image: ingredient.ingredients.icon_path
                        ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.ingredients.icon_path}`
                        : null,
                        position: index + 1, // Assign a position for drag-and-drop
                    }))
                );

                setCategories(categories || []);
                setTags(tags || []);
                setEquipment(equipment || []);
                setSelectedTags(recipeTags.map((tag) => tag.tag_id));
                setSelectedEquipment(recipeEquipment.map((equip) => equip.equipment_id));
                setSelectedCategories(recipeCategories.map((category) => category.category_id));
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            total_time: Number(prev.prep_time || 0) + Number(prev.cook_time || 0),
        }));
    }, [formData.prep_time, formData.cook_time]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleIngredientUpdate = (updatedIngredients) => {
        setIngredients(updatedIngredients);
        console.log("Updated Ingredients in edit:", updatedIngredients);
    };

    const handleStepChange = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            steps: prev.steps.map((step, i) =>
                i === index ? { ...step, description: value } : step
            ),
        }));
    };

    const addStep = () => {
        setFormData((prev) => ({
            ...prev,
            steps: [...prev.steps, { id: null, description: "" }],
        }));
    };

    const removeStep = (index) => {
        setFormData((prev) => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
    };

    const handleAddSelection = (selected, setter, item) => {
        if (!selected.includes(item.id)) {
            setter([...selected, item.id]);
        }
    };

    const handleRemoveSelection = (selected, setter, itemId) => {
        setter(selected.filter((id) => id !== itemId));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update recipe in the database
            const { error: recipeError } = await supabase
                .from("recipes")
                .update({
                    name: formData.name,
                    description: formData.description,
                    prep_time: formData.prep_time,
                    cook_time: formData.cook_time,
                    image_path: formData.image_path,
                })
                .eq("id", id);
    
            if (recipeError) throw recipeError;
    
            // Update steps: add new, update existing, and delete removed
            for (const [index, step] of formData.steps.entries()) {
                if (step.id) {
                    // Update existing step
                    const { error: updateError } = await supabase
                        .from("steps")
                        .update({
                            instruction: step.description,
                            step_number: index + 1,
                        })
                        .eq("id", step.id);
                    if (updateError) throw updateError;
                } else {
                    // Add new step
                    const { error: insertError } = await supabase
                        .from("steps")
                        .insert({
                            recipe_id: id,
                            instruction: step.description,
                            step_number: index + 1,
                        });
                    if (insertError) throw insertError;
                }
            }
    
            // Remove deleted steps
            const originalStepIds = originalFormData.steps.map((step) => step.id);
            const currentStepIds = formData.steps.map((step) => step.id);
            const deletedStepIds = originalStepIds.filter(
                (id) => id && !currentStepIds.includes(id)
            );
    
            for (const stepId of deletedStepIds) {
                const { error: deleteError } = await supabase
                    .from("steps")
                    .delete()
                    .eq("id", stepId);
                if (deleteError) throw deleteError;
            }
    
            // Handle categories, tags, and equipment
            const updateAssociations = async (table, field, values) => {
                await supabase.from(table).delete().eq("recipe_id", id);
    
                if (values.length > 0) {
                    const entries = values.map((value) => ({ recipe_id: id, [field]: value }));
                    const { error: insertError } = await supabase.from(table).insert(entries);
                    if (insertError) throw insertError;
                }
            };
    
            await updateAssociations("recipe_category", "category_id", selectedCategories);
            await updateAssociations("recipe_tags", "tag_id", selectedTags);
            await updateAssociations("recipe_equipment", "equipment_id", selectedEquipment);
                                
            // Handle ingredients: add new, update existing, and delete removed
            for (const ingredient of ingredients) {
                if (ingredient.ingredient_id) {
                    // Upsert ingredient
                    const { error: upsertError } = await supabase
                        .from("recipe_ingredients")
                        .upsert({
                            recipe_id: id,
                            ingredient_id: ingredient.ingredient_id,
                            quantity: ingredient.quantity,
                        }, { onConflict: ['recipe_id', 'ingredient_id'] }); // Specify conflict resolution
                    if (upsertError) throw upsertError;
                } else {
                    console.error("Ingredient missing ingredient_id:", ingredient);
                }
            }
                
            // Remove deleted ingredients
            const originalIngredientIds = originalFormData?.ingredients?.map(
                (ingredient) => ingredient.ingredient_id
            ) || [];

            const currentIngredientIds = ingredients.map(
                (ingredient) => ingredient.ingredient_id
            );
            const deletedIngredientIds = originalIngredientIds.filter(
                (id) => id && !currentIngredientIds.includes(id)
            );

            for (const ingredientId of deletedIngredientIds) {
                const { error: deleteError } = await supabase
                    .from("recipe_ingredients")
                    .delete()
                    .eq("recipe_id", id)
                    .eq("ingredient_id", ingredientId);
                if (deleteError) throw deleteError;
            }
    
            alert("Recipe updated successfully!");
            // Navigate to recipe view page
            navigate(`/admin/recipe-management/recipes/view/${id}`);
        } catch (err) {
            console.error("Error saving recipe:", err);
            alert("Failed to save recipe.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancel = () => {
        setFormData(originalFormData);
        navigate(-1);
    };

    if (loading) return <p>Loading recipe...</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            {/* Back Button */}
            <BackButton />
            <h1>Edit Recipe</h1>

            {/* Recipe Information */}
            <div>
                <label>Recipe Name:</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    style={{ width: "100%", margin: "5px 0", padding: "10px" }}
                />

                <label>Description:</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    style={{ width: "100%", margin: "5px 0", padding: "10px" }}
                />

                <label>Image:</label>
                <input
                    type="file"
                    onChange={(e) => handleChange("image", e.target.files[0])}
                    style={{ width: "100%", margin: "5px 0", padding: "10px" }}
                />
            </div>

            {/* Preparation Details */}
            <div>
                <label>Preparation Time (mins):</label>
                <input
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) => handleChange("prep_time", e.target.value)}
                />

                <label>Cooking Time (mins):</label>
                <input
                    type="number"
                    value={formData.cook_time}
                    onChange={(e) => handleChange("cook_time", e.target.value)}
                />

                <label>Total Time (mins):</label>
                <input type="number" value={formData.total_time} readOnly />
            </div>

            {/* Categories */}
            <h2>Categories</h2>
            <select
                onChange={(e) => {
                    const categoryId = Number(e.target.value);
                    const category = categories.find((c) => c.id === categoryId);
                    if (category) handleAddSelection(selectedCategories, setSelectedCategories, category);
                    e.target.value = "";
                }}
            >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </select>

            <div>
                <h3>Selected Categories:</h3>
                {selectedCategories.map((categoryId) => {
                    const category = categories.find((c) => c.id === categoryId);
                    return category ? (
                        <div key={categoryId}>
                            {category.name} {" "}
                            <button
                                onClick={() => handleRemoveSelection(selectedCategories, setSelectedCategories, categoryId)}
                            >
                                Remove
                            </button>
                        </div>
                    ) : null;
                })}
            </div>

            {/* Tags */}
            <h2>Tags</h2>
            <select
                onChange={(e) => {
                    const tagId = Number(e.target.value);
                    const tag = tags.find((t) => t.id === tagId);
                    if (tag) handleAddSelection(selectedTags, setSelectedTags, tag);
                    e.target.value = "";
                }}
            >
                <option value="">Select a tag...</option>
                {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                        {tag.name}
                    </option>
                ))}
            </select>

            <div>
                <h3>Selected Tags:</h3>
                {selectedTags.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    return tag ? (
                        <div key={tagId}>
                            {tag.name} {" "}
                            <button
                                onClick={() => handleRemoveSelection(selectedTags, setSelectedTags, tagId)}
                            >
                                Remove
                            </button>
                        </div>
                    ) : null;
                })}
            </div>

            {/* Equipment */}
            <h2>Equipment</h2>
            <select
                onChange={(e) => {
                    const equipmentId = Number(e.target.value);
                    const equip = equipment.find((e) => e.id === equipmentId);
                    if (equip) handleAddSelection(selectedEquipment, setSelectedEquipment, equip);
                    e.target.value = "";
                }}
            >
                <option value="">Select equipment...</option>
                {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>

            <div>
                <h3>Selected Equipment:</h3>
                {selectedEquipment.map((equipmentId) => {
                    const equip = equipment.find((e) => e.id === equipmentId);
                    return equip ? (
                        <div key={equipmentId}>
                            {equip.name} {" "}
                            <button
                                onClick={() =>
                                    handleRemoveSelection(selectedEquipment, setSelectedEquipment, equipmentId)
                                }
                            >
                                Remove
                            </button>
                        </div>
                    ) : null;
                })}
            </div>

            {/* Ingredients Section */}
            <div style={{ padding: "20px" }}>
                <h2>Ingredients</h2>
                <SortableIngredientList
                    initialIngredients={ingredients}
                    onIngredientUpdate={handleIngredientUpdate}
                />
            </div>

            {/* Steps Section */}
            <div style={{ marginTop: "20px" }}>
                <h2>Steps</h2>
                {formData.steps.map((step, index) => (
                    <div
                        key={index}
                        style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
                    >
                        <textarea
                            value={step.description}
                            onChange={(e) => handleStepChange(index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            style={{
                                width: "90%",
                                padding: "10px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                marginRight: "10px",
                            }}
                        />
                        <button
                            onClick={() => removeStep(index)}
                            style={{
                                background: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "5px 10px",
                                cursor: "pointer",
                            }}
                        >
                            Remove
                        </button>
                    </div>
                ))}
                <button
                    onClick={addStep}
                    style={{
                        marginTop: "10px",
                        padding: "10px 20px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    + Add Step
                </button>
            </div>

            <div style={{ marginTop: "20px" }}>
                <button
                    onClick={handleSave}
                    style={{
                        marginRight: "10px",
                        padding: "10px 20px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    Save
                </button>
                <button
                    onClick={handleCancel}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default EditRecipe;
