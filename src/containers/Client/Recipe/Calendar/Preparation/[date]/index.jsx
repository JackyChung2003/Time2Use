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
      setSelectedIngredient(null); // Clear previous selection
      setInventoryItems([]); // Reset inventory items
      setSelectedInventory([]); // Reset selected inventory
      setAdjustingQuantity(false); // Reset adjusting state

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
  //   const currentlySelected = selectedInventory.filter((item) => item.preselected);
  
  //   const totalSelectedQuantity = currentlySelected.reduce(
  //     (sum, item) => sum + (item.selectedQuantity || item.quantity), // Use `selectedQuantity` if present
  //     0
  //   );

  //   if ((!capped && currentlySelected.length === 0) || (capped && totalSelectedQuantity < selectedIngredient.quantity)) {
  //     alert(
  //       `You must select at least ${
  //         capped ? selectedIngredient.quantity : "one item"
  //       } to proceed.`
  //     );
  //     return;
  //   }
  
  //   if (totalSelectedQuantity >= selectedIngredient.quantity || !capped) {
  //     console.log("Confirmed Inventory Selection:", currentlySelected);
  
  //     // Initialize selectedQuantity for adjustment if needed
  //     setSelectedInventory((prevSelected) =>
  //       prevSelected.map((item) =>
  //         currentlySelected.find((selected) => selected.id === item.id)
  //           ? {
  //               ...item,
  //               selectedQuantity: item.selectedQuantity || item.quantity, // Initialize with current quantity
  //             }
  //           : item
  //       )
  //     );
  
  //     setAdjustingQuantity(true); // Proceed to adjustment step
  //   } else {
  //     alert(
  //       `Selected quantity (${totalSelectedQuantity} ${
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
      (sum, item) => sum + (item.selectedQuantity || item.quantity),
      0
    );
  
    // Validation for capped and uncapped
    if ((!capped && currentlySelected.length === 0) || (capped && totalSelectedQuantity < selectedIngredient.quantity)) {
      alert(
        `You must select at least ${
          capped ? `${selectedIngredient.quantity} ${selectedIngredient.ingredients.unit?.unit_tag || ""}` : "one item"
        } to proceed.`
      );
      return;
    }
  
    // Proceed to adjustment
    console.log("Confirmed Inventory Selection:", currentlySelected);
  
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
  };
  
  

  // const adjustQuantity = (itemId, delta) => {
  //   setSelectedInventory((prevSelected) => {
  //     const updated = prevSelected.map((item) => {
  //       if (item.id === itemId) {
  //         const newQuantity = Math.max(0, item.selectedQuantity + delta);
  //         return { ...item, selectedQuantity: newQuantity };
  //       }
  //       return item;
  //     });
  
  //     if (capped) {
  //       const total = updated.reduce((sum, item) => sum + item.selectedQuantity, 0);
  //       if (total > selectedIngredient.quantity) {
  //         const excess = total - selectedIngredient.quantity;
  //         return adjustForExcess(updated, itemId, excess);
  //       }
  //     }
  //     return updated;
  //   });
  // };
  
  // const adjustQuantity = (itemId, delta) => {
  //   setSelectedInventory((prevSelected) => {
  //     // Calculate the current total
  //     const total = prevSelected.reduce((sum, item) => sum + item.selectedQuantity, 0);
  //     const target = selectedIngredient.quantity;
  
  //     // Update the specific item
  //     const updatedInventory = prevSelected.map((item) => {
  //       if (item.id === itemId) {
  //         // Prevent the quantity from going below 1
  //         const newQuantity = Math.max(1, item.selectedQuantity + delta);
  //         return { ...item, selectedQuantity: newQuantity };
  //       }
  //       return item;
  //     });
  
  //     if (capped) {
  //       if (total === target) {
  //         if (delta > 0) {
  //           // Adding: Redistribute the excess to maintain the target
  //           const excess = updatedInventory.reduce(
  //             (sum, item) => sum + item.selectedQuantity,
  //             0
  //           ) - target;
  //           return redistributeExcess(updatedInventory, itemId, excess);
  //         }
  //         // Subtracting: Normal subtraction is already handled
  //         return updatedInventory;
  //       }
  
  //       if (total < target) {
  //         // Allow normal addition until the target is reached
  //         const newTotal = updatedInventory.reduce(
  //           (sum, item) => sum + item.selectedQuantity,
  //           0
  //         );
  //         return newTotal <= target ? updatedInventory : adjustToFitTarget(updatedInventory, target);
  //       }
  //     }
  
  //     // If uncapped, no restrictions
  //     return updatedInventory;
  //   });
  // };

  const adjustQuantity = (itemId, delta) => {
    setSelectedInventory((prevSelected) => {
      const target = selectedIngredient.quantity;
  
      // Calculate the current total
      const total = prevSelected.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
      const updatedInventory = prevSelected.map((item) => {
        if (item.id === itemId) {
          // Adjust the selected item's quantity
          const newQuantity = Math.max(1, item.selectedQuantity + delta); // Prevent quantity < 1
          return { ...item, selectedQuantity: newQuantity };
        }
        return item;
      });
  
      if (capped) {
        if (delta > 0 && total === target) {
          // Adding: Redistribute the excess to maintain the target
          const excess = updatedInventory.reduce(
            (sum, item) => sum + item.selectedQuantity,
            0
          ) - target;
          return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
        }
  
        if (total < target || delta < 0) {
          // Allow normal addition until the target is reached or subtraction
          const newTotal = updatedInventory.reduce(
            (sum, item) => sum + item.selectedQuantity,
            0
          );
          return newTotal <= target ? updatedInventory : adjustToFitTarget(updatedInventory, target);
        }
      }
  
      // If uncapped, allow unrestricted changes
      return updatedInventory;
    });
  };
  

  // const handleQuantityInputChange = (itemId, newQuantity) => {
  //   setSelectedInventory((prevSelected) => {
  //     const target = selectedIngredient.quantity;
  
  //     // Parse and ensure valid quantity input
  //     const parsedQuantity = Math.max(1, parseInt(newQuantity) || 1);
  
  //     const updatedInventory = prevSelected.map((item) => {
  //       if (item.id === itemId) {
  //         return { ...item, selectedQuantity: parsedQuantity };
  //       }
  //       return item;
  //     });
  
  //     if (capped) {
  //       const total = updatedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
  //       if (total > target) {
  //         const excess = total - target;
  //         return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
  //       }
  
  //       if (total === target) {
  //         return updatedInventory; // Allow setting when exactly at the target
  //       }
  //     }
  
  //     // Allow unrestricted input in uncapped mode
  //     return updatedInventory;
  //   });
  // };
  
  const handleQuantityInputChange = (itemId, newQuantity) => {
    setSelectedInventory((prevSelected) => {
      const target = selectedIngredient.quantity;
  
      // Parse and ensure valid quantity input
      const parsedQuantity = Math.max(1, parseInt(newQuantity) || 1);
  
      // Validate against the maximum allowed quantity for the item
      const updatedInventory = prevSelected.map((item) => {
        if (item.id === itemId) {
          if (parsedQuantity > item.quantity) {
            alert(`You cannot exceed the available quantity of ${item.quantity}.`);
            return item; // Return the item unchanged
          }
          return { ...item, selectedQuantity: parsedQuantity };
        }
        return item;
      });
  
      if (capped) {
        const total = updatedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
        if (total > target) {
          const excess = total - target;
          return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
        }
  
        return updatedInventory; // Allow setting when within or exactly at the target
      }
  
      // Allow unrestricted input in uncapped mode
      return updatedInventory;
    });
  };
  
  
  
  

  // const redistributeExcess = (inventory, excludeItemId, excess) => {
  //   return inventory.map((item) => {
  //     if (item.id === excludeItemId || excess <= 0) return item;
  
  //     // Deduct excess from other items
  //     const deduction = Math.min(item.selectedQuantity, excess);
  //     excess -= deduction;
  //     return { ...item, selectedQuantity: item.selectedQuantity - deduction };
  //   });
  // };

  const redistributeExcess = (inventory, excludeItemId, excess) => {
    return inventory.map((item) => {
      if (item.id === excludeItemId || excess <= 0) return item;
  
      const deduction = Math.min(item.selectedQuantity, excess);
      excess -= deduction;
      return { ...item, selectedQuantity: item.selectedQuantity - deduction };
    });
  };

  const redistributeExcessToMaintainTarget = (inventory, excludeItemId, excess) => {
    return inventory.map((item) => {
      if (item.id === excludeItemId || excess <= 0) return item;
  
      const deduction = Math.min(item.selectedQuantity, excess);
      excess -= deduction;
      return { ...item, selectedQuantity: item.selectedQuantity - deduction };
    });
  };
  
  
  
  
  

  
  // const adjustToFitTarget = (inventory, target) => {
  //   let remainingRequired = target;
  
  //   return inventory.map((item) => {
  //     if (remainingRequired <= 0) {
  //       return { ...item, selectedQuantity: 0 };
  //     }
  
  //     const allocatedQuantity = Math.min(item.selectedQuantity, remainingRequired);
  //     remainingRequired -= allocatedQuantity;
  //     return { ...item, selectedQuantity: allocatedQuantity };
  //   });
  // };

  const adjustToFitTarget = (inventory, target) => {
    let remaining = target;
  
    return inventory.map((item) => {
      if (remaining <= 0) {
        return { ...item, selectedQuantity: 0 };
      }
  
      const adjustedQuantity = Math.min(item.selectedQuantity, remaining);
      remaining -= adjustedQuantity;
      return { ...item, selectedQuantity: adjustedQuantity };
    });
  };
  
  
  
  
  
  // const adjustForExcess = (inventory, excludeItemId, excess) => {
  //   return inventory.map((item) => {
  //     if (item.id === excludeItemId || excess <= 0) return item;
  //     const deduction = Math.min(item.selectedQuantity, excess);
  //     excess -= deduction;
  //     return { ...item, selectedQuantity: item.selectedQuantity - deduction };
  //   });
  // };
  
  const adjustForExcess = (inventory, excludeItemId, excess) => {
    return inventory.map((item) => {
      if (item.id === excludeItemId || excess <= 0) return item;
      const deduction = Math.min(item.selectedQuantity, excess);
      excess -= deduction;
      return { ...item, selectedQuantity: item.selectedQuantity - deduction };
    });
  };
  
  const finalizeQuantities = () => {
    const total = selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
    if (capped && total !== selectedIngredient.quantity) {
      alert(
        `The total quantity must match the required amount (${selectedIngredient.quantity} ${
          selectedIngredient.ingredients.unit?.unit_tag || ""
        }). Adjust the quantities accordingly.`
      );
      return;
    }
  
    console.log("Finalized Quantities:", selectedInventory);
  
    // Proceed with saving or next step
    setSelectedIngredient(null); // Close modal
    setSelectedInventory([]); // Reset inventory
    setAdjustingQuantity(false); // Exit adjusting mode
  };
  
  if (loading) {
    return <div>Loading preparation details...</div>;
  }

  if (recipes.length === 0) {
    return <div>No recipes found for this meal plan.</div>;
  }

  const autoAdjustQuantities = () => {
    let remainingRequired = selectedIngredient.quantity;
  
    const adjustedInventory = selectedInventory.map((item) => {
      if (!item.preselected || remainingRequired <= 0) {
        // Skip items not selected or when no more is required
        return { ...item, selectedQuantity: 0 };
      }
  
      const allocatedQuantity = Math.min(item.quantity, remainingRequired);
      remainingRequired -= allocatedQuantity;
  
      return { ...item, selectedQuantity: allocatedQuantity };
    });
  
    setSelectedInventory(adjustedInventory);
  
    if (remainingRequired > 0) {
      alert(
        `Not enough inventory to fulfill the required amount of ${selectedIngredient.quantity}.`
      );
    }
  };

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
                          checked={selectedInventory.find((selected) => selected.id === item.id)?.preselected || false}
                          onChange={() => toggleInventorySelection(item)}
                        />
                        {item.quantity} {item.unit?.unit_tag || ""} (Expiry:{" "}
                        {item.expiry_date?.date || "No expiry date"})
                      </label>
                    </li>
                    
                  ))}
                </ul>

                <div style={{ margin: "10px 0" }}>
                  <label style={{ display: "block", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={capped}
                      onChange={() => setCapped(!capped)}
                    />
                    Cap total to match required quantity
                  </label>
                </div>

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

                <button
                  onClick={() => setAdjustingQuantity(false)} // Back to selection
                  style={{
                    marginTop: "10px",
                    padding: "10px 20px",
                    background: "orange",
                    color: "white",
                    borderRadius: "5px",
                  }}
                >
                  Back to Select
                </button>

                <ul>
                  {selectedInventory

                    .filter((item) => item.preselected) // Only show preselected items
                    .map((item) => (
                    <li key={item.id}>
                      <label>
                        {item.quantity} {item.unit?.unit_tag || ""} (Expiry:{" "}
                        {item.expiry_date?.date || "No expiry date"})
                      </label>
                      {/* <button
                        onClick={() => adjustQuantity(item.id, -1)}
                        disabled={
                          item.selectedQuantity <= 0 ||
                          (capped &&
                            getTotalAdjustedQuantity() <= selectedIngredient.quantity)
                        }
                      > */}
                      <button
                        onClick={() => adjustQuantity(item.id, -1)}
                        disabled={item.selectedQuantity <= 1} // Prevent going below 1
                        style={{ margin: "0 5px", backgroundColor: "blue", color: "white" }}
                      >
                        -
                      </button>
                      {/* <span> {item.selectedQuantity} </span> */}
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={item.selectedQuantity}
                        onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                        style={{
                          width: "60px",
                          margin: "0 10px",
                          textAlign: "center",
                        }}
                      />
                      {/* <button
                        onClick={() => adjustQuantity(item.id, 1)}
                        disabled={
                          item.selectedQuantity >= item.quantity ||
                          (capped &&
                            getTotalAdjustedQuantity() >= selectedIngredient.quantity)
                        }
                      > */}
                      {/* <button
                        onClick={() => adjustQuantity(item.id, 1)}
                        // disabled={capped && getTotalAdjustedQuantity() >= selectedIngredient.quantity} // Prevent exceeding target
                        style={{ margin: "0 5px", backgroundColor: "blue", color: "white" }}
                      > */}
                      <button
                        onClick={() => adjustQuantity(item.id, 1)}
                        disabled={item.selectedQuantity >= item.quantity} // Prevent exceeding item's max quantity
                        style={{ margin: "0 5px", backgroundColor: "blue", color: "white" }}
                      >
                        +
                      </button>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={autoAdjustQuantities} // Button to auto-adjust
                  style={{
                    marginTop: "10px",
                    padding: "10px 20px",
                    background: "blue",
                    color: "white",
                    borderRadius: "5px",
                  }}
                >
                  Auto Adjust Quantities
                </button>

                <button
                  onClick={finalizeQuantities}
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
