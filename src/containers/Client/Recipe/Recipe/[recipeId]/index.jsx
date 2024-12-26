import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../../../../config/supabaseClient';

import BackButton from '../../../../../components/Button/BackButton';

import { useRecipeContext } from '../../Contexts/RecipeContext';

const RecipeDetail = () => {

    const { recipes, fetchRecipeIngredients, fetchRecipeSteps } = useRecipeContext();

    const { id } = useParams();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isFavorite, setIsFavorite] = useState(false);
    const [isCookingMode, setIsCookingMode] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0); // Tracks the current step
    
    const [relatedRecipes, setRelatedRecipes] = useState([]);

    const [servingPacks, setServingPacks] = useState(2); // Default servings (e.g., 2 servings)
    const [defaultServings, setDefaultServings] = useState(1); // Original serving size from the recipe


    const nutritionFacts = {
        calories: 500,
        protein: 20,
        carbs: 50,
        fat: 15,
    };

    useEffect(() => {
        const selectedRecipe = recipes.find((recipe) => recipe.id === parseInt(id));
        if (selectedRecipe) {
            setRecipe(selectedRecipe);
            fetchRecipeIngredients(selectedRecipe.id).then(setIngredients);
            fetchRecipeSteps(selectedRecipe.id).then(setSteps);
        } else {
            setRecipe(null);
        }
        setLoading(false);
    }, [id, recipes, fetchRecipeIngredients, fetchRecipeSteps]);

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

    const toggleCookingMode = () => setIsCookingMode((prev) => !prev);

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

            <h3>Nutrition Facts</h3>
            <ul>
                <li>Calories: {nutritionFacts.calories} kcal</li>
                <li>Protein: {nutritionFacts.protein} g</li>
                <li>Carbs: {nutritionFacts.carbs} g</li>
                <li>Fats: {nutritionFacts.fat} g</li>
            </ul>
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

            <button onClick={toggleCookingMode}>Start Cooking Mode</button>

            {/* Cooking Mode Overlay */}
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

            <button
                onClick={() =>
                    navigate('/recipes/calendar', {
                        state: { recipeId: id, recipeName: recipe.name },
                    })
                }
            >
                Reschedule
            </button>

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