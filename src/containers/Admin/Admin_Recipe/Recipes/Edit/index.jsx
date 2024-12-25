import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import SortableIngredientList from "../../../../../components/SortableDragAndDrop/Ingredient_List";

const EditRecipe = () => {
    const { id } = useParams(); // Get recipe ID from the URL
    const navigate = useNavigate(); // Navigation hook
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [originalFormData, setOriginalFormData] = useState(null); // Store original data
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

    // Fetch data for dropdowns and populate the form
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch recipe details
                const { data: recipe, error: recipeError } = await supabase
                    .from("recipes")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (recipeError) throw recipeError;

                // Fetch categories
                const { data: categories } = await supabase.from("category").select("*");

                // Fetch tags
                const { data: tags } = await supabase
                    .from("tags")
                    .select("*")
                    .order("name", { ascending: true });

                // Fetch equipment
                const { data: equipment } = await supabase.from("equipment").select("*");

                // Fetch related ingredients
                const { data: recipeIngredients } = await supabase
                    .from("recipe_ingredients")
                    .select("ingredient_id, quantity, ingredients (name, quantity_unit_id)")
                    .eq("recipe_id", id);

                // Fetch steps
                const { data: steps } = await supabase
                    .from("steps")
                    .select("*")
                    .eq("recipe_id", id)
                    .order("step_number", { ascending: true });

                // Populate form data
                const populatedFormData = {
                    name: recipe.name,
                    description: recipe.description,
                    prep_time: recipe.prep_time,
                    cook_time: recipe.cook_time,
                    total_time: recipe.prep_time + recipe.cook_time,
                    image_path: recipe.image_path,
                    steps: steps.map((step) => ({ id: step.id, description: step.instruction })),
                };
                setFormData(populatedFormData);
                setOriginalFormData(populatedFormData); // Store original data for cancel

                // Populate ingredients
                setIngredients(
                    recipeIngredients.map((ingredient) => ({
                        ingredient_id: ingredient.ingredient_id,
                        name: ingredient.ingredients.name,
                        quantity: ingredient.quantity,
                        unit: ingredient.ingredients.quantity_unit_id,
                    }))
                );

                // Set dropdown data
                setCategories(categories || []);
                setTags(tags || []);
                setEquipment(equipment || []);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Auto-calculate total time
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

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update recipe in the database
            const { error } = await supabase
                .from("recipes")
                .update({
                    name: formData.name,
                    description: formData.description,
                    prep_time: formData.prep_time,
                    cook_time: formData.cook_time,
                    image_path: formData.image_path,
                })
                .eq("id", id);

            if (error) throw error;

            // Handle steps (update, add, or delete)
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

            alert("Recipe updated successfully!");
            navigate(`/recipes/${id}`); // Redirect to recipe detail page
        } catch (err) {
            console.error("Error saving recipe:", err);
            alert("Failed to save recipe.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Revert to original data
        setFormData(originalFormData);
        navigate(`/recipes/${id}`); // Redirect to recipe detail page
    };

    if (loading) return <p>Loading recipe...</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
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
