import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import supabase from '../../../../../config/supabaseClient';

const RecipeDetail = () => {
    const { id } = useParams(); // Get recipe ID from URL
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRecipeDetail = async () => {
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('id, name, description, image_path')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching recipe detail:', error);
                return;
            }

            setRecipe(data);
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
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
        </div>
    );
};

export default RecipeDetail;
