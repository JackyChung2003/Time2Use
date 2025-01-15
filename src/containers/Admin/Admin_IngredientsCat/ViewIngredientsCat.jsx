import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from "../../../config/supabaseClient";

import BackButton from "../../../components/Button/BackButton";

const ViewIngredientsCat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ingredientCategory, setIngredientCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIngredientCategoryDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch ingredient category details
        const { data: ingredientCategoryData, error: ingredientCategoryError } = await supabase
          .from("ingredients_category")
          .select("*")
          .eq("id", id)
          .single();

        if (ingredientCategoryError) throw ingredientCategoryError;

        setIngredientCategory(ingredientCategoryData);
      } catch (err) {
        setError("Failed to fetch ingredient category details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIngredientCategoryDetails();
  }, [id]);

  const deleteIngredientCategory = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this ingredient category?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      // Delete ingredient category from the database
      const { error: ingredientCategoryError } = await supabase
        .from("ingredients_category")
        .delete()
        .eq("id", id);

      if (ingredientCategoryError) throw ingredientCategoryError;

      alert("Ingredient category deleted successfully.");
      navigate("/admin/ingredientscat"); // Redirect after deletion
    } catch (err) {
      setError("Failed to delete ingredient category.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading ingredient category...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Back Button */}
      <BackButton />

      {/* Action Buttons */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => navigate(`/admin/ingredientscat/edit/${id}`)} // Navigate to edit page
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#FFA500",
            color: "white",
            cursor: "pointer",
          }}
        >
          Edit Category
        </button>
        <button
          onClick={() => deleteIngredientCategory(ingredientCategory.id)} // Pass id to delete
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#f44336",
            color: "white",
            cursor: "pointer",
          }}
        >
          Delete Category
        </button>
      </div>

      <h1>{ingredientCategory.category_name}</h1>
      <p><span style={{ fontWeight: 'bold' }}>Category Tag:</span> {ingredientCategory.category_tag}</p>
    </div>
  );
};

export default ViewIngredientsCat;