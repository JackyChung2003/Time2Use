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

    useEffect(() => {
        fetchRecipeDetail();
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
            <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                alt={recipe.name}
                style={{ width: '300px', borderRadius: '10px', marginBottom: '20px' }}
            />
            <p>{recipe.description}</p>
            <p>Prep Time: {recipe.prep_time} mins</p>
            <p>Cook Time: {recipe.cook_time} mins</p>

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
        </div>
    );
};

export default RecipeDetail;
