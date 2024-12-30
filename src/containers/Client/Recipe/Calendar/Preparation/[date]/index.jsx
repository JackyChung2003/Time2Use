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

  const [selectedInventory, setSelectedInventory] = useState([]); // State to track selected inventory items
  const [adjustingQuantity, setAdjustingQuantity] = useState(false); // Add this state

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

  const allocateInventoryFIFO = (ingredient, inventory) => {
    const target = ingredient.quantity;
    console.log("Target Quantity Needed:", target);
  
    // Step 1: Sort inventory by expiry date first, then by quantity
    const sortedInventory = [...inventory].sort((a, b) => {
      const dateA = new Date(a.expiry_date?.date || "9999-12-31");
      const dateB = new Date(b.expiry_date?.date || "9999-12-31");
      if (dateA - dateB !== 0) {
        return dateA - dateB; // Sort by expiry date first
      }
      return a.quantity - b.quantity; // Then by quantity
    });
  
    console.log("Sorted Inventory by Expiry and Quantity:", sortedInventory);
  
    // Step 2: Find the optimal combination of items
    let remainingRequired = target;
    const selectedItems = [];
    for (let i = 0; i < sortedInventory.length; i++) {
      const item = sortedInventory[i];
  
      // If the current item's quantity alone satisfies the requirement, take it and stop
      if (item.quantity >= remainingRequired) {
        selectedItems.push({
          ...item,
          selectedQuantity: remainingRequired,
          preselected: true,
        });
        remainingRequired = 0;
        break;
      }
  
      // Otherwise, take the current item fully and subtract its quantity from the requirement
      selectedItems.push({
        ...item,
        selectedQuantity: item.quantity,
        preselected: true,
      });
      remainingRequired -= item.quantity;
  
      // If the requirement is satisfied, stop
      if (remainingRequired <= 0) {
        break;
      }
    }
  
    console.log("Selected Items:", selectedItems);
  
    // Step 3: Mark the remaining inventory as unselected
    const finalInventory = sortedInventory.map((item) => {
      const selectedItem = selectedItems.find((selected) => selected.id === item.id);
      return selectedItem
        ? selectedItem
        : { ...item, preselected: false, selectedQuantity: 0 }; // Mark unselected
    });
  
    console.log("Final Allocated Inventory:", finalInventory);
  
    return finalInventory;
  };

  const handleIngredientClick = async (ingredient) => {
    try {
      const inventory = await fetchUserInventory(ingredient.ingredients.id);
      console.log('ingredient:', ingredient);
      console.log("Fetched Inventory:", inventory);
      // Use FIFO Allocation for suggestions
      const allocatedInventory = allocateInventoryFIFO(ingredient, inventory);
      
      console.log("Allocated Inventory:", allocatedInventory);
      setSelectedIngredient(ingredient);
      setInventoryItems(inventory); // Full inventory list
      setSelectedInventory(allocatedInventory); // Include preselected suggestions
    } catch (error) {
      console.error("Error fetching inventory for ingredient:", error.message);
    }
  };
  
  const toggleInventorySelection = (item) => {
    setSelectedInventory((prevSelected) => {
      const exists = prevSelected.find((selected) => selected.id === item.id);
  
      // if (exists) {
      //   // If already selected, remove from selectedInventory
      //   return prevSelected.filter((selected) => selected.id !== item.id);
      // }
  
      if (exists) {
        // If already selected, toggle off
        return prevSelected.map((selected) =>
          selected.id === item.id
            ? { ...selected, preselected: !selected.preselected }
            : selected
        );
      }

      // If not selected, add to selectedInventory
      return [
        ...prevSelected,
       {
          ...item,
          selectedQuantity: item.selectedQuantity || 0, // Default to a small quantity if none exists
          preselected: true, // Mark as preselected
        },
      ];
    });
  };

  const validateSelection = () => {
    const totalSelectedQuantity = selectedInventory.reduce(
      (sum, item) => sum + item.selectedQuantity,
      0
    );
    return totalSelectedQuantity >= selectedIngredient.quantity;
  };
  
  const finalizeSelection = () => {
    const total = getTotalAdjustedQuantity();
    if (capped && total < selectedIngredient.quantity) {
      alert(`You must select at least ${selectedIngredient.quantity}.`);
      return;
    }
    console.log("Finalized Quantities:", selectedInventory);
    setSelectedIngredient(null); // Close the modal
    setSelectedInventory([]); // Clear selection
  };
  
  const getTotalAdjustedQuantity = () => {
    return selectedInventory.reduce((sum, item) => sum + (item.selectedQuantity || 0), 0);
  };
  
  // const confirmSelection = () => {
  //   if (validateSelection() || !capped) { // If valid or uncapped
  //     console.log("Selected Inventory Items:", selectedInventory);
  
  //     // Initialize selectedQuantity for adjustment
  //     setSelectedInventory((prevSelected) =>
  //       prevSelected.map((item) => ({
  //         ...item,
  //         // selectedQuantity: item.quantity, // Initialize selectedQuantity with current quantity
  //         selectedQuantity: item.selectedQuantity || 0, // Ensure it has a value
  //       }))
  //     );
  
  //     setAdjustingQuantity(true); // Move to adjustment step
  //   } else {
  //     alert(
  //       `Selected quantity (${getTotalAdjustedQuantity()} ${
  //         selectedIngredient.ingredients.unit?.unit_tag || ""
  //       }) is less than the required amount (${selectedIngredient.quantity} ${
  //         selectedIngredient.ingredients.unit?.unit_tag || ""
  //       }).`
  //     );
  //   }
  // };

  const confirmSelection = () => {
    const currentlySelected = selectedInventory.filter((item) => item.preselected);
  
    const totalSelectedQuantity = currentlySelected.reduce(
      (sum, item) => sum + (item.selectedQuantity || item.quantity), // Use `selectedQuantity` if present
      0
    );
  
    if (totalSelectedQuantity >= selectedIngredient.quantity || !capped) {
      console.log("Confirmed Inventory Selection:", currentlySelected);
  
      // Initialize selectedQuantity for adjustment if needed
      setSelectedInventory((prevSelected) =>
        prevSelected.map((item) =>
          currentlySelected.find((selected) => selected.id === item.id)
            ? {
                ...item,
                selectedQuantity: item.selectedQuantity || item.quantity, // Initialize with current quantity
              }
            : item
        )
      );
  
      setAdjustingQuantity(true); // Proceed to adjustment step
    } else {
      alert(
        `Selected quantity (${totalSelectedQuantity} ${
          selectedIngredient.ingredients.unit?.unit_tag || ""
        }) is less than the required amount (${selectedIngredient.quantity} ${
          selectedIngredient.ingredients.unit?.unit_tag || ""
        }).`
      );
    }
  };
  

  const adjustQuantity = (itemId, delta) => {
    setSelectedInventory((prevSelected) => {
      const updated = prevSelected.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.selectedQuantity + delta);
          return { ...item, selectedQuantity: newQuantity };
        }
        return item;
      });
  
      if (capped) {
        const total = updated.reduce((sum, item) => sum + item.selectedQuantity, 0);
        if (total > selectedIngredient.quantity) {
          const excess = total - selectedIngredient.quantity;
          return adjustForExcess(updated, itemId, excess);
        }
      }
      return updated;
    });
  };
  
  const adjustForExcess = (inventory, excludeItemId, excess) => {
    return inventory.map((item) => {
      if (item.id === excludeItemId || excess <= 0) return item;
      const deduction = Math.min(item.selectedQuantity, excess);
      excess -= deduction;
      return { ...item, selectedQuantity: item.selectedQuantity - deduction };
    });
  };
  

  const adjustOtherItems = (excludeItemId, excess) => {
    setSelectedInventory((prevSelected) =>
      prevSelected.map((item) => {
        if (item.id === excludeItemId || excess <= 0) return item;
        const deduction = Math.min(item.selectedQuantity, excess);
        excess -= deduction;
        return { ...item, selectedQuantity: item.selectedQuantity - deduction };
      })
    );
  };
  
  const getTotalQuantity = () =>
    inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

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

      {/* {selectedIngredient && (
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
                  {item.quantity} 
                  (Unit in Inventory: {item.unit.unit_tag})
                  (Unit in Ingredient: {item.ingredients.unit.unit_tag})
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
      )} */}

      {/* {selectedIngredient && (
        <div className="modal-overlay" onClick={() => setSelectedIngredient(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", padding: "20px", borderRadius: "10px" }}
          >
            <h3>Select Inventory for: {selectedIngredient.ingredients.name}</h3>
            <p>
              <strong>Required:</strong> {selectedIngredient.quantity} {selectedIngredient.ingredients.unit?.unit_tag || ""}
            </p>
            <p>
              <strong>Your Selection:</strong> {selectedInventory.reduce((sum, item) => sum + item.quantity, 0)}{" "}
              {selectedIngredient.ingredients.unit?.unit_tag || ""}
            </p>
            
            <div>
              <label style={{ display: "block", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  checked={!capped}
                  onChange={() => setCapped(!capped)}
                />
                Ignore minimum required quantity
              </label>
            </div>

            <ul>
              {inventoryItems.map((item) => (
                <li key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!selectedInventory.find((selected) => selected.id === item.id)}
                      onChange={() => toggleInventorySelection(item)}
                    />
                    {item.quantity} {item.ingredients.unit.unit_tag || ""} (Expiry:{" "}
                    {item.expiry_date?.date || "No expiry date"})
                  </label>
                </li>
              ))}
            </ul>

            <button
              onClick={confirmSelection}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                background: "green",
                color: "white",
                borderRadius: "5px",
              }}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )} */}

      {selectedIngredient && (
        <div className="modal-overlay" onClick={() => setSelectedIngredient(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", padding: "20px", borderRadius: "10px" }}
          >
            {!adjustingQuantity ? (
              <>
                <h3>Select Inventory for: {selectedIngredient.ingredients.name}</h3>
                <p>
                  <strong>Required:</strong> {selectedIngredient.quantity}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                </p>
                <p>
                  <strong>Your Selection:</strong>{" "}
                  {/* {selectedInventory.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                   */}
                  {selectedInventory
                    .filter((item) => item.preselected) // Only count selected items
                    .reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                </p>

                <ul>
                  {inventoryItems.map((item) => (
                    <li key={item.id}
                    style={{
                      backgroundColor: selectedInventory.find((selected) => selected.id === item.id)?.preselected
                        ? "lightgreen"
                        : "white",
                      padding: "5px",
                      borderRadius: "5px",
                    }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          // checked={!!selectedInventory.find(
                          //   (selected) => selected.id === item.id
                          // )}

                          // checked={
                          //   !!selectedInventory.find(
                          //     (selected) => selected.id === item.id && selected.preselected
                          //   )
                          // }

                          // checked={
                          //   !!selectedInventory.find((selected) => selected.id === item.id)
                          // }
                          // checked={
                          //   // !!selectedInventory.find((selected) => selected.id === item.id && selected.preselected)
                          //   !!selectedInventory.find((selected) => selected.id === item.id)?.preselected                          }

                          // checked={!!selectedInventory.find((selected) => selected.id === item.id)}
                          checked={selectedInventory.find((selected) => selected.id === item.id)?.preselected || false}
  
                          onChange={() => toggleInventorySelection(item)}
                        />
                        {item.quantity} {item.unit?.unit_tag || ""} (Expiry:{" "}
                        {item.expiry_date?.date || "No expiry date"})
                      </label>
                    </li>
                    
                  ))}
                </ul>

                <button
                  onClick={confirmSelection}
                  style={{
                    marginTop: "10px",
                    padding: "10px 20px",
                    background: "green",
                    color: "white",
                    borderRadius: "5px",
                  }}
                >
                  Confirm Selection
                </button>
              </>
            ) : (
              <>
                <h3>Adjust Quantities for: {selectedIngredient.ingredients.name}</h3>
                <p>
                  <strong>Required:</strong> {selectedIngredient.quantity}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                </p>
                <p>
                  <strong>Your Adjusted Total:</strong>{" "}
                  {selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0)}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                </p>

                <div>
                  <label style={{ display: "block", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={capped}
                      onChange={() => setCapped(!capped)}
                    />
                    Cap total to match required quantity
                  </label>
                </div>

                <ul>
                  {selectedInventory.map((item) => (
                    <li key={item.id}>
                      <label>
                        {item.quantity} {item.unit?.unit_tag || ""} (Expiry:{" "}
                        {item.expiry_date?.date || "No expiry date"})
                      </label>
                      <button
                        onClick={() => adjustQuantity(item.id, -1)}
                        disabled={
                          item.selectedQuantity <= 0 ||
                          (capped &&
                            getTotalAdjustedQuantity() <= selectedIngredient.quantity)
                        }
                      >
                        -
                      </button>
                      <span> {item.selectedQuantity} </span>
                      <button
                        onClick={() => adjustQuantity(item.id, 1)}
                        disabled={
                          item.selectedQuantity >= item.quantity ||
                          (capped &&
                            getTotalAdjustedQuantity() >= selectedIngredient.quantity)
                        }
                      >
                        +
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={finalizeSelection}
                  style={{
                    marginTop: "10px",
                    padding: "10px 20px",
                    background: "green",
                    color: "white",
                    borderRadius: "5px",
                  }}
                >
                  Finalize Quantities
                </button>
              </>
            )}
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
