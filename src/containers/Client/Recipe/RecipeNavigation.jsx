import { Routes, Route, Navigate } from 'react-router-dom';
import RecipeDashboard from './Dashboard';
import RecipeExplore from './Recipe';
// import RecipeDetail from './Recipe/%5BrecipeId%5D';
import RecipeDetail from './Recipe/[recipeId]';
import RecipeCalendar from './Calendar';
import RecipeFavorites from './Favorites';


const RecipeNavigation = () => {
    return (
        <Routes>
            {/* Default route within the Recipe module */}
            {/* <Route path="/" element={<Navigate to="/recipes" />} /> */}
            <Route path="/" element={<Navigate to="/recipes/dashboard" />} />

            {/* Recipe Dashboard */}
            <Route path="/dashboard" element={<RecipeDashboard />} />

            {/* Recipe Explore page */}
            <Route path="/recipe" element={<RecipeExplore />} />

            {/* Recipe Detail page */}
            <Route path="/recipe/:id" element={<RecipeDetail />} />

            {/* Recipe Calendar page */}
            <Route path="/calendar" element={<RecipeCalendar />} />

            {/* Favorites page */}
            <Route path="/favorites" element={<RecipeFavorites />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/recipes/dashboard" />} />
        </Routes>
    );
};

export default RecipeNavigation;
