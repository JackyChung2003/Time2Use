import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import { useRecipeContext } from "../../Contexts/RecipeContext";
import BackButton from "../../../../../components/Button/BackButton";
import "./index.css"; // Custom styles
import CommonLoader from "../../../../../components/Loader/CommonLoader";

const MealPlannerPage = () => {
  const { date } = useParams(); // Get the date from the URL
  const navigate = useNavigate(); // For navigation
  const location = useLocation(); 
  const { userData, fetchMealPlansByDate, fetchRecipesByIds, mealTypes } = useRecipeContext();
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [mergedImages, setMergedImages] = useState({});
  
  const [showAddModal, setShowAddModal] = useState(null); // Meal Type ID for which the modal is open
  // const [showScheduleOptions, setShowScheduleOptions] = useState(false); // State for showing schedule options modal
  const [showScheduleOptions, setShowScheduleOptions] = useState({ show: false, mealTypeId: null });

  // Accessing the state passed via navigate
  const { recipeId, recipeName, date: passedDate, servingPacks } = location.state || {};

  const [newMeal, setNewMeal] = useState({
    notes: "",
    time: "",
    meal_type_id: "",
  });

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

const handleAddMeal = async () => {
  try {
    const { error } = await supabase.from("meal_plan").insert([
      {
        user_id: userData.id,
        recipe_id: recipeId,
        planned_date: passedDate || date,
        meal_type_id: showAddModal,
        notes: newMeal.notes,
        time: newMeal.time,
        serving_packs: servingPacks, 
      },
    ]);
    console.log("Adding meal...");
    console.log("Recipe ID:", recipeId);
    console.log("Planned Date:", passedDate );
    console.log("Meal Type ID:", showAddModal);
    console.log("Notes:", newMeal.notes);
    console.log("Time:", newMeal.time);
    console.log("User ID:", userData.id);
    console.log("Date:", date);
    console.log("Passed Date:", passedDate);
    console.log("Serving Packs:", servingPacks);
    
    if (error) {
      console.error("Error adding meal:", error.message);
      return;
    }

    setMealPlans((prev) => [
      ...prev,
      {
        recipe_id: recipeId,
        planned_date: passedDate || date,
        meal_type_id: showAddModal,
        notes: newMeal.notes,
        time: newMeal.time,
        serving_packs: servingPacks,
      },
    ]);
    setShowAddModal(null); // Close the modal
  } catch (err) {
    console.error("Unexpected error adding meal:", err.message);
  }
};

  const handleOpenAddModal = (mealTypeId) => {
    const selectedMealType = mealTypes.find((type) => type.id === mealTypeId);
    const defaultTime = selectedMealType?.default_time || "12:00"; // Default to 12:00 if no default_time exists

    setNewMeal((prev) => ({
      ...prev,
      meal_type_id: mealTypeId,
      time: defaultTime, // Set the default time based on meal type
    }));
    setShowAddModal(mealTypeId);
  };

  // const handleNavigateToRecipes = (type) => {
  //   navigate(`/recipes/${type === "favorites" ? "favorites" : "explore"}`, {
  //     state: {
  //       planned_date: date,
  //       meal_type_id: showScheduleOptions.mealTypeId, // Use the passed mealType.id
  //     },
  //   });
  //   setShowScheduleOptions({ show: false, mealTypeId: null }); // Reset modal state
  // };

  const handleNavigateToRecipes = (type, activityType) => {
    navigate(`/recipes/${type === "favorites" ? "favorites" : "explore"}`, {
        state: {
            planned_date: date,
            meal_type_id: showScheduleOptions.mealTypeId, // Use the passed mealType.id
            activity_type: activityType, // Pass the activity type (e.g., "add" or "view")
        },
    });
    setShowScheduleOptions({ show: false, mealTypeId: null }); // Reset modal state
};


  if (loading) {
    return <CommonLoader />;
  }

  return (
    <div className="meal-planner-container">
      <header className="meal-planner-header">
        <BackButton />
        <div className="date-display">
          <p>{date}</p>
        </div>
        {recipeId && recipeName && (
          <div className="recipe-calender-details">
            <h2>Recipe Details</h2>
            <p><strong>Recipe Name:</strong> {recipeName}</p>
            <p><strong>Recipe ID:</strong> {recipeId}</p>
          </div>
        )}
      </header>
  
      {mealTypes.map((mealType) => {
        const mealsForType = mealPlans.filter(
          (meal) => meal.meal_type_name === mealType.name
        );
        const hasMeals = mealsForType.length > 0;
  
        return (
          <div key={mealType.id} className="meal-section">
            <div className="meal-section-header">
              <div className={`meal-header-image ${hasMeals ? (Array.isArray(mergedImages[mealType.name]) ? "split-images" : "full-image") : "no-image"}`}>
                {hasMeals ? (
                  Array.isArray(mergedImages[mealType.name]) ? (
                    <div className="split-images">
                      <img
                        src={mergedImages[mealType.name][0]}
                        alt="Meal 1"
                        className="meal-image-left"
                      />
                      <img
                        src={mergedImages[mealType.name][1]}
                        alt="Meal 2"
                        className="meal-image-right"
                      />
                    </div>
                  ) : (
                    <img
                      src={mergedImages[mealType.name]}
                      alt="Single Meal"
                      className="meal-full-image"
                    />
                  )
                ) : (
                  <div className="no-meal-placeholder">
                    <p>No meals planned for {mealType.name}.</p>
                  </div>
                )}
                <div className="meal-title-overlay">
                  <h2>{mealType.name}</h2>
                  <div className="meal-section-controls">
                    <button
                      onClick={() =>
                        recipeId
                          ? handleOpenAddModal(mealType.id)
                          : setShowScheduleOptions({ show: true, mealTypeId: mealType.id })
                      }
                      className="action-button"
                    >
                      {recipeId ? "Add Here" : "Schedule Meal"}
                    </button>
      
                    {hasMeals && (
                      <button
                        onClick={() =>
                          navigate(`/recipes/calendar/preparation/${date}`, {
                            state: {
                              planned_date: date,
                              meal_type_id: mealType.id,
                            },
                          })
                        }
                        className="view-details-button"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>


              </div>
  
              {/* <div className="meal-section-controls">
                <button
                  onClick={() =>
                    recipeId
                      ? handleOpenAddModal(mealType.id)
                      : setShowScheduleOptions({ show: true, mealTypeId: mealType.id })
                  }
                  className="action-button"
                >
                  {recipeId ? "Add Here" : "Schedule Meal"}
                </button>
  
                {hasMeals && (
                  <button
                    onClick={() =>
                      navigate(`/recipes/calendar/preparation/${date}`, {
                        state: {
                          planned_date: date,
                          meal_type_id: mealType.id,
                        },
                      })
                    }
                    className="view-details-button"
                  >
                    View Details
                  </button>
                )}
              </div> */}
  
              <span
                onClick={() => toggleSection(mealType.name)}
                className="toggle-section-button"
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
                            activity_type: "view",
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelMeal(
                            meal.planned_date,
                            meal.recipe_id,
                            meal.meal_type_id
                          );
                        }}
                        className="cancel-meal-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
  
            {expandedSections[mealType.name] && !hasMeals && (
              <div className="no-meal-message">
                <p>No meals added for {mealType.name}. Click &quot;Schedule Meal&quot; to start planning!</p>
              </div>
            )}
          </div>
        );
      })}
  
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add a Meal</h2>
            <p><strong>Recipe:</strong> {recipeName}</p>
            <p><strong>Meal Type:</strong> {mealTypes.find((type) => type.id === showAddModal)?.name || "Unknown"}</p>
            <p><strong>Date:</strong> {passedDate || date}</p>
            <p><strong>Serving packs:</strong> {servingPacks}</p>
            <label>
              Notes:
              <textarea
                value={newMeal.notes}
                placeholder="Enter additional notes (e.g., extra ingredients, instructions)"
                onChange={(e) =>
                  setNewMeal((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows="3"
                className="notes-textarea"
              />
            </label>
            <label>
              Time:
              <input
                type="time"
                value={newMeal.time}
                onChange={(e) =>
                  setNewMeal((prev) => ({ ...prev, time: e.target.value }))
                }
                className="time-input"
              />
            </label>
            <button onClick={handleAddMeal} className="save-button">Save</button>
            <button onClick={() => setShowAddModal(null)} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}
  
      {showScheduleOptions.show && (
        <div className="calender-modal">
          <div className="modal-content">
            <h2>Schedule Meal</h2>
            <p>
              Would you like to schedule a meal for <strong>{mealTypes.find((type) => type.id === showScheduleOptions.mealTypeId)?.name}</strong> from your favorites or all recipes?
            </p>
            <div className="modal-buttons">
              <button
                onClick={() => handleNavigateToRecipes("favorites", "add")}
                className="modal-button favorites-button"
              >
                Favorites
              </button>
              <button
                onClick={() => handleNavigateToRecipes("all", "add")}
                className="modal-button all-recipes-button"
              >
                All Recipes
              </button>
            </div>
            <button
              onClick={() => setShowScheduleOptions({ show: false, mealTypeId: null })}
              className="modal-close-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlannerPage;
