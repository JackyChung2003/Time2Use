import { useParams } from 'react-router-dom';

const RecipeDetail = () => {
    const { id } = useParams();

    return (
        <div>
            <h1>Recipe Details</h1>
            <p>Details for recipe ID: {id}</p>
            {/* Display recipe details, ingredients, steps, etc. */}
        </div>
    );
};

export default RecipeDetail;