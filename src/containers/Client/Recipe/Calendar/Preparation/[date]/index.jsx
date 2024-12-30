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

  const exceedAmount = Math.max(
    0,
    selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
      (selectedIngredient?.quantity || 0) // Safeguard in case selectedIngredient is null
  );

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
        // const merged = allIngredients.reduce((acc, ingredient) => {
        //   const existing = acc.find(
        //     (item) => item.ingredients.name === ingredient.ingredients.name
        //   );
        //   if (existing) {
        //     existing.quantity += ingredient.quantity;
        //   } else {
        //     acc.push({ ...ingredient });
        //   }
        //   return acc;
        // }, []);
        // setMergedIngredients(merged);
        const merged = allIngredients.reduce((acc, ingredient) => {
          const existing = acc.find(
            (item) => item.ingredients.name === ingredient.ingredients.name
          );
          if (existing) {
            existing.quantity += ingredient.quantity;
        
            // Add the recipe-specific quantity
            existing.recipes.push({
              recipeId: ingredient.recipeId,
              quantity: ingredient.quantity,
            });
          } else {
            acc.push({
              ...ingredient,
              recipes: [
                {
                  recipeId: ingredient.recipeId,
                  quantity: ingredient.quantity,
                },
              ],
            });
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

  const redistributeExcessToMaintainTarget = (inventory, excludeItemId, excess) => {
    return inventory.map((item) => {
      if (item.id === excludeItemId || excess <= 0) return item;
  
      const deduction = Math.min(item.selectedQuantity, excess);
      excess -= deduction;
      return { ...item, selectedQuantity: item.selectedQuantity - deduction };
    });
  };

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
  
  // const finalizeQuantities = () => {
  //   const total = selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
  //   if (capped && total !== selectedIngredient.quantity) {
  //     alert(
  //       `The total quantity must match the required amount (${selectedIngredient.quantity} ${
  //         selectedIngredient.ingredients.unit?.unit_tag || ""
  //       }). Adjust the quantities accordingly.`
  //     );
  //     return;
  //   }
  
  //   console.log("Finalized Quantities:", selectedInventory);
  
  //   // Proceed with saving or next step
  //   setSelectedIngredient(null); // Close modal
  //   setSelectedInventory([]); // Reset inventory
  //   setAdjustingQuantity(false); // Exit adjusting mode
  // };

  const finalizeQuantities = async () => {
    const total = selectedInventory.reduce(
      (sum, item) => sum + item.selectedQuantity,
      0
    );
  
    if (capped && total !== selectedIngredient.quantity) {
      alert(
        `The total quantity must match the required amount (${selectedIngredient.quantity} ${
          selectedIngredient.ingredients.unit?.unit_tag || ""
        }). Adjust the quantities accordingly.`
      );
      return;
    }
  
    console.log("Finalized Quantities:", selectedInventory);
  
    try {
      // Construct the data to be inserted into `inventory_meal_plan`
      const mealPlanId = location.state?.meal_plan_id; // Assuming this is available from your component's state
      if (!mealPlanId) {
        alert("Meal Plan ID is missing!");
        return;
      }
  
      const dataToInsert = selectedInventory.map((item) => ({
        inventory_id: item.id,
        meal_plan_id: mealPlanId,
        used_quantity: item.selectedQuantity,
        status_id: 1, // Assuming a default status ID of 1; update this if needed
      }));
  
      // Insert data into the table using Supabase
      const { data, error } = await supabase
        .from("inventory_meal_plan")
        .insert(dataToInsert);
  
      if (error) {
        throw error;
      }
  
      console.log("Inserted Data:", data);
  
      // Reset states after successful insertion
      setSelectedIngredient(null); // Close modal
      setSelectedInventory([]); // Reset inventory
      setAdjustingQuantity(false); // Exit adjusting mode
      alert("Quantities successfully saved to inventory_meal_plan!");
    } catch (err) {
      console.error("Error inserting data into inventory_meal_plan:", err.message);
      alert("Failed to save quantities. Please try again.");
    }
  };
  
  const assignToRecipes = () => {
    const updatedMergedIngredients = mergedIngredients.map((ingredient) => {
      let remainingQuantity = ingredient.quantity;
  
      const updatedRecipes = ingredient.recipes.map((recipe) => {
        const allocated = Math.min(remainingQuantity, recipe.quantity);
        remainingQuantity -= allocated;
        return {
          recipeId: recipe.recipeId,
          quantity: allocated,
        };
      });
  
      return {
        ...ingredient,
        recipes: updatedRecipes,
      };
    });
  
    setMergedIngredients(updatedMergedIngredients);
  };
  
  useEffect(() => {
    if (selectedInventory.length > 0) {
      assignToRecipes();
    }
  }, [selectedInventory]);
  
  useEffect(() => {
    if (exceedAmount > 0) {
      autoAllocateExceed(); // Automatically allocate exceed amount
    }
  }, [exceedAmount]); // Dependency array includes exceedAmount
  
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

  const getRecipeNameById = (recipeId) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe ? recipe.name : `Recipe ${recipeId}`; // Default to "Recipe {id}" if not found
  };

  // const adjustExceedAllocation = (recipeId, delta) => {
  //   setSelectedIngredient((prev) => {
  //     const updatedRecipes = prev.recipes.map((recipe) => {
  //       if (recipe.recipeId === recipeId) {
  //         const newAllocation = Math.max(0, (recipe.exceedAllocation || 0) + delta);
  //         return { ...recipe, exceedAllocation: newAllocation };
  //       }
  //       return recipe;
  //     });
  //     return { ...prev, recipes: updatedRecipes };
  //   });
  // };

  // const adjustExceedAllocation = (recipeId, delta) => {
  //   setSelectedIngredient((prev) => {
  //     const totalExceedAllowed = Math.max(
  //       0,
  //       selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
  //         (prev.quantity || 0) // Ensure valid quantity handling
  //     );
  
  //     const currentTotalExceed = prev.recipes.reduce(
  //       (sum, recipe) => sum + (recipe.exceedAllocation || 0),
  //       0
  //     );
  
  //     const updatedRecipes = prev.recipes.map((recipe) => {
  //       if (recipe.recipeId === recipeId) {
  //         // Calculate the new exceed allocation
  //         const newAllocation = Math.max(
  //           0,
  //           Math.min(
  //             (recipe.exceedAllocation || 0) + delta,
  //             totalExceedAllowed - (currentTotalExceed - (recipe.exceedAllocation || 0)) // Adjust allocation without exceeding the cap
  //           )
  //         );
  
  //         return { ...recipe, exceedAllocation: newAllocation };
  //       }
  //       return recipe;
  //     });
  
  //     return { ...prev, recipes: updatedRecipes };
  //   });
  // };

  // const adjustExceedAllocation = (recipeId, delta) => {
  //   setSelectedIngredient((prev) => {
  //     const totalExceedAllowed = Math.max(
  //       0,
  //       selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
  //         (prev.quantity || 0)
  //     );
  
  //     // Calculate the current total allocation
  //     const currentTotalExceed = prev.recipes.reduce(
  //       (sum, recipe) => sum + (recipe.exceedAllocation || 0),
  //       0
  //     );
  
  //     let remainingExceed = totalExceedAllowed;
  
  //     const updatedRecipes = prev.recipes.map((recipe) => {
  //       if (recipe.recipeId === recipeId) {
  //         // Try to adjust the selected recipe's allocation
  //         const newAllocation = Math.max(
  //           0,
  //           Math.min(
  //             (recipe.exceedAllocation || 0) + delta,
  //             remainingExceed // Cap by remaining allowable exceed
  //           )
  //         );
  //         remainingExceed -= newAllocation; // Deduct from remaining exceed
  //         return { ...recipe, exceedAllocation: newAllocation };
  //       } else {
  //         // Deduct from other recipes to allow redistribution
  //         const adjustedAllocation = Math.min(
  //           recipe.exceedAllocation || 0,
  //           remainingExceed
  //         );
  //         remainingExceed -= adjustedAllocation;
  //         return { ...recipe, exceedAllocation: adjustedAllocation };
  //       }
  //     });
  
  //     return { ...prev, recipes: updatedRecipes };
  //   });
  // };
  
  const adjustExceedAllocation = (recipeId, delta) => {
    setSelectedIngredient((prev) => {
      const totalExceedAllowed = Math.max(
        0,
        selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
          (prev.quantity || 0)
      );
  
      const updatedRecipes = prev.recipes.map((recipe) => {
        // Clone the recipe object
        return { ...recipe };
      });
  
      const targetRecipe = updatedRecipes.find((recipe) => recipe.recipeId === recipeId);
  
      if (!targetRecipe) return prev; // If the target recipe is not found, return the original state
  
      // Adjust the target recipe's allocation
      const currentAllocation = targetRecipe.exceedAllocation || 0;
      const newAllocation = Math.max(
        0,
        Math.min(currentAllocation + delta, totalExceedAllowed)
      );
  
      // Calculate the change in allocation
      const allocationChange = newAllocation - currentAllocation;
  
      if (allocationChange === 0) {
        return prev; // If no change, return the original state
      }
  
      targetRecipe.exceedAllocation = newAllocation;
  
      if (allocationChange > 0) {
        // If incrementing, find another recipe to deduct from
        for (const recipe of updatedRecipes) {
          if (recipe.recipeId !== recipeId && recipe.exceedAllocation > 0) {
            recipe.exceedAllocation = Math.max(recipe.exceedAllocation - 1, 0);
            break; // Deduct only one and stop
          }
        }
      } else {
        // If decrementing, add the freed allocation to another recipe
        for (const recipe of updatedRecipes) {
          if (recipe.recipeId !== recipeId) {
            recipe.exceedAllocation = Math.min(
              (recipe.exceedAllocation || 0) + 1,
              totalExceedAllowed
            );
            break; // Add only one and stop
          }
        }
      }
  
      return { ...prev, recipes: updatedRecipes };
    });
  };
  

  
  // const autoAllocateExceed = () => {
  //   const exceedAmount = Math.max(
  //     0,
  //     selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
  //       selectedIngredient.quantity
  //   );
  
  //   setSelectedIngredient((prev) => {
  //     const totalRecipes = prev.recipes.length;
  //     const allocationPerRecipe = Math.floor(exceedAmount / totalRecipes);
  
  //     const updatedRecipes = prev.recipes.map((recipe, index) => {
  //       const remainingExceed =
  //         index === totalRecipes - 1 // Add remaining to the last recipe
  //           ? exceedAmount -
  //             allocationPerRecipe * (totalRecipes - 1)
  //           : allocationPerRecipe;
  //       return { ...recipe, exceedAllocation: remainingExceed };
  //     });
  
  //     return { ...prev, recipes: updatedRecipes };
  //   });
  // };

  const autoAllocateExceed = () => {
    setSelectedIngredient((prev) => {
      const totalRecipes = prev.recipes.length;
      const allocationPerRecipe = Math.floor(exceedAmount / totalRecipes);

      const updatedRecipes = prev.recipes.map((recipe, index) => {
        const remainingExceed =
          index === totalRecipes - 1 // Add remaining to the last recipe
            ? exceedAmount - allocationPerRecipe * (totalRecipes - 1)
            : allocationPerRecipe;

        return { ...recipe, exceedAllocation: remainingExceed };
      });

      return { ...prev, recipes: updatedRecipes };
    });
  };

  const handleExceedInputChange = (recipeId, value) => {
    const parsedValue = Math.max(
      0,
      Math.min(
        parseInt(value) || 0,
        Math.max(
          0,
          selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
            selectedIngredient.quantity
        )
      )
    );
  
    setSelectedIngredient((prev) => {
      const updatedRecipes = prev.recipes.map((recipe) => {
        if (recipe.recipeId === recipeId) {
          return { ...recipe, exceedAllocation: parsedValue };
        }
        return recipe;
      });
      return { ...prev, recipes: updatedRecipes };
    });
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
          </div> */}
          <div>
            <h3>Merged Ingredients</h3>
            <ul>
              {mergedIngredients.map((ingredient, index) => (
                <li key={index} style={{ marginBottom: "15px" }}>
                  <div
                    onClick={() => handleIngredientClick(ingredient)}
                    style={{
                      cursor: "pointer",
                      color: "blue",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    {ingredient.ingredients.name} - {ingredient.quantity}{" "}
                    {ingredient.ingredients.unit?.unit_tag || ""}
                  </div>
                  {ingredient.recipes.length > 1 && (
                    <ul style={{ paddingLeft: "20px", marginTop: "5px", fontSize: "14px" }}>
                      {ingredient.recipes.map((recipe) => (
                        <li key={recipe.recipeId}>
                          Needed in {getRecipeNameById(recipe.recipeId)}: <strong>{recipe.quantity}{" "}
                          {ingredient.ingredients.unit?.unit_tag || ""}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
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
            {!adjustingQuantity ? (
              <>
                <h3>Select Inventory for: {selectedIngredient.ingredients.name}</h3>
                <p>
                  <strong>Required:</strong> {selectedIngredient.quantity}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                </p>
                <p>
                  <strong>Your Selection:</strong>{" "}
                  {selectedInventory
                    .filter((item) => item.preselected) // Only count selected items
                    .reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                </p>

                {/* Add associated recipes */}
                {selectedIngredient.recipes.length > 0 && (
                  <div style={{ marginTop: "15px" }}>
                    <h4>Used in Recipes:</h4>
                    <ul style={{ paddingLeft: "20px", fontSize: "14px" }}>
                      {selectedIngredient.recipes.map((recipe) => (
                        <li key={recipe.recipeId}>
                          {getRecipeNameById(recipe.recipeId)}:{" "}
                          <strong>
                            {recipe.quantity} {selectedIngredient.ingredients.unit?.unit_tag || ""}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Inventory selection */}
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
                      <button
                        onClick={() => adjustQuantity(item.id, 1)}
                        disabled={
                          (selectedInventory.filter((item) => item.preselected).length === 1 && item.selectedQuantity >= item.quantity) || // Check if only one preselected item
                          
                          item.selectedQuantity >= item.quantity // Check if maximum quantity reached
                        }
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

                {/* Exceed Section */}
  {!capped && (
    <div style={{ marginTop: "20px" }}>
      <h4>Exceed Amount:</h4>
      <p>
        {Math.max(
          0,
          selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
            selectedIngredient.quantity
        )}{" "}
        {selectedIngredient.ingredients.unit?.unit_tag || ""}
      </p>

      {/* Recipes Allocation for Exceed */}
      <h4>Allocate Exceed Amount</h4>
      <ul>
        {selectedIngredient.recipes.map((recipe, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            <div>
              <strong>{getRecipeNameById(recipe.recipeId)}:</strong>{" "}
              {recipe.quantity}{" "}
              {selectedIngredient.ingredients.unit?.unit_tag || ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() =>
                  adjustExceedAllocation(recipe.recipeId, -1)
                }
                disabled={recipe.exceedAllocation <= 0}
                style={{
                  background: "blue",
                  color: "white",
                  borderRadius: "5px",
                }}
              >
                -
              </button>
              {/* <span>{recipe.exceedAllocation || 0}</span> */}
              <input
                type="number"
                min="0"
                max={Math.max(
                  0,
                  selectedInventory.reduce(
                    (sum, item) => sum + item.selectedQuantity,
                    0
                  ) - selectedIngredient.quantity
                )}
                value={recipe.exceedAllocation || 0}
                onChange={(e) => handleExceedInputChange(recipe.recipeId, e.target.value)}
                style={{
                  width: "60px",
                  textAlign: "center",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  padding: "5px",
                }}
              />
              <button
                onClick={() =>
                  adjustExceedAllocation(recipe.recipeId, 1)
                }
                disabled={
                  recipe.exceedAllocation >=
                  Math.max(
                    0,
                    selectedInventory.reduce(
                      (sum, item) => sum + item.selectedQuantity,
                      0
                    ) - selectedIngredient.quantity
                  )
                }
                style={{
                  background: "blue",
                  color: "white",
                  borderRadius: "5px",
                }}
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={autoAllocateExceed}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          background: "blue",
          color: "white",
          borderRadius: "5px",
        }}
      >
        Auto Adjust Exceed Quantities
      </button>
    </div>
  )}
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
