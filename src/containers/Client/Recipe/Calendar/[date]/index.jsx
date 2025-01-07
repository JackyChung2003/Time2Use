import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import { useRecipeContext } from "../../Contexts/RecipeContext";
import BackButton from "../../../../../components/Button/BackButton";
import "./index.css"; // Custom styles

const MealPlannerPage = () => {
  const { date } = useParams(); // Get the date from the URL
  const navigate = useNavigate(); // For navigation
  const { fetchMealPlansByDate, fetchRecipesByIds, mealTypes } = useRecipeContext();
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [mergedImages, setMergedImages] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch meal plans for the given date
        const plans = await fetchMealPlansByDate(date);

        // Extract recipe IDs from meal plans
        const recipeIds = plans.map((plan) => plan.recipe_id);

        // Fetch recipe details for the extracted IDs
        const recipes = await fetchRecipesByIds(recipeIds);

        // Merge recipe details into meal plans
        const enrichedMealPlans = plans.map((plan) => ({
          ...plan,
          recipe: recipes.find((recipe) => recipe.id === plan.recipe_id),
        }));

        console.log("Enriched Meal Plans:", enrichedMealPlans);

        setMealPlans(enrichedMealPlans);

        // Generate merged images for each meal type
        const images = {};
        mealTypes.forEach((mealType) => {
          const mealsForType = enrichedMealPlans.filter(
            (meal) => meal.meal_type_name === mealType.name
          );
          images[mealType.name] = mergeImagesForMealType(mealsForType);
        });
        setMergedImages(images);
      } catch (error) {
        console.error("Error fetching meal plans or recipes:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, fetchMealPlansByDate, fetchRecipesByIds, mealTypes]);

  const mergeImagesForMealType = (mealsForType) => {
    if (mealsForType.length === 0) return null;

    if (mealsForType.length === 1) {
      // If only one meal, return its image
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mealsForType[0].recipe?.image_path}`;
    }

    // If multiple meals, merge the first two images for simplicity
    const images = mealsForType.slice(0, 2).map(
      (meal) =>
        `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${meal.recipe?.image_path}`
    );

    return images; // Return array of two images for merging
  };

  const toggleSection = (mealType) => {
    setExpandedSections((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const handleCancelMeal = async (date, recipeId, mealTypeId) => {
    const confirm = window.confirm("Are you sure you want to cancel this meal?");
    if (!confirm) return;

    try {
        // Delete the meal from the Supabase table
        const { error } = await supabase
            .from("meal_plan")
            .delete()
            .eq("planned_date", date)
            .eq("recipe_id", recipeId)
            .eq("meal_type_id", mealTypeId);

        if (error) {
            console.error("Error deleting meal:", error.message);
            return;
        }

        // Update the state to remove the meal from the UI
        setMealPlans((prev) =>
            prev.filter(
                (meal) =>
                    meal.planned_date !== date ||
                    meal.recipe_id !== recipeId ||
                    meal.meal_type_id !== mealTypeId
            )
        );

        console.log(
            `Meal with date: ${date}, recipe_id: ${recipeId}, meal_type_id: ${mealTypeId} deleted successfully.`
        );
    } catch (err) {
        console.error("Unexpected error deleting meal:", err.message);
    }
};



  if (loading) {
    return <div className="meal-planner-container">Loading...</div>;
  }

  return (
    <div className="meal-planner-container">
      <header className="meal-planner-header">
        <BackButton />
        <div className="date-display">
          <p>{date}</p>
        </div>
      </header>

      {mealTypes.map((mealType) => {
  // Filter meal plans for the current meal type
  const mealsForType = mealPlans.filter(
    (meal) => meal.meal_type_name === mealType.name
  );

  const hasMeals = mealsForType.length > 0; // Check if there are meals

  return (
    <div key={mealType.id} className="meal-section">
      <div className="meal-section-header">
        <div className="meal-header-image">
          {hasMeals ? (
            mergedImages[mealType.name] &&
            Array.isArray(mergedImages[mealType.name]) ? (
              <div className="merged-images">
                <img
                  src={mergedImages[mealType.name][0]}
                  alt="Meal 1"
                  className="meal-merged-image"
                />
                <img
                  src={mergedImages[mealType.name][1]}
                  alt="Meal 2"
                  className="meal-merged-image"
                />
              </div>
            ) : (
              <img
                src={mergedImages[mealType.name]}
                alt="Single Meal"
                className="meal-merged-image"
              />
            )
          ) : (
            <div className="no-meal-placeholder">
              <p>No meals planned for {mealType.name}.</p>
              {/* Optionally, add an icon or illustration */}
            </div>
          )}
        </div>
        <div className="meal-section-controls">
          <button
            onClick={() =>
              navigate(`/recipes/calendar/preparation/${date}`, {
                state: {
                  planned_date: date,
                  meal_type_id: mealType.id,
                },
              })
            }
          >
            {hasMeals ? "View Details" : "Add Meal"}
          </button>
          {hasMeals && (
            <button onClick={() => console.log("Start Cooking")}>
              Start Cooking
            </button>
          )}
        </div>
        <h2>{mealType.name}</h2>
        <span
          onClick={() => toggleSection(mealType.name)}
          style={{ cursor: "pointer" }}
        >
          {expandedSections[mealType.name] ? "▲" : "▼"}
        </span>
      </div>

      {expandedSections[mealType.name] && hasMeals && (
        <div className="meal-list">
          {mealsForType.map((meal, idx) => (
            <div key={idx} className="meal-item">
              <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${meal.recipe?.image_path || "path/to/default/image.jpg"}`}
                alt={meal.recipe?.name || "Meal Image"}
                className="meal-image"
                onClick={() =>
                  navigate(`/recipes/recipe/${meal.recipe?.id || ""}`, {
                    state: {
                      planned_date: meal.planned_date,
                      meal_type_id: meal.meal_type_id,
                      recipe_id: meal.recipe_id,
                    },
                  })
                }
              />
              <div className="meal-overlay">
                <span className="meal-name">
                  {meal.recipe?.name || "Unknown Recipe"}
                </span>
                <p className="meal-notes">{meal.notes}</p>
                <button
                  onClick={() =>
                    handleCancelMeal(
                      meal.planned_date,
                      meal.recipe_id,
                      meal.meal_type_id
                    )
                  }
                  className="cancel-meal-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show a message if the section is expanded but there are no meals */}
      {expandedSections[mealType.name] && !hasMeals && (
        <div className="no-meal-message">
          <p>No meals added for {mealType.name}. Click "Add Meal" to start planning!</p>
        </div>
      )}
    </div>
  );
})}

    </div>
  );
};

export default MealPlannerPage;
