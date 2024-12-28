import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import supabase from '../../../../../config/supabaseClient';

import BackButton from '../../../../../components/Button/BackButton';

import { useRecipeContext } from '../../Contexts/RecipeContext';

const RecipeDetail = () => {

    const { recipes, fetchRecipeIngredients, fetchRecipeSteps, mealTypes } = useRecipeContext();

    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isFavorite, setIsFavorite] = useState(false);
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

    // const nutritionFacts = {
    //     calories: 500,
    //     protein: 20,
    //     carbs: 50,
    //     fat: 15,
    // };

    useEffect(() => {
        const selectedRecipe = recipes.find((recipe) => recipe.id === parseInt(id));
        if (selectedRecipe) {
            setRecipe(selectedRecipe);
            // fetchRecipeIngredients(selectedRecipe.id).then(setIngredients);
            fetchRecipeIngredients(selectedRecipe.id).then((data) => {
                setIngredients(data);
                calculateNutrition(data); // Calculate nutrition when ingredients are fetched
            });
            fetchRecipeSteps(selectedRecipe.id).then(setSteps);
        } else {
            setRecipe(null);
        }
        setLoading(false);
    }, [id, recipes, fetchRecipeIngredients, fetchRecipeSteps]);

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
            // const { nutritional_info, quantity, unit } = ingredient.ingredients;
            const { quantity } = ingredient;
            
            console.log("nutritional_info:", nutritional_info);
            console.log("quantity:", quantity);
            console.log("unit:", unit);

            let { calories, protein, carbohydrate, fat } = nutritional_info;
            console.log("calories:", calories);
            console.log("protein (raw):", protein);
            console.log("carbohydrate (raw):", carbohydrate);
            console.log("fat (raw):", fat);

            // Strip "g" and convert to number for protein, carbohydrate, and fat
            protein = typeof protein === "string" ? parseFloat(protein.replace("g", "")) || 0 : protein || 0;
            carbohydrate = typeof carbohydrate === "string" ? parseFloat(carbohydrate.replace("g", "")) || 0 : carbohydrate || 0;
            fat = typeof fat === "string" ? parseFloat(fat.replace("g", "")) || 0 : fat || 0;
    

            console.log("protein (parsed):", protein);
            console.log("carbohydrate (parsed):", carbohydrate);
            console.log("fat (parsed):", fat);

            const conversionRate = unit.conversion_rate_to_grams;
            console.log("conversionRate:", conversionRate);

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

        console.log(`Total Weight of Recipe: ${totalWeightInGrams.toFixed(2)}g`);
        console.log("Total Nutrition:", totalNutrition);
        console.log("Per 100g Nutrition:", per100gNutrition);

        // // Update state
        // setNutritionFacts({
        //     calories: totalNutrition.calories.toFixed(2),
        //     protein: totalNutrition.protein.toFixed(2),
        //     carbohydrate: totalNutrition.carbohydrate.toFixed(2),
        //     fat: totalNutrition.fat.toFixed(2),
        // });

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

    const toggleFavorite = async () => {
        try {
            const { data } = await supabase
                .from('favorites')
                .select('*')
                .eq('recipe_id', id)
                .single();
    
            if (data) {
                await supabase.from('favorites').delete().eq('recipe_id', id);
                setIsFavorite(false);
            } else {
                await supabase.from('favorites').insert({ recipe_id: id, user_id: '7863d141-7c8f-4779-9ac8-2b45e9a9d752' });
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    // const toggleCookingMode = () => setIsCookingMode((prev) => !prev);

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
        return <div>Loading recipe details...</div>;
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
    

    return (
        <div style={{ padding: '20px' }}>
            <BackButton />
            <h1>{recipe.name}</h1>
            <button onClick={toggleFavorite}>
                {isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
            </button>
            <button onClick={shareRecipe}>Share Recipe</button>


            <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                alt={recipe.name}
                style={{ width: '300px', borderRadius: '10px', marginBottom: '20px' }}
            />
            <p>{recipe.description}</p>
            <p>Prep Time: {recipe.prep_time} mins</p>
            <p>Cook Time: {recipe.cook_time} mins</p>

            <div>
                <h4>Total Meal Weight</h4>
                <p>{(totalWeightInGrams * (servingPacks / defaultServings)).toFixed(2)} g</p>
            </div>

            {/* <h3>Nutrition Facts</h3>
            <ul>
                <li>Calories: {nutritionFacts.calories} kcal</li>
                <li>Protein: {nutritionFacts.protein} g</li>
                <li>Carbohydrate: {nutritionFacts.carbohydrate} g</li>
                <li>Fats: {nutritionFacts.fat} g</li>
            </ul> */}
            {/* Nutrition Facts Section */}
            <h3>Nutrition Facts</h3>
            <div>
                <h4>Total Nutrition (for the entire recipe)</h4>
                <ul>
                    <li>Calories: {nutritionFacts.total?.calories || 0} kcal</li>
                    <li>Protein: {nutritionFacts.total?.protein || 0} g</li>
                    <li>Carbohydrate: {nutritionFacts.total?.carbohydrate || 0} g</li>
                    <li>Fats: {nutritionFacts.total?.fat || 0} g</li>
                </ul>
            </div>

            <div>
                <h4>Per 100g Nutrition</h4>
                <ul>
                    <li>Calories: {nutritionFacts.per100g?.calories || 0} kcal</li>
                    <li>Protein: {nutritionFacts.per100g?.protein || 0} g</li>
                    <li>Carbohydrate: {nutritionFacts.per100g?.carbohydrate || 0} g</li>
                    <li>Fats: {nutritionFacts.per100g?.fat || 0} g</li>
                </ul>
            </div>
            <p>Note: Future versions will link to the database and calculate these values dynamically.</p>


            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    onClick={handleDecreaseServing}
                    style={{
                        padding: '5px 10px',
                        border: '1px solid #ccc',
                        background: '#f5f5f5',
                        cursor: 'pointer',
                    }}
                >
                    -
                </button>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{servingPacks}</span>
                <button
                    onClick={handleIncreaseServing}
                    style={{
                        padding: '5px 10px',
                        border: '1px solid #ccc',
                        background: '#f5f5f5',
                        cursor: 'pointer',
                    }}
                >
                    +
                </button>
            </div>

            <h3>Ingredients</h3>
            <ul>
                {/* {ingredients.map((ingredient, index) => (
                    <li
                        key={index}
                        onClick={() => handleIngredientClick(ingredient)}
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }}
                    >
                        {ingredient.ingredients.name} - {ingredient.quantity} {ingredient.unit}
                        {selectedSubstitutions[ingredient.ingredients.id] && (
                            <span style={{ marginLeft: '10px', color: 'green' }}>
                                (Substituted with {selectedSubstitutions[ingredient.ingredients.id].substitute_ingredient.name})
                            </span>
                        )}
                    </li>
                ))} */}
                {getAdjustedIngredients().map((ingredient) => (
                    <li key={ingredient.ingredients.id}>
                        {ingredient.ingredients.name} - {ingredient.quantity} {ingredient.ingredients.unit?.unit_tag  || ''}
                    </li>
                ))}
            </ul>

            <h3>Steps</h3>
            <ul>
                {steps.map((step) => (
                    <li key={step.step_number}>
                        <strong>Step {step.step_number}:</strong> {step.instruction}
                    </li>
                ))}
            </ul>
            {/* <h3>Steps</h3> */}
            {/* {!isCookingMode ? (
                <>
                    <button onClick={toggleCookingMode}>Start Cooking Mode</button>
                    <ol>
                        {steps.map((step, index) => (
                            <li key={index}>{step.instruction}</li>
                        ))}
                    </ol>
                </>
            ) : (
                <div>
                    <h2>Step {steps[currentStepIndex].step_number}</h2>
                    <p>{steps[currentStepIndex].instruction}</p>
                    <button
                        onClick={() => setCurrentStepIndex((prev) => Math.max(prev - 1, 0))}
                    >
                        Previous
                    </button>
                    <button
                        onClick={() =>
                            setCurrentStepIndex((prev) =>
                                Math.min(prev + 1, steps.length - 1)
                            )
                        }
                    >
                        Next
                    </button>
                    <button onClick={toggleCookingMode}>Exit Cooking Mode</button>
                </div>
            )} */}

            {/* <button onClick={toggleCookingMode}>Start Cooking Mode</button> */}

            {/* Cooking Mode Overlay */}
            {/* {isCookingMode && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <h2>Step {currentStepIndex + 1}</h2>
                    <p>{steps[currentStepIndex]?.instruction}</p>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handlePreviousStep}
                            style={{
                                padding: '10px 20px',
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                visibility: currentStepIndex === 0 ? 'hidden' : 'visible',
                            }}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextStep}
                            style={{
                                padding: '10px 20px',
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                visibility: currentStepIndex === steps.length - 1 ? 'hidden' : 'visible',
                            }}
                        >
                            Next
                        </button>
                        <button
                            onClick={toggleCookingMode}
                            style={{
                                padding: '10px 20px',
                                background: 'red',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Exit Cooking Mode
                        </button>
                    </div>
                </div>
            )} */}

            {isCookingMode && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <h2>Step {currentStepIndex + 1}</h2>
                    <p>{steps[currentStepIndex]?.instruction}</p>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handlePreviousStep}
                            style={{
                                padding: '10px 20px',
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                visibility: currentStepIndex === 0 ? 'hidden' : 'visible',
                            }}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextStep}
                            style={{
                                padding: '10px 20px',
                                background: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                visibility: currentStepIndex === steps.length - 1 ? 'hidden' : 'visible',
                            }}
                        >
                            Next
                        </button>
                        {currentStepIndex === steps.length - 1 && (
                            <button
                                onClick={finishCooking}
                                style={{
                                    padding: '10px 20px',
                                    background: 'green',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                }}
                            >
                                Finish Cooking
                            </button>
                        )}
                        <button
                            onClick={toggleCookingMode}
                            style={{
                                padding: '10px 20px',
                                background: 'red',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Exit Cooking Mode
                        </button>
                    </div>
                </div>
            )}

            {/* <button
                onClick={() =>
                    navigate('/recipes/calendar', {
                        state: { recipeId: id, recipeName: recipe.name },
                    })
                }
            >
                Reschedule
            </button> */}

            {!scheduleData ? (
                // Default buttons for viewing recipes
                <>
                    <button
                        onClick={toggleCookingMode}
                        style={{
                            padding: "10px 20px",
                            background: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginTop: "20px",
                        }}
                    >
                        Start Cooking Mode
                    </button>

                    <button
                        onClick={() =>
                            navigate('/recipes/calendar', {
                                state: { recipeId: id, recipeName: recipe.name },
                            })
                        }
                        style={{
                            padding: "10px 20px",
                            background: "orange",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginTop: "20px",
                        }}
                    >
                        Reschedule
                    </button>
                </>
            ) : (
                // Buttons for navigating from the Meal Planning page
                <>
                    {/* <button
                        onClick={handleCancelSchedule}
                        style={{
                            padding: "10px 20px",
                            background: "red",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginTop: "20px",
                        }}
                    >
                        Cancel Schedule for {scheduleData.planned_date}, {scheduleData.meal_type_id}
                    </button> */}

                    <button
                        onClick={handleCancelSchedule}
                        style={{
                            padding: "12px 20px",
                            background: "#ff4d4d", // Softer red
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            marginTop: "20px",
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                            transition: "background 0.3s ease",
                        }}
                        onMouseEnter={(e) => (e.target.style.background = "#e63939")}
                        onMouseLeave={(e) => (e.target.style.background = "#ff4d4d")}
                    >
                        <span style={{ fontSize: "20px", fontWeight: "bold" }}>✖</span>
                        Cancel Schedule for{" "}
                        {new Date(scheduleData.planned_date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}{" "}
                        ({mealTypeMap[scheduleData.meal_type_id] || "Unknown"})
                    </button>


                    <button
                        onClick={() =>
                            navigate('/recipes/calendar', {
                                state: { recipeId: id, recipeName: recipe.name },
                            })
                        }
                        style={{
                            padding: "10px 20px",
                            background: "orange",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginTop: "20px",
                        }}
                    >
                        Reschedule Another Meal
                    </button>
                    {/* havnt do passing state for this */}
                </>
            )}


            <h3>Related Recipes</h3>
            <ul>
                {relatedRecipes.map((recipe) => (
                    <li key={recipe.id} onClick={() => navigate(`/recipes/recipe/${recipe.id}`)}>
                        <img
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                            alt={recipe.name}
                            style={{ width: '100px', borderRadius: '10px' }}
                        />
                        {recipe.name}
                    </li>
                ))}
            </ul>

        </div>
    );
};

export default RecipeDetail;