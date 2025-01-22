import { Routes, Route, Navigate } from 'react-router-dom';
import { RecipeProvider } from "./Contexts/RecipeContext";
import { useEffect } from 'react';
import RecipeDashboard from './Dashboard';
import RecipeExplore from './Recipe';
// import RecipeDetail from './Recipe/%5BrecipeId%5D';
import RecipeDetail from './Recipe/[recipeId]';
import RecipeCalendar from './Calendar';
import MealPlannerPage from './Calendar/[date]';

import RecipePreparationPage from './Calendar/Preparation/[date]';

import RecipeFavorites from './Favorites';

// import ShoppingList from './ShoppingList';

import ErrorBoundary from '../../../components/ErrorBoundary';
import Chatbot from './Chatbot';


const RecipeNavigation = () => {

    useEffect(() => {
              // Add scan-page class to body when this page is loaded
              document.body.classList.add('page');
      
              // Clean up when the component is unmounted
              return () => {
                  document.body.classList.remove('page');
              };
          }, []);

    return (
        <div style={{ position: 'relative' }}>  
            <RecipeProvider>
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
                    <Route path="calendar/:date" element={<MealPlannerPage />} />
                    {/* Recipe Preparation page */}
                    <Route path="calendar/preparation/:date" element={<RecipePreparationPage />} />


                    {/* Favorites page */}
                    <Route path="favorites" element={<RecipeFavorites />} />

                    {/* shopping list Page*/}
                    {/* <Route path="shopping-list" element={<ShoppingList />} /> */}

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="dashboard" />} />
                </Routes>
                
                {/* Chatbot Button */}
                <ErrorBoundary>
                    <Chatbot />
                </ErrorBoundary>
            </RecipeProvider>
        </div>
    );
};

export default RecipeNavigation;
