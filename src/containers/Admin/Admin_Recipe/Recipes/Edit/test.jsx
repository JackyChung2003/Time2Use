import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from "../../../../../config/supabaseClient";
import SortableIngredientList from "../../../../../components/SortableDragAndDrop/Ingredient_List";

const EditRecipe = () => {
    const { id } = useParams(); // Get the recipe ID from the URL
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        prep_time: "",
        cook_time: "",
        total_time: 0,
        steps: [{ description: "" }],
        image: null,
        image_path: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch existing recipe data and populate form
    useEffect(() => {
        const fetchRecipeDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch the recipe
                const { data: recipe, error: recipeError } = await supabase
                    .from("recipes")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (recipeError) throw recipeError;

                // Fetch related categories
                const { data: categories } = await supabase
                    .from("recipe_category")
                    .select("category_id, categories:category_id(name)")
                    .eq("recipe_id", id);

                // Fetch related tags
                const { data: tags } = await supabase
                    .from("recipe_tags")
                    .select("tag_id, tags(name)")
                    .eq("recipe_id", id);

                // Fetch related equipment
                const { data: equipment } = await supabase
                    .from("recipe_equipment")
                    .select("equipment_id, equipment(name)")
                    .eq("recipe_id", id);

                // Fetch ingredients
                const { data: ingredients } = await supabase
                    .from("recipe_ingredients")
                    .select(`ingredient_id, quantity, ingredients (name, quantity_unit_id)`)
                    .eq("recipe_id", id);

                

                // Fetch steps
                const { data: steps } = await supabase
                    .from("steps")
                    .select("*")
                    .eq("recipe_id", id)
                    .order("step_number", { ascending: true });

                // Fetch all categories, tags, and equipment for dropdowns
                const { data: allCategories } = await supabase.from("category").select("*");
                const { data: allTags } = await supabase.from("tags").select("*");
                const { data: allEquipment } = await supabase.from("equipment").select("*");

                // Populate form
                setFormData({
                    ...recipe,
                    steps: steps.map((step) => ({ description: step.instruction })),
                    total_time: recipe.prep_time + recipe.cook_time,
                });
                setSelectedCategories(categories.map((c) => ({ id: c.category_id, name: c.categories.name })));
                setSelectedTags(tags.map((t) => ({ id: t.tag_id, name: t.tags.name })));
                setSelectedEquipment(equipment.map((e) => ({ id: e.equipment_id, name: e.equipment.name })));
                setIngredients(
                    ingredients.map((i) => ({
                        name: i.ingredients.name,
                        quantity: i.quantity,
                        unit: i.ingredients.quantity_unit_id,
                    }))
                );

                setCategories(allCategories || []);
                setTags(allTags || []);
                setEquipment(allEquipment || []);
            } catch (err) {
                setError("Failed to fetch recipe details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipeDetails();
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

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let imagePath = formData.image_path;

            if (formData.image) {
                const fileName = `${id}-${formData.image.name}`;
                const { data, error } = await supabase.storage
                    .from("recipe-pictures")
                    .upload(fileName, formData.image);
                if (error) throw error;
                imagePath = `recipe-pictures/${data.path}`;
            }

            const { error } = await supabase
                .from("recipes")
                .update({
                    ...formData,
                    image_path: imagePath,
                })
                .eq("id", id);

            if (error) throw error;

            alert("Recipe updated successfully!");
            navigate("/recipes");
        } catch (err) {
            console.error("Error updating recipe:", err.message);
            alert("Failed to update recipe.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading recipe...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Edit Recipe</h1>

            {/* Recipe Form */}
            <label>Recipe Name:</label>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
            />

            <label>Description:</label>
            <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
            />

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

            {/* Ingredients */}
            <SortableIngredientList
                initialIngredients={ingredients}
                onIngredientUpdate={(updated) => setIngredients(updated)}
            />
            <h2>Ingredients</h2>
            {ingredients.map((ingredient, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                    <input
                        type="text"
                        placeholder="Ingredient Name"
                        value={ingredient.name}
                        onChange={(e) => {
                            const updatedIngredients = [...ingredients];
                            updatedIngredients[index].name = e.target.value;
                            setIngredients(updatedIngredients);
                        }}
                        style={{ marginRight: "10px", padding: "5px", width: "30%" }}
                    />
                    <input
                        type="number"
                        placeholder="Quantity"
                        value={ingredient.quantity}
                        onChange={(e) => {
                            const updatedIngredients = [...ingredients];
                            updatedIngredients[index].quantity = e.target.value;
                            setIngredients(updatedIngredients);
                        }}
                        style={{ marginRight: "10px", padding: "5px", width: "20%" }}
                    />
                    <input
                        type="text"
                        placeholder="Unit"
                        value={ingredient.unit}
                        onChange={(e) => {
                            const updatedIngredients = [...ingredients];
                            updatedIngredients[index].unit = e.target.value;
                            setIngredients(updatedIngredients);
                        }}
                        style={{ marginRight: "10px", padding: "5px", width: "20%" }}
                    />
                    <button
                        onClick={() => {
                            const updatedIngredients = ingredients.filter((_, i) => i !== index);
                            setIngredients(updatedIngredients);
                        }}
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
                onClick={() => {
                    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
                }}
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
                + Add Ingredient
            </button>


            {/* Steps */}
            <h2>Steps</h2>
            {formData.steps.map((step, index) => (
                <div key={index}>
                    <textarea
                        value={step.description}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                steps: prev.steps.map((s, i) =>
                                    i === index ? { description: e.target.value } : s
                                ),
                            }))
                        }
                    />
                </div>
            ))}

            <button onClick={handleSubmit}>Update Recipe</button>
        </div>
    );
};

export default EditRecipe;
