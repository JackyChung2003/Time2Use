import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRecipeContext } from "../../../../../../containers/Client/Recipe/Contexts/RecipeContext";
import BackButton from "../../../../../../components/Button/BackButton";
import supabase from "../../../../../../config/supabaseClient";
import "./index.css"; // Add custom styles if needed

const RecipePreparationPage = () => {
  const { fetchRecipeIngredients, fetchRecipeSteps, mealTypes } = useRecipeContext();
  const navigate = useNavigate();
  const { date } = useParams(); // Get date from URL
  const location = useLocation();
  const { planned_date, meal_type_id } = location.state || {};

  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [combinedIngredients, setCombinedIngredients] = useState([]);
  const [isCombined, setIsCombined] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Fetch meal plans for the given planned date and meal type
        const { data: mealPlans, error: mealPlansError } = await supabase
          .from("meal_plan")
          .select("recipe_id, notes, planned_date")
          .eq("planned_date", planned_date)
          .eq("meal_type_id", meal_type_id);

        if (mealPlansError) throw new Error(mealPlansError.message);

        if (!mealPlans || mealPlans.length === 0) {
          console.warn("No meal plans found for the given date and meal type.");
          setRecipes([]);
          return;
        }

        // Extract recipe IDs
        const recipeIds = mealPlans.map((meal) => meal.recipe_id);

        // Fetch recipe details by IDs
        const { data: recipes, error: recipesError } = await supabase
          .from("recipes")
          .select("id, name, image_path, description, prep_time, cook_time")
          .in("id", recipeIds);

        if (recipesError) throw new Error(recipesError.message);

        setRecipes(recipes);

        // Fetch ingredients and steps for all recipes
        const allIngredients = [];
        const allSteps = [];
        for (const recipe of recipes) {
          const ingredientsData = await fetchRecipeIngredients(recipe.id);
          const stepsData = await fetchRecipeSteps(recipe.id);
          allIngredients.push(...ingredientsData);
          allSteps.push(...stepsData);
        }

        setIngredients(allIngredients);
        setSteps(allSteps);
      } catch (error) {
        console.error("Error fetching preparation details:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (planned_date && meal_type_id) {
      fetchDetails();
    }
  }, [fetchRecipeIngredients, fetchRecipeSteps, planned_date, meal_type_id]);

  const toggleCombineIngredients = () => {
    if (isCombined) {
      setCombinedIngredients([]);
      setIsCombined(false);
    } else {
      const combined = ingredients.reduce((acc, ingredient) => {
        const existing = acc.find((i) => i.ingredients.name === ingredient.ingredients.name);
        if (existing) {
          existing.quantity += ingredient.quantity;
        } else {
          acc.push({ ...ingredient });
        }
        return acc;
      }, []);
      setCombinedIngredients(combined);
      setIsCombined(true);
    }
  };

  if (loading) {
    return <div>Loading preparation details...</div>;
  }

  if (recipes.length === 0) {
    return <div>No recipes found for this meal plan.</div>;
  }

  return (
    <div className="recipe-preparation-page">
      <BackButton onClick={() => navigate(-1)} />
      <h1>Recipe Preparation</h1>
      <h3>Date: {planned_date}</h3>
      <h3>Meal Type: {mealTypes.find((type) => type.id === meal_type_id)?.name || "Unknown"}</h3>

      {recipes.map((recipe) => (
        <div key={recipe.id} className="recipe-details">
          <h2>{recipe.name}</h2>
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
            alt={recipe.name}
            style={{ width: "300px", borderRadius: "10px" }}
          />
          <p>{recipe.description}</p>
          <p>
            <strong>Prep Time:</strong> {recipe.prep_time} mins
          </p>
          <p>
            <strong>Cook Time:</strong> {recipe.cook_time} mins
          </p>
        </div>
      ))}

      <div>
        <h3>Ingredients</h3>
        <button
          onClick={toggleCombineIngredients}
          style={{
            padding: "10px 20px",
            background: isCombined ? "red" : "green",
            color: "white",
            border: "none",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          {isCombined ? "Separate Ingredients" : "Combine Ingredients"}
        </button>
        <ul>
          {(isCombined ? combinedIngredients : ingredients).map((ingredient, index) => (
            <li key={index}>
              {ingredient.ingredients.name} - {ingredient.quantity}{" "}
              {ingredient.ingredients.unit?.unit_tag || ""}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Steps</h3>
        <ul>
          {steps.map((step, index) => (
            <li key={index}>
              <strong>Step {step.step_number}:</strong> {step.instruction}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => console.log("Start Cooking")}
        style={{
          padding: "10px 20px",
          background: "orange",
          color: "white",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        Start Cooking
      </button>
    </div>
  );
};

export default RecipePreparationPage;
