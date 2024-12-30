import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRecipeContext } from "../../../../../../containers/Client/Recipe/Contexts/RecipeContext";
import BackButton from "../../../../../../components/Button/BackButton";
import supabase from "../../../../../../config/supabaseClient";

import SortableRecipeList from "../../../../../../components/SortableDragAndDrop/Recipes_List/SortableRecipeList";
import "./index.css"; // Add custom styles if needed

const RecipePreparationPage = () => { 
  // const { fetchRecipeIngredients, fetchRecipeSteps, mealTypes } = useRecipeContext();
  const {
    fetchMealPlansByDate,
    fetchRecipesByIds,
    fetchRecipeIngredients,
    fetchRecipeSteps,
    fetchUserInventory,
    mealTypes,
  } = useRecipeContext();

  const navigate = useNavigate();
  const { date } = useParams(); // Get date from URL
  const location = useLocation();
  const { planned_date, meal_type_id } = location.state || {};

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [mergedIngredients, setMergedIngredients] = useState([]);
  const [isCombined, setIsCombined] = useState(true);

  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [capped, setCapped] = useState(true); // To toggle capped/uncapped mode

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch meal plans for the given date
        const mealPlans = await fetchMealPlansByDate(planned_date);
        const relevantPlans = mealPlans.filter(
          (meal) => meal.meal_type_id === meal_type_id
        );

        if (relevantPlans.length === 0) {
          console.warn("No meal plans found for the given date and meal type.");
          setRecipes([]);
          return;
        }

        // Extract recipe IDs and fetch recipes
        const recipeIds = relevantPlans.map((meal) => meal.recipe_id);
        const fetchedRecipes = await fetchRecipesByIds(recipeIds);
        setRecipes(fetchedRecipes);

        // Fetch ingredients and steps for each recipe
        const allIngredients = [];
        const allSteps = [];
        for (const recipe of fetchedRecipes) {
          const ingredientsData = await fetchRecipeIngredients(recipe.id);
          const stepsData = await fetchRecipeSteps(recipe.id);

          allIngredients.push(
            ...ingredientsData.map((ingredient) => ({
              ...ingredient,
              recipeId: recipe.id,
            }))
          );
          allSteps.push(...stepsData);
        }

        setIngredients(allIngredients);
        setSteps(allSteps);

        // Merge ingredients
        const merged = allIngredients.reduce((acc, ingredient) => {
          const existing = acc.find(
            (item) => item.ingredients.name === ingredient.ingredients.name
          );
          if (existing) {
            existing.quantity += ingredient.quantity;
          } else {
            acc.push({ ...ingredient });
          }
          return acc;
        }, []);
        setMergedIngredients(merged);
      } catch (error) {
        console.error("Error loading data:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (planned_date && meal_type_id) {
      loadData();
    }
  }, [planned_date, meal_type_id, fetchMealPlansByDate, fetchRecipesByIds, fetchRecipeIngredients, fetchRecipeSteps]);

  const toggleCombineIngredients = () => {
    setIsCombined(!isCombined);
  };

  const startCooking = () => {
    setShowModal(true);
  };
  
  const confirmSequence = () => {
    setShowModal(false);
    console.log("Confirmed cooking sequence:", recipes);
    // Proceed to cooking steps logic
  };
  
  const closeModal = () => {
    setShowModal(false);
  };

  const handleIngredientClick = async (ingredient) => {
    try {
      const inventory = await fetchUserInventory(ingredient.ingredients.id);
      setSelectedIngredient(ingredient);
      setInventoryItems(inventory);
    } catch (error) {
      console.error("Error fetching inventory for ingredient:", error.message);
    }
  };

  const adjustQuantity = (itemId, delta) => {
    setInventoryItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  };
  
  const getTotalQuantity = () =>
    inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

  // const confirmInventorySelection = async () => {
  //   try {
  //     const updates = inventoryItems.map((item) => ({
  //       ingredient_id: selectedIngredient.ingredients.id,
  //       inventory_id: item.id,
  //       used_quantity: item.quantity, // Adjusted quantity
  //       meal_plan_id: /* Add logic to fetch meal_plan_id */,
  //     }));
  
  //     const { data, error } = await supabase
  //       .from("Inventory_meal_plan") // Replace with your table name
  //       .insert(updates);
  //     if (error) throw error;
  
  //     setSelectedIngredient(null);
  //     console.log("Saved successfully:", data);
  //   } catch (err) {
  //     console.error("Error saving to Inventory_meal_plan:", err.message);
  //   }
  // };
 
  const confirmInventorySelection = async () => {
    try {
      // Ensure `meal_plan_id` is defined. Replace this logic with your actual source of `meal_plan_id`.
      const meal_plan_id = location.state?.meal_plan_id || "your_default_meal_plan_id";
  
      if (!meal_plan_id) {
        console.error("Meal plan ID is missing");
        return;
      }
  
      const updates = inventoryItems.map((item) => ({
        ingredient_id: selectedIngredient.ingredients.id,
        inventory_id: item.id,
        used_quantity: item.quantity, // Adjusted quantity
        meal_plan_id, // Use the meal_plan_id
      }));
  
      const { data, error } = await supabase
        .from("Inventory_meal_plan") // Replace with your table name
        .insert(updates); // Insert updates array
  
      if (error) throw error;
  
      setSelectedIngredient(null); // Close the modal
      console.log("Saved successfully:", data);
    } catch (err) {
      console.error("Error saving to Inventory_meal_plan:", err.message);
    }
  };
  
  
  

  if (loading) {
    return <div>Loading preparation details...</div>;
  }

  if (recipes.length === 0) {
    return <div>No recipes found for this meal plan.</div>;
  }

  return (
    <div className="recipe-preparation-page">
      <BackButton onClick={() => navigate(-1)} />
      <h1>Recipe Preparation</h1>
      <h3>Date: {planned_date}</h3>
      <h3>Meal Type: {mealTypes.find((type) => type.id === meal_type_id)?.name || "Unknown"}</h3>

      {isCombined ? (
        <>
          <div>
            <h3>Recipes</h3>
            {recipes.map((recipe) => (
              <div key={recipe.id} className="recipe-details">
                <h2>{recipe.name}</h2>
                <img
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                  alt={recipe.name}
                  style={{ width: "300px", borderRadius: "10px" }}
                  />
                <p>{recipe.description}</p>
                <p>
                  <strong>Prep Time:</strong> {recipe.prep_time} mins
                </p>
                <p>
                  <strong>Cook Time:</strong> {recipe.cook_time} mins
                </p>
              </div>
            ))}
          </div>
          {/* <div>
            <h3>Merged Ingredients</h3>
            <ul>
              {mergedIngredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.ingredients.name} - {ingredient.quantity} {ingredient.ingredients.unit?.unit_tag || ""}
                </li>
              ))}
            </ul>
          </div> */}
          <div>
            <h3>Merged Ingredients</h3>
            <ul>
              {mergedIngredients.map((ingredient, index) => (
                <li
                  key={index}
                  onClick={() => handleIngredientClick(ingredient)}
                  style={{ cursor: "pointer", color: "blue" }}
                >
                  {ingredient.ingredients.name} - {ingredient.quantity}{" "}
                  {ingredient.ingredients.unit?.unit_tag || ""}
                </li>
              ))}
            </ul>
          </div>

        </>
      ) : (
        recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-details">
            <h2>{recipe.name}</h2>
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
              alt={recipe.name}
              style={{ width: "300px", borderRadius: "10px" }}
            />
            <p>{recipe.description}</p>
            <p>
              <strong>Prep Time:</strong> {recipe.prep_time} mins
            </p>
            <p>
              <strong>Cook Time:</strong> {recipe.cook_time} mins
            </p>
            <div>
              <h3>Ingredients</h3>
              <ul>
                {ingredients
                  .filter((ingredient) => ingredient.recipeId === recipe.id)
                  .map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.ingredients.name} - {ingredient.quantity} {ingredient.ingredients.unit?.unit_tag || ""}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ))
      )}

      <button
        onClick={toggleCombineIngredients}
        style={{
          padding: "10px 20px",
          background: isCombined ? "red" : "green",
          color: "white",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        {isCombined ? "Separate Ingredients" : "Combine Ingredients"}
      </button>

      <button
        onClick={startCooking}
        style={{
          padding: "10px 20px",
          background: "orange",
          color: "white",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        Start Cooking
      </button>

      {selectedIngredient && (
        <div className="modal-overlay" onClick={() => setSelectedIngredient(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", padding: "20px", borderRadius: "10px" }}
          >
            <h3>Adjust Inventory for: {selectedIngredient.ingredients.name}</h3>
            <ul>
              {inventoryItems.map((item) => (
                <li key={item.id}>
                  {/* {item.quantity} {item.quantity_unit_id} (Expiry: {item.expiry_date}) */}
                  {item.quantity} 
                  {item.unit.unit_tag}
                  (Expiry: {item.expiry_date.date})
                  <button
                    onClick={() => adjustQuantity(item.id, -1)}
                    disabled={item.quantity <= 0 || (capped && getTotalQuantity() <= 0)}
                  >
                    -
                  </button>
                  <button
                    onClick={() => adjustQuantity(item.id, 1)}
                    disabled={capped && getTotalQuantity() >= selectedIngredient.quantity}
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setCapped(!capped)}>
              {capped ? "Uncap Quantities" : "Cap Quantities"}
            </button>
            <button onClick={confirmInventorySelection}>Confirm</button>
          </div>
        </div>
      )}


      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3>Arrange Cooking Sequence</h3>
            {/* <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={recipes.map((recipe) => recipe.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {recipes.map((recipe) => (
                    <SortableRecipe key={recipe.id} id={recipe.id} recipe={recipe} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext> */}

            <SortableRecipeList recipes={recipes} setRecipes={setRecipes} />
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  background: "red",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "5px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSequence}
                style={{
                  background: "green",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "5px",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecipePreparationPage;
