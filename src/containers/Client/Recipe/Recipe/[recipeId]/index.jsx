import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { useLocation } from 'react-router-dom';
import supabase from '../../../../../config/supabaseClient';

import BackButton from '../../../../../components/Button/BackButton';

import { useRecipeContext } from '../../Contexts/RecipeContext';

import CommonLoader from './../../../../../components/Loader/CommonLoader';

import './index.css';

const RecipeDetail = () => {

    const { 
        recipes,
        fetchRecipeIngredients, 
        fetchRecipeSteps, 
        mealTypes, 
        userData,
        favorites,
        toggleFavorite
        // toggleFavorite,
        // isFavorite 
    } = useRecipeContext();

    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);

    // const [isFavorite, setIsFavorite] = useState(false);
    const [isCookingMode, setIsCookingMode] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0); // Tracks the current step
    const [previousStepIndex, setPreviousStepIndex] = useState(null); // Tracks the previous step
    
    const [relatedRecipes, setRelatedRecipes] = useState([]);

    const [servingPacks, setServingPacks] = useState(2); // Default servings (e.g., 2 servings)
    const [defaultServings, setDefaultServings] = useState(1); // Original serving size from the recipe

    const [nutritionFacts, setNutritionFacts] = useState({
        calories: 0,
        protein: 0,
        carbohydrate: 0,
        fat: 0,
    });
    const [totalWeightInGrams, setTotalWeightInGrams] = useState(0);

    const location = useLocation();
    const scheduleData = location.state; // Get state passed via navigate

    const [showAddModal, setShowAddModal] = useState(null); // Tracks modal visibility
    const [newMeal, setNewMeal] = useState({
        notes: "",
        time: "",
        meal_type_id: "",
        planned_date: "",
        recipe_id: "",
      });
      
    const [isFavoriteRecipe, setIsFavoriteRecipe] = useState(false);

    const [activeTab, setActiveTab] = useState("ingredients");

    useEffect(() => {
        // Add scan-page class to body when this page is loaded
        document.body.classList.add('page');

        // Clean up when the component is unmounted
        return () => {
            document.body.classList.remove('page');
        };
    }, []);
      
    useEffect(() => {
        const fetchRecipeData = async () => {
            const selectedRecipe = recipes.find((recipe) => recipe.id === parseInt(id));
            if (selectedRecipe) {
                setRecipe(selectedRecipe);
    
                // Fetch ingredients and calculate nutrition
                const ingredientsData = await fetchRecipeIngredients(selectedRecipe.id);
                setIngredients(ingredientsData);
                calculateNutrition(ingredientsData);
    
                // Fetch steps
                const stepsData = await fetchRecipeSteps(selectedRecipe.id);
                setSteps(stepsData);
    
                // Check if the recipe is favorited
                if (userData) {
                    try {
                        const { data, error } = await supabase
                            .from('favorites')
                            .select('id')
                            .eq('recipe_id', selectedRecipe.id)
                            .eq('user_id', userData.id)
                            .single();
    
                        if (!error && data) {
                            setIsFavoriteRecipe(true);
                        }
                    } catch (err) {
                        console.error('Error checking favorite status:', err.message);
                    }
                }
            } else {
                setRecipe(null);
            }
            setLoading(false);
        };
    
        fetchRecipeData();
    }, [id, recipes, fetchRecipeIngredients, fetchRecipeSteps, userData]);
    

    const calculateNutrition = (ingredients) => {
        let totalNutrition = {
            calories: 0,
            protein: 0,
            carbohydrate: 0,
            fat: 0,
        };
        let totalWeightInGrams = 0; // Total weight of all ingredients in grams

        ingredients.forEach((ingredient) => {
            const { nutritional_info, unit } = ingredient.ingredients;
            const { quantity } = ingredient;
            
            let { calories, protein, carbohydrate, fat } = nutritional_info;

            // Strip "g" and convert to number for protein, carbohydrate, and fat
            protein = typeof protein === "string" ? parseFloat(protein.replace("g", "")) || 0 : protein || 0;
            carbohydrate = typeof carbohydrate === "string" ? parseFloat(carbohydrate.replace("g", "")) || 0 : carbohydrate || 0;
            fat = typeof fat === "string" ? parseFloat(fat.replace("g", "")) || 0 : fat || 0;

            const conversionRate = unit.conversion_rate_to_grams;

            // Handle unit conversion to grams (example for common units)
            let quantityInGrams = quantity;
            if (conversionRate && conversionRate > 0) {
                quantityInGrams *= conversionRate;
            } else {
                console.warn(`Unit ${unit.unit_tag} does not have a valid conversion rate.`);
                return; // Skip this ingredient if no valid conversion rate
            }

            // Update the total weight
            totalWeightInGrams += quantityInGrams;

            // Nutritional info is per 100 grams; calculate based on quantity
            const factor = quantityInGrams / 100;
            totalNutrition.calories += calories * factor;
            totalNutrition.protein += protein * factor;
            totalNutrition.carbohydrate += carbohydrate * factor;
            totalNutrition.fat += fat * factor;
        });

        setTotalWeightInGrams(totalWeightInGrams);

        // Calculate per 100g nutrition values
        const per100gNutrition = {
            calories: (totalNutrition.calories / (totalWeightInGrams / 100)).toFixed(2),
            protein: (totalNutrition.protein / (totalWeightInGrams / 100)).toFixed(2),
            carbohydrate: (totalNutrition.carbohydrate / (totalWeightInGrams / 100)).toFixed(2),
            fat: (totalNutrition.fat / (totalWeightInGrams / 100)).toFixed(2),
        };

        // Update state with both total and per 100g nutrition facts
        setNutritionFacts({
            total: {
                calories: totalNutrition.calories.toFixed(2),
                protein: totalNutrition.protein.toFixed(2),
                carbohydrate: totalNutrition.carbohydrate.toFixed(2),
                fat: totalNutrition.fat.toFixed(2),
            },
            per100g: per100gNutrition,
        });
    };

    const toggleCookingMode = () => {
        if (!isCookingMode) {
            // Prompt user if they want to continue from the last step
            if (previousStepIndex !== null) {
                const continueFromLast = window.confirm(
                    'Would you like to continue from your last step or start over?'
                );
                if (continueFromLast) {
                    setCurrentStepIndex(previousStepIndex);
                } else {
                    setCurrentStepIndex(0);
                }
            } else {
                setCurrentStepIndex(0);
            }
        } else {
            setPreviousStepIndex(currentStepIndex); // Save the current step when exiting
        }
        setIsCookingMode((prev) => !prev);
    };

    const handleNextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            const nextStepIndex = currentStepIndex + 1;
            setCurrentStepIndex(nextStepIndex);
            console.log(`Now on Step ${nextStepIndex + 1}: ${steps[nextStepIndex].instruction}`);
        }
    };

    const handlePreviousStep = () => {
        if (currentStepIndex > 0) {
            const prevStepIndex = currentStepIndex - 1;
            setCurrentStepIndex(prevStepIndex);
            console.log(`Now on Step ${prevStepIndex + 1}: ${steps[prevStepIndex].instruction}`);
        }
    };

    const finishCooking = () => {
        alert('Congratulations! You have finished cooking this recipe.');
        setIsCookingMode(false);
        setPreviousStepIndex(null); // Reset the previous step
    };

    const shareRecipe = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
    };

    if (!recipe) {
        return <div>Recipe not found!</div>;
    }
    
    const handleIncreaseServing = () => setServingPacks((prev) => prev + 1);
    const handleDecreaseServing = () => {
        if (servingPacks > 1) setServingPacks((prev) => prev - 1);
    };

    const getAdjustedIngredients = () => {
        const ratio = servingPacks / defaultServings;
        console.log("Test ingredients:", ingredients);
        return ingredients.map((ingredient) => ({
            ...ingredient,
            quantity: (ingredient.quantity * ratio).toFixed(2), // Adjust the quantity based on servings
        }));
    };

    if (loading) {
        return <CommonLoader />;
    }

    if (!recipe) {
        return <div>Recipe not found!</div>;
    }

    const handleCancelSchedule = async () => {
        if (!scheduleData) return; // No schedule to cancel
    
        const { planned_date, meal_type_id, recipe_id } = scheduleData;
    
        const confirm = window.confirm(
            "Are you sure you want to cancel this scheduled recipe?"
        );
        if (!confirm) return;
    
        try {
            const { error } = await supabase
                .from("meal_plan")
                .delete()
                .eq("planned_date", planned_date)
                .eq("meal_type_id", meal_type_id)
                .eq("recipe_id", recipe_id);
    
            if (error) {
                console.error("Error canceling schedule:", error.message);
                return;
            }
    
            alert("Schedule canceled successfully.");
            navigate(-1); // Go back to the Meal Planner
        } catch (err) {
            console.error("Unexpected error:", err.message);
        }
    };

    // Map mealTypes to an object for quick lookup
    const mealTypeMap = mealTypes.reduce((map, type) => {
        map[type.id] = type.name;
        return map;
    }, {});

    const handleAddMeal = async () => {
        try {
          const { error } = await supabase.from("meal_plan").insert([
            {
              user_id: userData.id, // Replace with the appropriate user ID
              recipe_id: newMeal.recipe_id,
              planned_date: newMeal.planned_date,
              meal_type_id: newMeal.meal_type_id,
              notes: newMeal.notes,
              time: newMeal.time,
              serving_packs: newMeal.servingPacks || 1, 
            },
          ]);
      
          if (error) {
            console.error("Error adding meal:", error.message);
            return;
          }
      
          alert("Meal successfully added!");
          setShowAddModal(null); // Close the modal
        } catch (err) {
          console.error("Unexpected error adding meal:", err.message);
        }
      };
      
      const handleOpenAddModal = (recipeId) => {
        const defaultTime =
          mealTypes.find((type) => type.id === scheduleData.meal_type_id)?.default_time || "12:00";
      
        setNewMeal({
          notes: "",
          time: defaultTime,
          meal_type_id: scheduleData?.meal_type_id || "",
          planned_date: scheduleData?.planned_date || "",
          recipe_id: recipeId,
        });
      
        setShowAddModal(true);
      };

      const handleFavoriteClick = async () => {
        console.log('Favorite button clicked');
        const response = await toggleFavorite(recipe.id);
        console.log('Response:HEREEEEEE', response);
        if (response.success) {
          setIsFavoriteRecipe((prev) => !prev);
          alert(response.message);
        } else {
          alert(response.message);
        }
      };

      return (
        <div className="recipe-details-container">
            <section className="recipe-image-detail-section">
                <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                    alt={recipe.name}
                    className="recipe-detail-image"
                />
                <div className="image-overlay">
                    <BackButton />
                    {/* <h1 className="recipe-title">{recipe.name}</h1> */}
                    <div className="action-buttons">
                        <button onClick={shareRecipe} className="share-button">
                            Share
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(recipe.id);
                            }}
                            className="favorite-button"
                        >
                            {favorites.includes(recipe.id) ? "❤️" : "🤍"}
                        </button>
                    </div>
                </div>
            </section>
            <div className='recipe-detail-lower-section'>

            <section className="recipe-details">
                <h2 className="recipe-detail-title">{recipe.name}</h2>
                <p className="recipe-description">{recipe.description}</p>
                <div className="left-right-space-evenly-section">
                    <p className="prep-time">Prep Time: {recipe.prep_time} mins</p>
                    <p className="cook-time">Cook Time: {recipe.cook_time} mins</p>
                </div>


                <div className="total-meal-weight">
                    <p><strong>Total Meal Weight: </strong>{(totalWeightInGrams * (servingPacks / defaultServings)).toFixed(2)} g</p>
                </div>
            </section>
    
            <section className="nutrition-facts">
                <h3>Nutrition Facts</h3>
                <div className="nutrition-content">
                    <div className="total-nutrition">
                        <h4>Total Nutrition</h4>
                        <ul>
                            <li>Calories: {nutritionFacts.total?.calories || 0} kcal</li>
                            <li>Protein: {nutritionFacts.total?.protein || 0} g</li>
                            <li>Carbohydrate: {nutritionFacts.total?.carbohydrate || 0} g</li>
                            <li>Fats: {nutritionFacts.total?.fat || 0} g</li>
                        </ul>
                    </div>
                    <div className="per-100g-nutrition">
                        <h4>Per 100g</h4>
                        <ul>
                            <li>Calories: {nutritionFacts.per100g?.calories || 0} kcal</li>
                            <li>Protein: {nutritionFacts.per100g?.protein || 0} g</li>
                            <li>Carbohydrate: {nutritionFacts.per100g?.carbohydrate || 0} g</li>
                            <li>Fats: {nutritionFacts.per100g?.fat || 0} g</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Toggle Buttons */}
            <div className="radio-inputs">
                <label className="radio">
                <input
                    type="radio"
                    name="toggle"
                    checked={activeTab === "ingredients"}
                    onChange={() => setActiveTab("ingredients")}
                />
                <span className="name">Ingredients</span>
                </label>
                <label className="radio">
                <input
                    type="radio"
                    name="toggle"
                    checked={activeTab === "steps"}
                    onChange={() => setActiveTab("steps")}
                />
                <span className="name">Steps</span>
                </label>
            </div>

            {/* Conditional Rendering */}
            {activeTab === "ingredients" && (
                <section className="ingredients-section">
                <h3>Ingredients</h3>
                <section className="serving-adjuster">
                    <h4>Serving Packs</h4>
                    <button onClick={handleDecreaseServing} className="adjust-serving-button">-</button>
                    <span className="serving-count">{servingPacks}</span>
                    <button onClick={handleIncreaseServing} className="adjust-serving-button">+</button>
                </section>
        
                <section className="ingredients-section">
                    <h3>Ingredients List ({getAdjustedIngredients().length} item(s))</h3>
                    <ul className="ingredients-list">
                        {getAdjustedIngredients().map((ingredient) => (
                            <li key={ingredient.ingredients.id} className="ingredient-item">
                            {console.log('ingredient:', ingredient)}
                            <img 
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.ingredients.icon_path}`} 
                                alt={ingredient.ingredients.name} 
                                className="ingredient-image"
                            />
                            <span>
                                {ingredient.ingredients.name} - {ingredient.quantity} {ingredient.ingredients.unit?.unit_tag || ''}
                            </span>
                        </li>
                        ))}
                    </ul>
                </section>
              </section>
            )}
      
            {activeTab === "steps" && (
              <section className="steps-section">
                <h3>Steps</h3>
                <ul className="steps-list">
                    {steps.map((step) => (
                        <li key={step.step_number} className="step-item">
                            <strong>{step.step_number}:</strong> {step.instruction}
                        </li>
                    ))}
                </ul>
            </section>
            )}
            {console.log("Schedule Data:", scheduleData)}
            {!scheduleData.activity_type ? (
                <>

                    <button
                        onClick={() =>
                            navigate('/recipes/calendar', {
                                state: { recipeId: id, recipeName: recipe.name },
                            })
                        }
                        className="button reschedule-button floating-down"
                    >
                        Reschedule
                    </button>
                </>
            ) : (
                // Buttons for navigating from the Meal Planning page
                <>
                    {scheduleData?.activity_type === "view" ? (
                        <>
                            <button
                                onClick={handleCancelSchedule}
                                className="button cancel-schedule-button "
                                // onMouseEnter={(e) => (e.target.style.background = "#e63939")}
                                // onMouseLeave={(e) => (e.target.style.background = "#ff4d4d")}
                                onMouseEnter={(e) =>
                                    e.target.classList.add('cancel-schedule-hover')
                                }
                                onMouseLeave={(e) =>
                                    e.target.classList.remove('cancel-schedule-hover')
                                }
                            >
                                <span className="cancel-icon ">✖</span>
                                Cancel Schedule for {" "}
                                {new Date(scheduleData.planned_date).toLocaleDateString("en-US", {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })} {" "}
                                ({mealTypeMap[scheduleData.meal_type_id] || "Unknown"})
                            </button>
                            <button
                            onClick={() =>
                                navigate('/recipes/calendar', {
                                    state: { recipeId: id, recipeName: recipe.name },
                                })
                            }
                            className="button reschedule-another-button"
                        >
                            Reschedule Another Meal
                        </button>
                    </>
                        
                    ) : (
                        // Updated "Add Recipe to Meal Plan" button
                        // Add to Meal Button with Modal Trigger
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent event propagation
                                handleOpenAddModal(recipe.id); // Trigger modal opening
                            }}
                            className="button add-meal-button"
                        >
                            Add to Meal
                        </button>
                    )}
                    {/* havnt do passing state for this */}
                </>
            )}
    
            {isCookingMode && (
                <section className="cooking-mode-overlay">
                    <h2>Step {currentStepIndex + 1}</h2>
                    <p>{steps[currentStepIndex]?.instruction}</p>
                    <div className="cooking-mode-controls">
                        <button
                            onClick={handlePreviousStep}
                            className="previous-step-button"
                            disabled={currentStepIndex === 0}
                            >
                            Previous
                        </button>
                        <button
                            onClick={handleNextStep}
                            className="next-step-button"
                            disabled={currentStepIndex === steps.length - 1}
                            >
                            Next
                        </button>
                        {currentStepIndex === steps.length - 1 && (
                            <button onClick={finishCooking} className="finish-cooking-button">
                                Finish Cooking
                            </button>
                        )}
                        <button onClick={toggleCookingMode} className="exit-cooking-mode-button">
                            Exit Cooking Mode
                        </button>
                    </div>
                </section>
            )}
    
            {scheduleData?.activity_type && (
                <section className="scheduled-activity-buttons">
                    {scheduleData.activity_type === "view" ? (
                        <>
                            {/* <button
                                onClick={handleCancelSchedule}
                                className="cancel-schedule-button"
                                >
                                Cancel Schedule
                            </button>
                            <button
                                onClick={() =>
                                    navigate('/recipes/calendar', {
                                        state: { recipeId: id, recipeName: recipe.name },
                                    })
                                }
                                className="reschedule-button"
                                >
                                Reschedule Another Meal
                            </button> */}
                        </>
                    ) : (
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddModal(recipe.id);
                        }}
                        className="add-to-meal-button"
                        >
                            Add to Meal
                        </button>
                    )}
                </section>
            )}
    
            {/* <section className="related-recipes">
                <h3>Related Recipes</h3>
                <ul className="related-recipes-list">
                    {relatedRecipes.map((recipe) => (
                        <li
                        key={recipe.id}
                        className="related-recipe-item"
                        onClick={() => navigate(`/recipes/recipe/${recipe.id}`)}
                        >
                            <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                                alt={recipe.name}
                                className="related-recipe-image"
                                />
                            {recipe.name}
                        </li>
                    ))}
                </ul>
            </section> */}
    
            {showAddModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Add a Meal</h2>
                        <p>
                            <strong>Meal Type:</strong> {mealTypes.find((type) => type.id === newMeal.meal_type_id)?.name || "Unknown"}
                        </p>
                        <p>
                            <strong>Planned Date:</strong> {newMeal.planned_date}
                        </p>
                        <label>
                            Notes:
                            <textarea
                                value={newMeal.notes}
                                placeholder="Enter additional notes (e.g., extra ingredients, instructions)"
                                onChange={(e) => setNewMeal((prev) => ({ ...prev, notes: e.target.value }))}
                                rows="3"
                                className="notes-textarea"
                                />
                        </label>
                        <label>
                            Time:
                            <input
                                type="time"
                                value={newMeal.time}
                                onChange={(e) => setNewMeal((prev) => ({ ...prev, time: e.target.value }))}
                                className="time-input"
                                />
                        </label>
                        <label>
                            Pax (Serving Packs):
                            <div className="serving-adjuster">
                                <button
                                    onClick={() =>
                                        setNewMeal((prev) => ({
                                            ...prev,
                                            servingPacks: Math.max(1, (prev.servingPacks || 1) - 1),
                                        }))
                                    }
                                    className="adjust-serving-button"
                                    >
                                    -
                                </button>
                                <span className="serving-count">{newMeal.servingPacks || 1}</span>
                                <button
                                    onClick={() =>
                                        setNewMeal((prev) => ({
                                            ...prev,
                                            servingPacks: (prev.servingPacks || 1) + 1,
                                        }))
                                    }
                                    className="adjust-serving-button"
                                    >
                                    +
                                </button>
                            </div>
                        </label>
                        <div className="modal-actions">
                            <button onClick={handleAddMeal} className="save-button">
                                Save
                            </button>
                            <button onClick={() => setShowAddModal(null)} className="cancel-button">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
    
};

export default RecipeDetail;