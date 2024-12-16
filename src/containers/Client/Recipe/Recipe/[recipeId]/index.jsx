import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../../../../config/supabaseClient';

const RecipeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [recipe, setRecipe] = useState(null);
    const [tags, setTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [steps, setSteps] = useState([]);
    const [substitutions, setSubstitutions] = useState([]);
    const [selectedSubstitutions, setSelectedSubstitutions] = useState({});
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isFavorite, setIsFavorite] = useState(false);
    const [isCookingMode, setIsCookingMode] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [relatedRecipes, setRelatedRecipes] = useState([]);


    const nutritionFacts = {
        calories: 500,
        protein: 20,
        carbs: 50,
        fat: 15,
    };

    const fetchRecipeDetail = async () => {
        try {
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .select('id, name, description, prep_time, cook_time, image_path')
                .eq('id', id)
                .single();

            if (recipeError) {
                console.error('Error fetching recipe detail:', recipeError);
                return;
            }
            setRecipe(recipeData);

            const [{ data: tagsData }, { data: equipmentData }, { data: ingredientsData }, { data: stepsData }] = await Promise.all([
                supabase.from('recipe_tags').select('tags(name)').eq('recipe_id', id),
                supabase.from('recipe_equipment').select('equipment(name)').eq('recipe_id', id),
                supabase.from('recipe_ingredients').select('quantity, unit, ingredients(name, id)').eq('recipe_id', id),
                supabase.from('steps').select('step_number, instruction, variations').eq('recipe_id', id),
            ]);

            setTags(tagsData?.map((tag) => tag.tags.name) || []);
            setEquipment(equipmentData?.map((equip) => equip.equipment.name) || []);
            setIngredients(ingredientsData || []);
            setSteps(stepsData || []);
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubstitutions = async (ingredientId) => {
        try {
            const { data, error } = await supabase
                .from('ingredient_substitutes')
                .select(`
                    quantity,
                    unit,
                    note,
                    substitute_ingredient:ingredients!ingredient_substitutes_substitute_id_fkey(name, id)
                `)
                .eq('ingredient_id', ingredientId);

            if (error) {
                console.error('Error fetching substitutions:', error);
                return;
            }

            setSubstitutions(data || []);
        } catch (error) {
            console.error('Unexpected error:', error);
        }
    };

    // const fetchRelatedRecipes = async () => {
    //     try {
    //         const { data, error } = await supabase
    //             .from('recipes')
    //             .select('id, name, image_path')
    //             .in('tags', tags);
    
    //         if (error) {
    //             console.error('Error fetching related recipes:', error);
    //             return;
    //         }
    //         setRelatedRecipes(data);
    //     } catch (error) {
    //         console.error('Unexpected error:', error);
    //     }
    // };

    // const fetchRelatedRecipes = async () => {
    //     try {
    //         const { data, error } = await supabase
    //             .from('recipe_tags')
    //             .select(`
    //                 recipes!inner (id, name, image_path)
    //             `)
    //             .eq('tags.id', tagIds) // Filter recipes by tag IDs
    //             .neq('recipes.id', id); // Exclude the current recipe
    
    //         if (error) {
    //             console.error('Error fetching related recipes:', error);
    //             return;
    //         }
    
    //         const uniqueRecipes = [...new Map(data.map((item) => [item.recipes.id, item.recipes])).values()];
    //         setRelatedRecipes(uniqueRecipes);
    //     } catch (error) {
    //         console.error('Unexpected error:', error);
    //     }
    // };

    const fetchRelatedRecipes = async (tagIds) => {
        try {
            const { data, error } = await supabase
                .from('recipe_tags')
                .select(`
                    recipes (id, name, image_path)
                `)
                .in('tag_id', tagIds)
                .neq('recipes.id', id); // Explicitly use 'recipes.id'
    
            console.log('Supabase Response:', data);
    
            if (error) {
                console.error('Error fetching related recipes:', error);
                return;
            }
    
            const uniqueRecipes = [
                ...new Map(data.map((item) => [item.recipes.id, item.recipes])).values(),
            ];
            console.log('Unique Related Recipes:', uniqueRecipes);
            setRelatedRecipes(uniqueRecipes);
        } catch (error) {
            console.error('Unexpected error fetching related recipes:', error);
        }
    };
    
    
    
    // const fetchCurrentRecipeTags = async () => {
    //     const { data, error } = await supabase
    //         .from('recipe_tags')
    //         .select('tags(id)')
    //         .eq('recipe_id', id);
    
    //     if (data) {
    //         const tagIds = data.map((tag) => tag.tags.id);
    //         fetchRelatedRecipes(tagIds); // Pass the tag IDs
    //     } else {
    //         console.error('Error fetching tags:', error);
    //     }
    // };

    const fetchCurrentRecipeTags = async () => {
        try {
            const { data, error } = await supabase
                .from('recipe_tags')
                .select('tag_id')
                .eq('recipe_id', id);
    
            if (error) {
                console.error('Error fetching tags:', error);
                return;
            }
    
            const tagIds = data.map((tag) => tag.tag_id);
            console.log('Tags for current recipe:', tagIds); // Log the fetched tag IDs
            fetchRelatedRecipes(tagIds); // Fetch related recipes using tag IDs
        } catch (error) {
            console.error('Unexpected error fetching tags:', error);
        }
    };
    

    const handleIngredientClick = async (ingredient) => {
        setSelectedIngredient(ingredient);
        await fetchSubstitutions(ingredient.ingredients.id);
        setIsModalOpen(true);
    };

    const handleSubstitutionSelect = (substitution) => {
        setSelectedSubstitutions((prevState) => ({
            ...prevState,
            [selectedIngredient.ingredients.id]: substitution,
        }));
        setIsModalOpen(false);
    };

    const getModifiedSteps = () => {
        return steps.map((step) => {
            if (step.variations) {
                const variation = step.variations[selectedIngredient?.ingredients?.id];
                if (variation) {
                    return {
                        ...step,
                        instruction: variation,
                    };
                }
            }
            return step;
        });
    };

    const startCooking = () => {
        console.log('Selected Substitutions:', selectedSubstitutions);
        navigate(`/recipes/start-cooking/${id}`);
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

    const toggleCookingMode = () => setIsCookingMode((prev) => !prev);

    const shareRecipe = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
    };

    // useEffect(() => {
    //     // Fetch recipe details when the ID changes
    //     fetchRecipeDetail();
    // }, [id]);

    // useEffect(() => {
    //     fetchCurrentRecipeTags();
    // }, [id]);
    
    // useEffect(() => {
    //     // Fetch related recipes only when tags are available
    //     if (tags.length > 0) {
    //         fetchRelatedRecipes();
    //     }
    // }, [tags]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
    
                // 1. Fetch Recipe Details
                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('id, name, description, prep_time, cook_time, image_path')
                    .eq('id', id)
                    .single();
    
                if (recipeError) {
                    console.error('Error fetching recipe detail:', recipeError);
                    setLoading(false);
                    return;
                }
                setRecipe(recipeData);
    
                // 2. Fetch Tags for Current Recipe
                const { data: tagsData, error: tagsError } = await supabase
                    .from('recipe_tags')
                    .select('tag_id')
                    .eq('recipe_id', id);
    
                if (tagsError) {
                    console.error('Error fetching tags:', tagsError);
                    setLoading(false);
                    return;
                }
    
                const tagIds = tagsData.map((tag) => tag.tag_id);
                console.log('Tags for current recipe:', tagIds);
                setTags(tagIds);
    
                // 3. Fetch Related Recipes Based on Tags
                if (tagIds.length > 0) {
                    const { data: relatedData, error: relatedError } = await supabase
                        .from('recipe_tags')
                        .select(`
                            recipes (id, name, image_path)
                        `)
                        .in('tag_id', tagIds)
                        .neq('recipe_id', id);
    
                    if (relatedError) {
                        console.error('Error fetching related recipes:', relatedError);
                        return;
                    }
    
                    const uniqueRecipes = [
                        ...new Map(relatedData.map((item) => [item.recipes.id, item.recipes])).values(),
                    ];
                    console.log('Related Recipes:', uniqueRecipes);
                    setRelatedRecipes(uniqueRecipes);
                }
            } catch (error) {
                console.error('Unexpected error:', error);
            } finally {
                setLoading(false);
            }
        };
    
        fetchAllData();
    }, [id]);
    

    
    

    if (loading) {
        return <div>Loading recipe details...</div>;
    }

    if (!recipe) {
        return <div>Recipe not found!</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
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

            <h3>Ingredients</h3>
            <ul>
                {ingredients.map((ingredient, index) => (
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
                ))}
            </ul>

            <h3>Steps</h3>
            <ol>
                {getModifiedSteps().map((step, index) => (
                    <li key={index}>{step.instruction}</li>
                ))}
            </ol>

            {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '20px',
                        zIndex: 1000,
                    }}
                >
                    <button
                        onClick={() => setIsModalOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'red',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                        }}
                    >
                        X
                    </button>
                    <h2>Substitute for {selectedIngredient?.ingredients?.name}</h2>
                    <ul>
                        {substitutions.map((sub, index) => (
                            <li key={index}>
                                {sub.substitute_ingredient.name} - {sub.quantity} {sub.unit} ({sub.note})
                                <button
                                    onClick={() => handleSubstitutionSelect(sub)}
                                    style={{
                                        marginLeft: '10px',
                                        padding: '5px 10px',
                                        background: '#32cd32',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Use This
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button
                onClick={startCooking}
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    background: '#32cd32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                }}
            >
                Start Cooking
            </button>
            <h3>Steps</h3>
            {!isCookingMode ? (
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
            )}

            <button onClick={() => navigate('/calendar')}>Reschedule</button>

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
