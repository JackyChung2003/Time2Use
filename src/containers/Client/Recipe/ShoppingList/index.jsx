import React, { useEffect, useState } from "react";
import { useRecipeContext } from "../Contexts/RecipeContext";

const ShoppingList = () => {
  const {
    fetchMealPlansByDate,
    fetchRecipesByIds,
    fetchRecipeIngredients,
    fetchUserInventory,
  } = useRecipeContext();
  const [shoppingList, setShoppingList] = useState({ thisWeek: [], nextWeek: [] });
  const [loading, setLoading] = useState(true);
  const [weekStartDay, setWeekStartDay] = useState("Monday"); 
  const [weekDates, setWeekDates] = useState({ thisWeek: [], nextWeek: [] });

  const getWeekDates = (startDay) => {
    const today = new Date();
    const todayDayIndex = today.getDay();
    const startDayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(startDay);

    // Calculate start and end of this week
    const startOfThisWeek = new Date(today);
    if (todayDayIndex < startDayIndex) {
      // If today is before the start of this week
      startOfThisWeek.setDate(today.getDate() - (7 - (startDayIndex - todayDayIndex)));
    } else {
      startOfThisWeek.setDate(today.getDate() - (todayDayIndex - startDayIndex));
    }
    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);

    // Calculate start and end of next week
    const startOfNextWeek = new Date(endOfThisWeek);
    startOfNextWeek.setDate(endOfThisWeek.getDate() + 1);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);

    return {
      thisWeek: [startOfThisWeek, endOfThisWeek],
      nextWeek: [startOfNextWeek, endOfNextWeek],
    };
  };

  const generateShoppingList = async () => {
    setLoading(true);
    try {
      console.log(`Fetching shopping list for the week starting on ${weekStartDay}`);
  
      // Calculate dates for this week and next week
      const { thisWeek, nextWeek } = getWeekDates(weekStartDay);
  
      // Generate dates for this week and next week
      const generateDatesForWeek = (startDate) => {
        const dates = [];
        const current = new Date(startDate);
        for (let i = 0; i < 7; i++) {
          dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        return dates;
      };
  
      const thisWeekDates = generateDatesForWeek(thisWeek[0]);
      const nextWeekDates = generateDatesForWeek(nextWeek[0]);
  
      setWeekDates({
        thisWeek: thisWeekDates.map((date) => date.toISOString().split("T")[0]),
        nextWeek: nextWeekDates.map((date) => date.toISOString().split("T")[0]),
      });
  
      console.log(
        `This Week: ${thisWeekDates.map((date) => date.toISOString().split("T")[0])}`
      );
      console.log(
        `Next Week: ${nextWeekDates.map((date) => date.toISOString().split("T")[0])}`
      );
  
      // Fetch meal plans for each day of the week
      const fetchMealPlansForWeek = async (dates) => {
        const mealPlans = {};
        for (const date of dates) {
          console.log(`Fetching meal plans for date: ${date.toISOString().split("T")[0]}`);
          const dailyMealPlans = await fetchMealPlansByDate(date.toISOString().split("T")[0]);
          mealPlans[date.toISOString().split("T")[0]] = dailyMealPlans;
        }
        return mealPlans;
      };
  
      const thisWeekMealPlans = await fetchMealPlansForWeek(thisWeekDates);
      const nextWeekMealPlans = await fetchMealPlansForWeek(nextWeekDates);
  
      console.log("This Week Meal Plans fetched:", thisWeekMealPlans);
      console.log("Next Week Meal Plans fetched:", nextWeekMealPlans);

      // Count the number of unique recipes for each week
      const countUniqueRecipes = (mealPlans) => {
        const recipeIds = new Set();
        Object.values(mealPlans).forEach((dailyPlans) => {
          dailyPlans.forEach((meal) => recipeIds.add(meal.recipe_id));
        });
        return recipeIds.size;
      };

      const thisWeekRecipeCount = countUniqueRecipes(thisWeekMealPlans);
      const nextWeekRecipeCount = countUniqueRecipes(nextWeekMealPlans);
      
      console.log(`This Week Recipe Count: ${thisWeekRecipeCount}`);
      console.log(`Next Week Recipe Count: ${nextWeekRecipeCount}`);
  
      const processMealPlans = async (mealPlans) => {
        const combinedIngredients = {};
  
        for (const [date, dailyPlans] of Object.entries(mealPlans)) {
          console.log(`Processing meal plans for date: ${date}`);
          if (!dailyPlans.length) continue;
  
          // Fetch recipes for the meal plans
          const recipeIds = dailyPlans.map((meal) => meal.recipe_id);
          console.log(`Fetching recipes with IDs for ${date}:`, recipeIds);
          const recipes = await fetchRecipesByIds(recipeIds);
          console.log(`Recipes fetched for ${date}:`, recipes);
  
          // Fetch and combine ingredients for all recipes
          const recipeIngredients = await Promise.all(
            recipes.map(async (recipe) => {
              console.log(`Fetching ingredients for recipe ID: ${recipe.id} on ${date}`);
              const ingredients = await fetchRecipeIngredients(recipe.id);
              console.log(`Ingredients for recipe ${recipe.id} on ${date}:`, ingredients);
              return ingredients;
            })
          );
  
          // Flatten and sum up quantities for all ingredients
          recipeIngredients.flat().forEach(({ ingredients, quantity, unit }) => {
            if (!combinedIngredients[ingredients.id]) {
              combinedIngredients[ingredients.id] = {
                name: ingredients.name,
                totalQuantity: 0,
                unit: ingredients.unit?.unit_tag || "units",
              };
            }
            combinedIngredients[ingredients.id].totalQuantity += quantity;
          });
        }
        return combinedIngredients;
      };
  
      const thisWeekIngredients = await processMealPlans(thisWeekMealPlans);
      const nextWeekIngredients = await processMealPlans(nextWeekMealPlans);
  
      // Fetch user inventory
      console.log("Fetching user inventory");
      const userInventory = await fetchUserInventory();
      console.log("User inventory fetched:", userInventory);
  
      const calculateShoppingList = (combinedIngredients) => {
        return Object.values(combinedIngredients).map((ingredient) => {
          const inventoryItem =
            userInventory.find((item) => item.ingredient_id === ingredient.id) || {};
          const availableQuantity = inventoryItem.quantity || 0;
          return {
            name: ingredient.name,
            required: ingredient.totalQuantity,
            available: availableQuantity,
            toBuy: Math.max(0, ingredient.totalQuantity - availableQuantity),
            unit: ingredient.unit,
          };
        });
      };
  
      setShoppingList({
        thisWeek: calculateShoppingList(thisWeekIngredients),
        nextWeek: calculateShoppingList(nextWeekIngredients),
      });
    } catch (error) {
      console.error("Error generating shopping list:", error.message);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    generateShoppingList();
  }, [weekStartDay]); // Re-run when weekStartDay changes

  if (loading) return <p>Loading shopping list...</p>;

  return (
    <div>
      <h1>Shopping List</h1>

      {/* Dropdown to select the starting day of the week */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="weekStartDay" style={{ marginRight: "10px" }}>
          Select Week Start Day:
        </label>
        <select
          id="weekStartDay"
          value={weekStartDay}
          onChange={(e) => setWeekStartDay(e.target.value)}
        >
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Saturday">Saturday</option>
          <option value="Sunday">Sunday</option>
        </select>
      </div>

      <div>
        <h2>
          This Week ({weekDates.thisWeek[0]} - {weekDates.thisWeek[6]}) - Ingredient Count: {shoppingList.thisWeek.length || 0}
        </h2>
        {console.log("HEREEEEEEEEEE:",shoppingList)}
        {shoppingList.thisWeek.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "15px" }}>
            <p>
              <strong>{item.name}</strong>: Need {item.required} {item.unit}, Available{" "}
              {item.available} {item.unit}, To Buy {item.toBuy} {item.unit}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2>
          Next Week ({weekDates.nextWeek[0]} - {weekDates.nextWeek[6]}) - Ingredient Count: {shoppingList.nextWeek.length  || 0}
        </h2>
        {shoppingList.nextWeek.map((item, idx) => (
          <div key={idx} style={{ marginBottom: "15px" }}>
            <p>
              <strong>{item.name}</strong>: Need {item.required} {item.unit}, Available{" "}
              {item.available} {item.unit}, To Buy {item.toBuy} {item.unit}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShoppingList;
