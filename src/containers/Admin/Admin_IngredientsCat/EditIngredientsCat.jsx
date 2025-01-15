import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../../config/supabaseClient";

const EditIngredientsCat = () => {
    const { id } = useParams(); // Get category ID from URL params
    const [categoryTag, setCategoryTag] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                // Fetch category details from 'ingredients_category' table
                const { data: category, error: categoryError } = await supabase
                    .from("ingredients_category")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (categoryError) throw categoryError;

                // Populate form with existing category data
                setCategoryTag(category.category_tag);
                setCategoryName(category.category_name);
            } catch (error) {
                console.error("Error fetching category data:", error.message);
            }
        };

        fetchCategoryData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!categoryTag || !categoryName) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            // Update the category in the 'ingredients_category' table
            const { error: updateError } = await supabase
                .from("ingredients_category")
                .update({
                    category_tag: categoryTag,
                    category_name: categoryName,
                })
                .eq("id", id);

            if (updateError) throw updateError;

            alert("Ingredient category updated successfully!");
            navigate("/admin/ingredientscat"); // Redirect to categories list
        } catch (error) {
            console.error("Error updating ingredient category:", error.message);
            alert("Failed to update ingredient category.");
        }
    };

    return (
        <div className="edit-ingredients-cat-container">
            <div className="admin-content">
                <h2>Edit Ingredient Category</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Category Tag:</label>
                        <input
                            type="text"
                            value={categoryTag}
                            onChange={(e) => setCategoryTag(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Category Name:</label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        Update Category
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditIngredientsCat;
