import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from '../../../config/supabaseClient';

import BackButton from "../../../components/Button/BackButton";

const ViewIngredient = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tempIngredient, setTempIngredient] = useState(null);
    const [ingredient, setIngredient] = useState(null);
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

                setTempIngredient(ingredients);

                const { data: categories, error: categoriesError } = await supabase
                    .from("ingredients_category")
                    .select("*");

                if (categoriesError) throw categoriesError;

                const { data: units, error: unitsError } = await supabase
                    .from("unit")
                    .select("*");

                if (unitsError) throw unitsError;

                const { data: unitInvs, error: unitInvsError } = await supabase
                    .from("unitInv")
                    .select("*");

                if (unitInvsError) throw unitInvsError;

                const category = categories.find((c) => c.id === ingredients.ingredients_category_id);
                const unit = units.find((u) => u.id === ingredients.quantity_unit_id);
                const unitInv = unitInvs.find((u) => u.id === ingredients.quantity_unitInv_id);

                // Create a combined ingredient object
                const combinedIngredient = {
                    icon: ingredients.icon_path ? ingredients.icon_path : null,
                    name: ingredients.name,
                    nutritional_info: ingredients.nutritional_info ? ingredients.nutritional_info : null ,
                    pred_shelf_life: ingredients.pred_shelf_life ? ingredients.pred_shelf_life : null,
                    storage_tips: ingredients.storage_tips ? ingredients.storage_tips : null,
                    ingredient_category: category ? category.category_name : null,
                    ingredient_unit: unit ? unit.unit_description : null,
                    ingredient_unitInv: unitInv ? unitInv.unitInv_tag : null,
                };

                console.log("Combined Ingredients:", combinedIngredient);

                setIngredient(combinedIngredient);
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
                    onClick={() => deleteIngredient(ingredient.id, ingredient.icon_path)} // Pass id and image_path to deleteRecipe
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
            <p><span style={{ fontWeight: 'bold' }}>Storage Tips:</span> {ingredient.storage_tips} </p>
            <p><span style={{ fontWeight: 'bold' }}>Category:</span> {ingredient.ingredient_category} </p>
            <p><span style={{ fontWeight: 'bold' }}>Unit:</span> {ingredient.ingredient_unit} </p>
            <p><span style={{ fontWeight: 'bold' }}>Inventory Unit:</span> {ingredient.ingredient_unitInv} </p>
            <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${tempIngredient.icon_path}`}
                    alt={ingredient.name}
                    style={{
                        width: "300px",
                        height: "300px",
                        objectFit: "cover",
                        borderRadius: "8px",
                    }}
            />
        </div>
    );
};

export default ViewIngredient;
