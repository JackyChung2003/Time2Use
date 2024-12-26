import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from "../../../../../config/supabaseClient";

import BackButton from "../../../../../components/Button/BackButton";

const RecipeDetail = () => {
    const { id } = useParams(); // Get the recipe ID from the URL
    const navigate = useNavigate(); // Initialize navigate
    const [recipe, setRecipe] = useState(null);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecipeDetails = async () => {
            setLoading(true);
            setError(null);
    
            try {
                // Step 1: Fetch main recipe details
                const { data: recipe, error: recipeError } = await supabase
                    .from("recipes")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (recipeError) throw recipeError;
    
                console.log("Recipe Details:", recipe);
                setRecipe(recipe);
    
                // Step 2: Fetch related categories
                const { data: categories, error: categoryError } = await supabase
                    .from("recipe_category")
                    // .select("category_id, categories(name)")
                    .select("category_id, categories:category_id(name)") // Explicit relationship alias
                    .eq("recipe_id", id);
                if (categoryError) {
                    console.error("Error fetching categories:", categoryError.message);
                    setCategories([]);
                } else {
                    console.log("Categories:", categories);
                    setCategories(categories?.map((c) => c.categories.name) || []);
                }
    
                // Step 3: Fetch related tags
                const { data: tags, error: tagError } = await supabase
                    .from("recipe_tags")
                    .select("tag_id, tags(name)")
                    .eq("recipe_id", id);
                if (tagError) {
                    console.error("Error fetching tags:", tagError.message);
                    setTags([]);
                } else {
                    console.log("Tags:", tags);
                    setTags(tags.map((t) => t.tags.name));
                }
    
                // Step 4: Fetch related equipment
                const { data: equipment, error: equipmentError } = await supabase
                    .from("recipe_equipment")
                    .select("equipment_id, equipment(name)")
                    .eq("recipe_id", id);
                if (equipmentError) {
                    console.error("Error fetching equipment:", equipmentError.message);
                    setEquipment([]);
                } else {
                    console.log("Equipment:", equipment);
                    setEquipment(equipment.map((e) => e.equipment.name));
                }

                // Step 5: Fetch ingredients
                const { data: ingredients, error: ingredientsError } = await supabase
                    .from("recipe_ingredients")
                    .select(`
                        ingredient_id,
                        quantity,
                        ingredients (
                            name,
                            quantity_unit_id
                        )
                    `)
                    .eq("recipe_id", id);

                if (ingredientsError) {
                    console.error("Error fetching ingredients:", ingredientsError.message);
                }

                const { data: units, error: unitsError } = await supabase
                    .from("unit")
                    .select("*");

                if (unitsError) {
                    console.error("Error fetching units:", unitsError.message);
                }

                if (ingredients && units) {
                    const combinedIngredients = ingredients.map((ingredient) => {
                        const unit = units.find((u) => u.id === ingredient.ingredients.quantity_unit_id);
                        return {
                            name: ingredient.ingredients.name,
                            unit: unit?.unit_tag || "N/A", // Use "N/A" if no unit is found
                            quantity: ingredient.quantity,
                        };
                    });
                
                    setIngredients(combinedIngredients);
                    console.log("Combined Ingredients:", combinedIngredients);
                }
            
                // Step 6: Fetch steps
                const { data: steps, error: stepsError } = await supabase
                    .from("steps")
                    .select("*")
                    .eq("recipe_id", id)
                    .order("step_number", { ascending: true });
                if (stepsError) {
                    console.error("Error fetching steps:", stepsError.message);
                    setSteps([]);
                } else {
                    console.log("Steps:", steps);
                    setSteps(steps);
                }
            } catch (err) {
                setError("Failed to fetch recipe details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchRecipeDetails();
    }, [id]);

    const deleteRecipe = async (id, imagePath) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this recipe?");
        if (!confirmDelete) return;

        try {
            setLoading(true);

            // Delete image from Supabase Storage
            const { error: storageError } = await supabase.storage
                .from("recipe-pictures") // Adjust the bucket name as needed
                .remove([imagePath]);

            if (storageError) {
                console.error("Failed to delete image:", storageError);
                setError("Failed to delete recipe image.");
                return;
            }

            // Delete recipe from the database
            const { error: recipeError } = await supabase
                .from("recipes")
                .delete()
                .eq("id", id);

            if (recipeError) throw recipeError;

            alert("Recipe and image deleted successfully.");
            navigate("/admin/recipe-management/recipes"); // Redirect after deletion
        } catch (err) {
            setError("Failed to delete recipe.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <p>Loading recipe...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            {/* Back Button */}
            <BackButton />

            {/* Action Buttons */}
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                    onClick={() => navigate(`/admin/recipe-management/recipes/edit/${id}`)}                    
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#FFA500",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Edit Recipe
                </button>
                <button
                    onClick={() => deleteRecipe(recipe.id, recipe.image_path)} // Pass id and image_path to deleteRecipe
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#f44336",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Delete Recipe
                </button>
            </div>

            <h1>{recipe.name}</h1>
            <p>{recipe.description}</p>
            <p>Preparation Time: {recipe.prep_time} mins</p>
            <p>Cooking Time: {recipe.cook_time} mins</p>
            <p>Total Time: {recipe.prep_time + recipe.cook_time} mins</p>
            {recipe.image_path && (
                <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                    alt={recipe.name}
                    style={{
                        width: "300px",
                        height: "300px",
                        objectFit: "cover",
                        borderRadius: "8px",
                    }}
                />
            )}

            {/* Categories */}
            <h2>Categories</h2>
            <ul>
                {categories.map((category, index) => (
                    <li key={index}>{category}</li>
                ))}
            </ul>

            {/* Tags */}
            <h2>Tags</h2>
            <ul>
                {tags.map((tag, index) => (
                    <li key={index}>{tag}</li>
                ))}
            </ul>

            {/* Equipment */}
            <h2>Equipment</h2>
            <ul>
                {equipment.map((equip, index) => (
                    <li key={index}>{equip}</li>
                ))}
            </ul>

            {/* Ingredients */}
            <h2>Ingredients</h2>
            <ul>
                {ingredients.map((ingredient, index) => (
                    <li key={index}>
                        {ingredient.name} - {ingredient.quantity} {ingredient.unit}
                    </li>
                ))}
            </ul>

            {/* Steps */}
            <h2>Steps</h2>
            <ol>
                {steps.map((step) => (
                    <li key={step.step_number}>{step.instruction}</li>
                ))}
            </ol>
        </div>
    );
};

export default RecipeDetail;
