import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from '../../../config/supabaseClient';

import BackButton from "../../../components/Button/BackButton";

const ViewIngredient = () => {
    const { id } = useParams();
    const navigate = useNavigate(); 
    const [ingredient, setIngredient] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIngredientDetails = async () => {
            setLoading(true);
            setError(null);
    
            try {

                const { data: ingredients, error: ingredientsError } = await supabase
                    .from("ingredients")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (ingredientsError) throw ingredientsError;
    
                setIngredient(ingredients);
    
                // Step 2: Fetch related categories
                const { data: categories, error: categoriesError } = await supabase
                    .from("ingredients_category")
                    .select("*");
                if (categoriesError) {
                    console.error("Error fetching categories:", categoriesError.message);
                    setCategories([]);
                } else {
                    setCategories(categories?.map((c) => c.category_name) || []);
                }
                


                if (Array.isArray(ingredients) && Array.isArray(categories)) {
                    const combinedIngredients = ingredients.map((ingredient) => {
                        const details = categories.find((u) => u.id === ingredient.ingredients_category_id);
                        return {
                            icon: ingredient.icon_path,
                            name: ingredient.name,
                            nutritional_info: ingredient.nutritional_info,
                            pred_shelf_life: ingredient.pred_shelf_life,
                            storage_tips: ingredient.storage_tips,
                            category: details?.categories.category_name || "N/A", // Use "N/A" if no category is found
                        };
                    });
                
                    setIngredient(combinedIngredients);
                    console.log("Combined Ingredients:", combinedIngredients);
                }
            
            } catch (err) {
                setError("Failed to fetch ingredient details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchIngredientDetails();
    }, [id]);

    const deleteIngredient = async (id, imagePath) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this ingredient?");
        if (!confirmDelete) return;

        try {
            setLoading(true);

            // Delete image from Supabase Storage
            const { error: storageError } = await supabase.storage
                .from("ingredient-icons") // Adjust the bucket name as needed
                .remove([imagePath]);

            if (storageError) {
                console.error("Failed to delete icon:", storageError);
                setError("Failed to delete ingredient icon.");
                return;
            }

            // Delete ingredient from the database
            const { error: ingredientError } = await supabase
                .from("ingredients")
                .delete()
                .eq("id", id);

            if (ingredientError) throw ingredientError;

            alert("Ingredient and image deleted successfully.");
            navigate("/admin/ingredients"); // Redirect after deletion
        } catch (err) {
            setError("Failed to delete ingredient.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <p>Loading ingredient...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            {/* Back Button */}
            <BackButton />

            {/* Action Buttons */}
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                    onClick={() => navigate(`/admin/ingredients/edit/${id}`)}                    
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#FFA500",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Edit Ingredient
                </button>
                <button
                    onClick={() => deleteIngredient(ingredient.id, ingredient.ico)} // Pass id and image_path to deleteRecipe
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#f44336",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Delete Ingredient
                </button>
            </div>

            <h1>{ingredient.name}</h1>
            <p><span style={{ fontWeight: 'bold' }}>Nutritional Info:</span> {Object.entries(ingredient.nutritional_info)
                                            .map(([key, value]) => `${key}: ${value}`)
                                            .join(', ')}</p>
            <p><span style={{ fontWeight: 'bold' }}>Pred Shelf Life:</span> {ingredient.pred_shelf_life} </p>
            <p><span style={{ fontWeight: 'bold' }}>Category:</span> {ingredient.category_name} </p>
            {ingredient.icon_path && (
                <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.icon_path}`}
                    alt={ingredient.name}
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

export default ViewIngredient;
