import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRecipeContext } from "../../Contexts/RecipeContext";
import "./index.css"; // Custom styles

const MealPlannerPage = () => {
    const { date } = useParams(); // Get the date from the URL
    const { fetchMealPlansByDate, fetchRecipesByIds } = useRecipeContext(); // Access new function
    const [mealPlans, setMealPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch meal plans for the given date
                const plans = await fetchMealPlansByDate(date);
                // console.log("Meal plans:", plans);

                // Extract recipe IDs from meal plans
                const recipeIds = plans.map((plan) => plan.recipe_id);

                // Fetch recipe details for the extracted IDs
                const recipes = await fetchRecipesByIds(recipeIds);
                // console.log("Recipes:", recipes);

                // Merge recipe details into meal plans
                const enrichedMealPlans = plans.map((plan) => ({
                    ...plan,
                    recipe: recipes.find((recipe) => recipe.id === plan.recipe_id),
                }));

                console.log("Enriched meal plans:", enrichedMealPlans);

                setMealPlans(enrichedMealPlans);
            } catch (error) {
                console.error("Error fetching meal plans or recipes:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [date, fetchMealPlansByDate, fetchRecipesByIds]);

    if (loading) {
        return <div className="meal-planner-container">Loading...</div>;
    }

    return (
        <div className="meal-planner-container">
            <header className="meal-planner-header">
                <button className="nav-button">{'<'}</button>
                <div className="date-display">
                    <p>{date}</p>
                </div>
                <button className="nav-button">{'>'}</button>
            </header>

            {mealPlans.length > 0 ? (
                <div className="meal-list">
                    {mealPlans.map((meal, index) => (
                        <div key={index} className="meal-item">
                            <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${meal.recipe?.image_path || "path/to/default/image.jpg"}`} // Recipe image
                                alt={meal.recipe?.name || "Meal Image"}
                                className="meal-image"
                            />
                            <div className="meal-overlay">
                                <span className="meal-name">
                                    {meal.meal_type_name}: {meal.recipe?.name || "Unknown Recipe"}
                                </span>
                                <p className="meal-notes">{meal.notes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No meals planned for this date.</p>
            )}
        </div>
    );
};

export default MealPlannerPage;
