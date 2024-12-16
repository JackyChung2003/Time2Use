import { useLocation } from 'react-router-dom';
import BackButton from '../../../../components/Button/BackButton';

const RecipeCalendar = () => {
    const location = useLocation();
    const { recipeId, recipeName } = location.state || {};

    return (
        <div>
            <BackButton />
            <h1>Recipe Calendar</h1>
            {recipeId && (
                <p>
                    Rescheduling for: <strong>{recipeName}</strong> (ID: {recipeId})
                </p>
            )}
            {/* Calendar component for scheduling meals */}
        </div>
    );
};

export default RecipeCalendar;