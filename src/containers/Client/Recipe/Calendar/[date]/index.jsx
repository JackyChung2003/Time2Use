import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRecipeContext } from "../../Contexts/RecipeContext";
import "./index.css"; // Custom styles

const MealPlannerPage = () => {
    const { date } = useParams(); // Get the date from the URL
    const { fetchMealPlansByDate, fetchRecipesByIds, mealTypes } = useRecipeContext();
    const [mealPlans, setMealPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({}); // Track expanded sections
    const [mergedImages, setMergedImages] = useState({}); // Store merged images for each section

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch meal plans for the given date
                const plans = await fetchMealPlansByDate(date);

                // Extract recipe IDs from meal plans
                const recipeIds = plans.map((plan) => plan.recipe_id);

                // Fetch recipe details for the extracted IDs
                const recipes = await fetchRecipesByIds(recipeIds);

                // Merge recipe details into meal plans
                const enrichedMealPlans = plans.map((plan) => ({
                    ...plan,
                    recipe: recipes.find((recipe) => recipe.id === plan.recipe_id),
                }));

                setMealPlans(enrichedMealPlans);

                // Generate merged images for each meal type
                const images = {};
                mealTypes.forEach((mealType) => {
                    const mealsForType = enrichedMealPlans.filter(
                        (meal) => meal.meal_type_name === mealType.name
                    );
                    images[mealType.name] = mergeImagesForMealType(mealsForType);
                });
                setMergedImages(images);
            } catch (error) {
                console.error("Error fetching meal plans or recipes:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [date, fetchMealPlansByDate, fetchRecipesByIds, mealTypes]);

    const mergeImagesForMealType = (mealsForType) => {
        if (mealsForType.length === 0) return null;

        if (mealsForType.length === 1) {
            // If only one meal, return its image
            return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${mealsForType[0].recipe?.image_path}`;
        }

        // If multiple meals, merge the first two images for simplicity
        const images = mealsForType.slice(0, 2).map(
            (meal) =>
                `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${meal.recipe?.image_path}`
        );

        return images; // Return array of two images for merging
    };

    const toggleSection = (mealType) => {
        setExpandedSections((prev) => ({
            ...prev,
            [mealType]: !prev[mealType], // Toggle the section
        }));
    };

    if (loading) {
        return <div className="meal-planner-container">Loading...</div>;
    }

    return (
        <div className="meal-planner-container">
            <header className="meal-planner-header">
                <div className="date-display">
                    <p>{date}</p>
                </div>
            </header>

            {mealTypes.map((mealType) => {
                // Filter meal plans for the current meal type
                const mealsForType = mealPlans.filter(
                    (meal) => meal.meal_type_name === mealType.name
                );

                return (
                    <div key={mealType.id} className="meal-section">
                        <div
                            className="meal-section-header"
                            onClick={() => toggleSection(mealType.name)}
                        >
                            <div className="meal-header-image">
                                {mergedImages[mealType.name] &&
                                Array.isArray(mergedImages[mealType.name]) ? (
                                    <div className="merged-images">
                                        <img
                                            src={mergedImages[mealType.name][0]}
                                            alt="Meal 1"
                                            className="meal-merged-image"
                                        />
                                        <img
                                            src={mergedImages[mealType.name][1]}
                                            alt="Meal 2"
                                            className="meal-merged-image"
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={mergedImages[mealType.name]}
                                        alt="Single Meal"
                                        className="meal-merged-image"
                                    />
                                )}
                            </div>
                            <h2>{mealType.name}</h2>
                            <span>
                                {expandedSections[mealType.name] ? "▲" : "▼"}
                            </span>
                        </div>

                        {expandedSections[mealType.name] && (
                            <div className="meal-list">
                                {mealsForType.map((meal, idx) => (
                                    <div key={idx} className="meal-item">
                                        <img
                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${meal.recipe?.image_path || "path/to/default/image.jpg"}`}
                                            alt={meal.recipe?.name || "Meal Image"}
                                            className="meal-image"
                                        />
                                        <div className="meal-overlay">
                                            <span className="meal-name">
                                                {meal.recipe?.name || "Unknown Recipe"}
                                            </span>
                                            <p className="meal-notes">{meal.notes}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MealPlannerPage;
