import { Routes, Route, Navigate } from 'react-router-dom';
import RecipeDashboard from './Dashboard';
import RecipeExplore from './Recipe';
// import RecipeDetail from './Recipe/%5BrecipeId%5D';
import RecipeDetail from './Recipe/[recipeId]';
import RecipeCalendar from './Calendar';
import RecipeFavorites from './Favorites';
import Chatbot from './Chatbot';


const RecipeNavigation = () => {
    return (
        <div style={{ position: 'relative' }}>  
            <Routes>
                {/* Default route within the Recipe module */}
                <Route path="/" element={<Navigate to="dashboard" />} />

                {/* Recipe Dashboard */}
                <Route path="dashboard" element={<RecipeDashboard />} />

                {/* Recipe Explore page */}
                <Route path="explore" element={<RecipeExplore />} />

                {/* Recipe Detail page */}
                <Route path="recipe/:id" element={<RecipeDetail />} />

                {/* Recipe Calendar page */}
                <Route path="calendar" element={<RecipeCalendar />} />

                {/* Favorites page */}
                <Route path="favorites" element={<RecipeFavorites />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="dashboard" />} />
            </Routes>
            
            {/* Chatbot Button */}
            <Chatbot />
        </div>
    );
};

export default RecipeNavigation;
