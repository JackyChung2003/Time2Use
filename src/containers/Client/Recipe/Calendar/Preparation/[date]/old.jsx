import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRecipeContext } from "../../../Contexts/RecipeContext";
import BackButton from "../../../../../../components/Button/BackButton";
import supabase from "../../../../../../config/supabaseClient";

import SortableRecipeList from "../../../../../../components/SortableDragAndDrop/Recipes_List/SortableRecipeList";
import "./index.css"; 
import { set } from "date-fns";

const RecipePreparationPage = () => { 
  const {
    fetchMealPlansByDate,
    fetchRecipesByIds,
    fetchRecipeIngredients,
    fetchRecipeSteps,
    fetchUserInventory,
    mealTypes,
    getStatusIdByName,
    fetchInventoryMealPlanData,
    fetchInventoryMealPlanByMealPlanId,
    enrichInventory,
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
  const [capped, setCapped] = useState(true); // To toggle capped/uncapped mode

  const [selectedInventory, setSelectedInventory] = useState([]); // State to track selected inventory items
  const [adjustingQuantity, setAdjustingQuantity] = useState(false); // Add this state

  const exceedAmount = Math.max(
    0,
    selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) -
      (selectedIngredient?.quantity || 0) // Safeguard in case selectedIngredient is null
  );

  const [mealPlanIds, setMealPlanIds] = useState([]);// Add a global state for requiredQuantity
  const [requiredQuantity, setRequiredQuantity] = useState(null);


  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       setLoading(true);

  //       // Fetch meal plans for the given date
  //       const mealPlans = await fetchMealPlansByDate(planned_date);

  //       // Log the fetched MealPlan details
  //       console.log("Fetched MealPlans:", mealPlans);

  //       const relevantPlans = mealPlans.filter(
  //         (meal) => meal.meal_type_id === meal_type_id
  //       );

  //       if (relevantPlans.length === 0) {
  //         console.warn("No meal plans found for the given date and meal type.");
  //         setRecipes([]);
  //         return;
  //       }

  //       // Extract recipe IDs and fetch recipes
  //       const recipeIds = relevantPlans.map((meal) => meal.recipe_id);
  //       const fetchedRecipes = await fetchRecipesByIds(recipeIds);
  //       setRecipes(fetchedRecipes);

  //       // Fetch ingredients and steps for each recipe
  //       const allIngredients = [];
  //       const allSteps = [];
  //       for (const recipe of fetchedRecipes) {
  //         const ingredientsData = await fetchRecipeIngredients(recipe.id);
  //         const stepsData = await fetchRecipeSteps(recipe.id);

  //         allIngredients.push(
  //           ...ingredientsData.map((ingredient) => ({
  //             ...ingredient,
  //             recipeId: recipe.id,
  //           }))
  //         );
  //         allSteps.push(...stepsData);
  //       }

  //       setIngredients(allIngredients);
  //       setSteps(allSteps);

  //       const merged = allIngredients.reduce((acc, ingredient) => {
  //         const existing = acc.find(
  //           (item) => item.ingredients.name === ingredient.ingredients.name
  //         );
  //         if (existing) {
  //           existing.quantity += ingredient.quantity;
        
  //           // Add the recipe-specific quantity
  //           existing.recipes.push({
  //             recipeId: ingredient.recipeId,
  //             quantity: ingredient.quantity,
  //           });
  //         } else {
  //           acc.push({
  //             ...ingredient,
  //             recipes: [
  //               {
  //                 recipeId: ingredient.recipeId,
  //                 quantity: ingredient.quantity,
  //               },
  //             ],
  //           });
  //         }
  //         return acc;
  //       }, []);
  //       setMergedIngredients(merged);
  //     } catch (error) {
  //       console.error("Error loading data:", error.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (planned_date && meal_type_id) {
  //     loadData();
  //   }
  // }, [planned_date, meal_type_id, fetchMealPlansByDate, fetchRecipesByIds, fetchRecipeIngredients, fetchRecipeSteps]);

  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       setLoading(true);
  
  //       // Fetch meal plans
  //       const mealPlans = await fetchMealPlansByDate(planned_date);
  //       const relevantPlans = mealPlans.filter(
  //         (meal) => meal.meal_type_id === meal_type_id
  //       );
  
  //       if (relevantPlans.length === 0) {
  //         console.warn("No meal plans found for the given date and meal type.");
  //         setRecipes([]);
  //         setMergedIngredients([]);
  //         return;
  //       }
  
  //       // Fetch recipes
  //       const recipeIds = relevantPlans.map((meal) => meal.recipe_id);
  //       const fetchedRecipes = await fetchRecipesByIds(recipeIds);
  //       setRecipes(fetchedRecipes);
  
  //       // Fetch ingredients for each recipe
  //       const allIngredients = [];
  //       for (const recipe of fetchedRecipes) {
  //         const ingredientsData = await fetchRecipeIngredients(recipe.id);
  //         allIngredients.push(
  //           ...ingredientsData.map((ingredient) => ({
  //             ...ingredient,
  //             recipeId: recipe.id,
  //           }))
  //         );
  //       }
  
  //       // Fetch inventory meal plan data
  //       const mealPlanIds = relevantPlans.map((plan) => plan.id);
  //       // console.log("Meal Plan IDs:", mealPlanIds);
  //       // console.log("Relevant Plans:", relevantPlans);
  //       const inventoryMealPlanData = await fetchInventoryMealPlanByMealPlanId(mealPlanIds);
  //       console.log("Fetched Inventory Meal Plan Data:", inventoryMealPlanData);
  
  //       // Link ingredients with inventory items
  //       const merged = allIngredients.reduce((acc, ingredient) => {
  //         const existing = acc.find(
  //           (item) => item.ingredients.name === ingredient.ingredients.name
  //         );
        
  //         // Link inventory items to ingredients
  //         const linkedInventory = inventoryMealPlanData.filter(
  //           (inv) => inv.inventory_id === ingredient.ingredients.id
  //         );
        
  //         if (existing) {
  //           existing.quantity += ingredient.quantity;
  //           existing.recipes.push({
  //             recipeId: ingredient.recipeId,
  //             quantity: ingredient.quantity,
  //           });
  //           existing.inventoryItems = [
  //             ...(existing.inventoryItems || []),
  //             ...linkedInventory,
  //           ];
  //         } else {
  //           acc.push({
  //             ...ingredient,
  //             recipes: [
  //               {
  //                 recipeId: ingredient.recipeId,
  //                 quantity: ingredient.quantity,
  //               },
  //             ],
  //             inventoryItems: linkedInventory,
  //           });
  //         }
  //         return acc;
  //       }, []);
        
        
  //     console.log("Merged Ingredients:", merged); // Log mergedIngredients
  //       setMergedIngredients(merged);
  //     } catch (error) {
  //       console.error("Error loading data:", error.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  
  //   if (planned_date && meal_type_id) {
  //     loadData();
  //   }
  // }, [planned_date, meal_type_id, fetchMealPlansByDate, fetchRecipesByIds, fetchRecipeIngredients]);
  
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
          setMergedIngredients([]);
          return;
        }
  
        // Fetch recipes by IDs
        const recipeIds = relevantPlans.map((meal) => meal.recipe_id);
        const fetchedRecipes = await fetchRecipesByIds(recipeIds);
        setRecipes(fetchedRecipes);
  
        // Fetch ingredients for each recipe
        const allIngredients = [];
        for (const recipe of fetchedRecipes) {
          const ingredientsData = await fetchRecipeIngredients(recipe.id);
          allIngredients.push(
            ...ingredientsData.map((ingredient) => ({
              ...ingredient,
              recipeId: recipe.id,
            }))
          );
        }
  
        // Fetch inventory meal plan data
        const mealPlanIds = relevantPlans.map((plan) => plan.id);
        // console.log("Meal Plan IDs:JJJJJJJJ", mealPlanIds);
        setMealPlanIds(mealPlanIds);
        const inventoryMealPlanData = await fetchInventoryMealPlanByMealPlanId(mealPlanIds);
  
        // console.log("Fetched Inventory Meal Plan Data:", inventoryMealPlanData);
  
        // Map inventory to ingredients
        const merged = allIngredients.reduce((acc, ingredient) => {
          const existing = acc.find(
            (item) => item.ingredients.id === ingredient.ingredients.id
          );
  
          // Find related inventory data for this ingredient
          // console.log(`Ingredient ID for ${ingredient.ingredients.name}:`, ingredient.ingredients.id);
  
          const linkedInventory = inventoryMealPlanData.filter(
            (inv) => inv.inventory.ingredient_id === ingredient.ingredients.id
          );
  
          // console.log(`Linked Inventory for ${ingredient.ingredients.name}:`, linkedInventory);
  
          if (existing) {
            existing.quantity += ingredient.quantity;
            existing.recipes.push({
              recipeId: ingredient.recipeId,
              quantity: ingredient.quantity,
            });
            existing.inventoryItems = [
              ...(existing.inventoryItems || []),
              ...linkedInventory,
            ];
          } else {
            acc.push({
              ...ingredient,
              recipes: [
                {
                  recipeId: ingredient.recipeId,
                  quantity: ingredient.quantity,
                },
              ],
              inventoryItems: linkedInventory,
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
  }, [
    planned_date,
    meal_type_id,
    fetchMealPlansByDate,
    fetchRecipesByIds,
    fetchRecipeIngredients,
    fetchInventoryMealPlanByMealPlanId,
  ]);
  
  const toggleCombineIngredients = () => {
    setIsCombined(!isCombined);
  };

  const startCooking = () => {
    setShowModal(true);
  };
  
  const confirmSequence = () => {
    setShowModal(false);
    // console.log("Confirmed cooking sequence:", recipes);
    // Proceed to cooking steps logic
  };
  
  const closeModal = () => {
    setShowModal(false);
  };

  const allocateInventoryFIFO = (ingredient, inventory) => {
    const target = ingredient.quantity;
    // console.log("Target Quantity Needed:", target);
  
    // Step 1: Sort inventory by expiry date first, then by quantity
    const sortedInventory = [...inventory].sort((a, b) => {
      const dateA = new Date(a.expiry_date?.date || "9999-12-31");
      const dateB = new Date(b.expiry_date?.date || "9999-12-31");
      if (dateA - dateB !== 0) {
        return dateA - dateB; // Sort by expiry date first
      }
      return a.quantity - b.quantity; // Then by quantity
    });
  
    // console.log("Sorted Inventory by Expiry and Quantity:", sortedInventory);
  
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
  
    // console.log("Selected Items:", selectedItems);
  
    // Step 3: Mark the remaining inventory as unselected
    const finalInventory = sortedInventory.map((item) => {
      const selectedItem = selectedItems.find((selected) => selected.id === item.id);
      return selectedItem
        ? selectedItem
        : { ...item, preselected: false, selectedQuantity: 0 }; // Mark unselected
    });
  
    // console.log("Final Allocated Inventory:", finalInventory);
  
    return finalInventory;
  };

  // const preselectLinkedInventory = (linkedInventory) => {
  //   console.log("Processing Linked Inventory for Preselection:", linkedInventory);
  
  //   // Map linked inventory to the required format for preselection
  //   const preselectedInventory = linkedInventory.map((item) => ({
  //     ...item,
  //     selectedQuantity: item.used_quantity, // Use the used quantity as the preselected value
  //     preselected: true, // Mark as preselected
  //   }));
  
  //   console.log("Preselected Inventory:", preselectedInventory);
  
  //   return preselectedInventory;
  // };
  
  const preselectLinkedInventory = (linkedInventory, fullInventory) => {
    console.log("Processing Linked Inventory for Preselection:", linkedInventory);
  
    // Get IDs of the linked inventory items
    const linkedIds = linkedInventory.map((item) => item.inventory_id);
  
    // Map full inventory to match the linked IDs, deselecting others
    const updatedInventory = fullInventory.map((item) => {
    const linkedItem = linkedInventory.find((linked) => linked.inventory_id === item.id);
    
    console.log("Linked Item:", linkedItem);

      if (linkedItem) {
        return {
          ...item,
          selectedQuantity: linkedItem.used_quantity, // Use the already-used quantity
          preselected: true, // Mark as preselected
        };
      }
  
      // Deselect items not in linked inventory
      return {
        ...item,
        selectedQuantity: 0,
        preselected: false,
      };
    });
  
    // console.log("Updated Inventory with Preselection:", updatedInventory);
  
    return updatedInventory;
  };
  

  // const handleIngredientClick = async (ingredient) => {
  //   try {
  //     setSelectedIngredient(null); // Clear previous selection
  //     setInventoryItems([]); // Reset inventory items
  //     setSelectedInventory([]); // Reset selected inventory
  //     setAdjustingQuantity(false); // Reset adjusting state

  //     const inventory = await fetchUserInventory(ingredient.ingredients.id);
  //     console.log('ingredient:', ingredient);
  //     console.log("Fetched Inventory:", inventory);
  //     // Use FIFO Allocation for suggestions
  //     const allocatedInventory = allocateInventoryFIFO(ingredient, inventory);
      
  //     console.log("Allocated Inventory:", allocatedInventory);
  //     setSelectedIngredient(ingredient);
  //     setInventoryItems(inventory); // Full inventory list
  //     setSelectedInventory(allocatedInventory); // Include preselected suggestions
  //   } catch (error) {
  //     console.error("Error fetching inventory for ingredient:", error.message);
  //   }
  // };
  const handleIngredientClick = async (ingredient) => {
    try {
      // setSelectedIngredient(null); // Clear previous selection

      setSelectedIngredient(ingredient); // Set selected ingredient first
      setInventoryItems([]); // Reset inventory items
      setSelectedInventory([]); // Reset selected inventory
      setAdjustingQuantity(false); // Reset adjusting state

      const inventory = await fetchUserInventory(ingredient.ingredients.id);
      // console.log('ingredient:', ingredient);
      // console.log("Fetched Inventory:", inventory);

      // Fetch linked inventory from the meal plan
      // const mealPlanIds = recipes.map((recipe) => recipe.id); // Assuming you can derive meal plan IDs from recipes
      // console.log("Meal Plan IDsHEREEEEE:", mealPlanIds);
      const inventoryMealPlanData = await fetchInventoryMealPlanByMealPlanId(mealPlanIds);
      // console.log("Fetched Inventory Meal Plan Data:", inventoryMealPlanData);

      // Filter inventory meal plan data for the current ingredient
      const linkedInventory = inventoryMealPlanData.filter(
        (item) => item.inventory.ingredient_id === ingredient.ingredients.id
      );

      // console.log("Linked Inventory from Meal Plan:", linkedInventory);

      let allocatedInventory;
      if (linkedInventory.length > 0) {
        allocatedInventory = preselectLinkedInventory(linkedInventory, inventory);
      } else {
        allocatedInventory = allocateInventoryFIFO(ingredient, inventory);
      }
      // if (linkedInventory.length > 0) {
      //   // // Preselect linked inventory and proceed to adjust quantities
      //   // const allocatedInventory = linkedInventory.map((item) => ({
      //   //   ...item,
      //   //   selectedQuantity: item.used_quantity, // Use the already-used quantity
      //   //   preselected: true, // Mark as preselected
      //   // }));

      //   // Use the new function to preselect linked inventory
      //   // const allocatedInventory = preselectLinkedInventory(linkedInventory);
      //   const allocatedInventory = preselectLinkedInventory(linkedInventory, inventory);

      //   // console.log("Preselected Inventory:", allocatedInventory);

      //   setSelectedIngredient(ingredient);
      //   setInventoryItems(inventory); // Full inventory list
      //   setSelectedInventory(allocatedInventory); // Preselected items
      //   setRequiredQuantity(ingredient.quantity); // Set global requiredQuantity
      //   setAdjustingQuantity(true); // Skip to adjust quantities
      // } else {
      //   // If no linked inventory, proceed with FIFO allocation
      //   const allocatedInventory = allocateInventoryFIFO(ingredient, inventory);

      //   // console.log("Allocated Inventory:", allocatedInventory);

      //   setSelectedIngredient(ingredient);
      //   setInventoryItems(inventory); // Full inventory list
      //   setSelectedInventory(allocatedInventory); // Include preselected suggestions
      //   setRequiredQuantity(ingredient.quantity); // Set global requiredQuantity
      // }

      // Merge previously selected quantities if already in state
      const updatedInventory = allocatedInventory.map((item) => {
        const existing = selectedInventory.find((selected) => selected.id === item.id);
        return existing
          ? { ...item, selectedQuantity: existing.selectedQuantity, preselected: existing.preselected }
          : item;
      });

      setInventoryItems(inventory); // Full inventory list
      setSelectedInventory(updatedInventory); // Maintain or update selected inventory
      setRequiredQuantity(ingredient.quantity); // Set global requiredQuantity
      setAdjustingQuantity(true); // Skip to adjust quantities
    } catch (error) {
      console.error("Error fetching inventory for ingredient:", error.message);
    }
  };

  
  
  const toggleInventorySelection = (item) => {
    console.log("Before toggle:", selectedInventory);
    setSelectedInventory((prevSelected) => {
      const exists = prevSelected.find((selected) => selected.id === item.id);
  
      if (exists) {
        // If already selected, toggle off
        return prevSelected.map((selected) =>
          selected.id === item.id
            ? { ...selected, preselected: !selected.preselected }
            : selected
        );
        // If already selected, toggle off
        // const updatedSelection = prevSelected.map((selected) =>
        //   selected.id === item.id
        //     ? { ...selected, preselected: !selected.preselected }
        //     : selected
        // );
        // console.log("After toggle off:", updatedSelection);
        // return updatedSelection;
      }

      // If not selected, add to selectedInventory
      return [
        ...prevSelected,
       {
          ...item,
          // selectedQuantity: item.selectedQuantity || 0, // Default to a small quantity if none exists
          selectedQuantity: item.selectedQuantity || 1, // Default to 1 if not set
          preselected: true, // Mark as preselected
        },
      ];
       // If not selected, add to selectedInventory
      // const newSelection = [
      //   ...prevSelected,
      //   {
      //     ...item,
      //     selectedQuantity: item.selectedQuantity || 0, // Default to a small quantity if none exists
      //     preselected: true, // Mark as preselected
      //   },
      // ];
      // console.log("After toggle on:", newSelection);
      // return newSelection;
    });
  };

  const confirmSelection = () => {
    const currentlySelected = selectedInventory.filter((item) => item.preselected);
    const totalSelectedQuantity = currentlySelected.reduce(
      // (sum, item) => sum + (item.selectedQuantity || item.quantity),
      (sum, item) => sum + (item.quantity),
      0
    );

    console.log("Currently Selected Inventory:", currentlySelected);
    console.log("Total Selected Quantity:", totalSelectedQuantity);
  
    // Validation for capped and uncapped
    if ((!capped && currentlySelected.length === 0) || (capped && totalSelectedQuantity < selectedIngredient.quantity)) {
      alert(
        `You must select at least ${
          capped ? `${selectedIngredient.quantity} ${selectedIngredient.ingredients.unit?.unit_tag || ""}` : "one item"
        } to proceed. Now you have selected ${totalSelectedQuantity} ${selectedIngredient.ingredients.unit?.unit_tag || ""}.`
  
      );
      return;
    }
  
    // Proceed to adjustment
    // console.log("Confirmed Inventory Selection:", currentlySelected);
  
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
  //     const target = selectedIngredient.quantity;
  
  //     // Calculate the current total
  //     const total = prevSelected.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
  //     const updatedInventory = prevSelected.map((item) => {
  //       if (item.id === itemId) {
  //         // Adjust the selected item's quantity
  //         const newQuantity = Math.max(1, item.selectedQuantity + delta); // Prevent quantity < 1
  //         return { ...item, selectedQuantity: newQuantity };
  //       }
  //       return item;
  //     });
  
  //     if (capped) {
  //       if (delta > 0 && total === target) {
  //         // Adding: Redistribute the excess to maintain the target
  //         const excess = updatedInventory.reduce(
  //           (sum, item) => sum + item.selectedQuantity,
  //           0
  //         ) - target;
  //         return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
  //       }
  
  //       if (total < target || delta < 0) {
  //         // Allow normal addition until the target is reached or subtraction
  //         const newTotal = updatedInventory.reduce(
  //           (sum, item) => sum + item.selectedQuantity,
  //           0
  //         );
  //         return newTotal <= target ? updatedInventory : adjustToFitTarget(updatedInventory, target);
  //       }
  //     }
  
  //     // If uncapped, allow unrestricted changes
  //     return updatedInventory;
  //   });
  // };

  const adjustQuantity = (itemId, delta) => {
    setSelectedInventory((prevSelected) => {
      const target = selectedIngredient.quantity;
  
      // Calculate the current total
      let totalSelected = prevSelected.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
      // Map through inventory to adjust the quantity for the selected item
      const updatedInventory = prevSelected.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(
            1, // Ensure at least 1
            Math.min(item.selectedQuantity + delta, item.quantity) // Don't exceed item's available quantity
          );
          totalSelected += newQuantity - item.selectedQuantity; // Update the total with the adjusted quantity
          return { ...item, selectedQuantity: newQuantity };
        }
        return item;
      });
  
      if (capped && totalSelected > target) {
        // If capped and total exceeds the target, redistribute excess
        const excess = totalSelected - target;
        return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
      }
  
      // Return updated inventory for both capped and uncapped modes
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
  
  const finalizeQuantities = async () => {
    try {
      // Check if selectedIngredient and selectedInventory are valid
      if (!selectedIngredient || !selectedInventory || selectedInventory.length === 0) {
        console.warn("Ingredient or inventory selection is missing.");
        return;
      }

      
  
      // Filter out entries with used_quantity === 0
      const filteredInventory = selectedInventory.filter((item) => item.selectedQuantity > 0);
  
      if (filteredInventory.length === 0) {
        alert("No valid inventory selected. Please select quantities to proceed.");
        return;
      }

      // Fetch the `status_id` for "Planning"
      const statusId = await getStatusIdByName("Planning");
      if (!statusId) {
        alert("Failed to fetch status ID for 'Planning'.");
        return;
      }
  
      // Fetch meal plan IDs if not already provided
      // const enrichedInventory = await Promise.all(
      //   filteredInventory.map(async (item) => {
      //     if (item.meal_plan_id) {
      //       return item; // If meal_plan_id exists, return as is
      //     }
  
      //     // Fetch meal plan ID for the ingredient and recipe
      //     const { data: mealPlanData, error } = await supabase
      //       .from("meal_plan")
      //       .select("id")
      //       .eq("planned_date", planned_date) // Use the planned_date context
      //       .eq("recipe_id", selectedIngredient.recipes[0]?.recipeId || null)
      //       .limit(1) // Assume one-to-one mapping
      //       .single();
  
      //     if (error) {
      //       console.warn(`Failed to fetch meal plan for inventory ID: ${item.id}`, error);
      //       return { ...item, meal_plan_id: null }; // Return with null if not found
      //     }
  
      //     return { ...item, meal_plan_id: mealPlanData?.id || null }; // Add the meal_plan_id
      //   })
      // );

       // Use the `enrichInventory` function to enrich the inventory
      const enrichedInventory = await enrichInventory(
        filteredInventory,
        selectedIngredient,
        planned_date
      );
      // inventory_id
      // meal_plan_id
      // used_quantity
      // status_id
      // created_at
      // updated_at

      // Validate that no selectedQuantity exceeds the required cap
      for (const item of enrichedInventory) {
        if (item.selectedQuantity > requiredQuantity) {
          alert(
            `Selected quantity (${item.selectedQuantity}) exceeds the required cap (${requiredQuantity}) for inventory ID ${item.id}. Please adjust and try again.`
          );
          return; // Exit the function
        }
      }

      // Prepare the data for insertion
      const dataToInsert = enrichedInventory.map((item) => ({
        inventory_id: item.id,
        meal_plan_id: item.meal_plan_id,
        used_quantity: item.selectedQuantity,
        status_id: statusId, // Use the dynamically fetched status_id
        created_at: new Date().toISOString(), // Track when the entry was created
      }));
  
      // Log data for debugging
      // console.log("Filtered and Enriched Data to Insert:", dataToInsert);
  
      // Insert into the database (uncomment when using Supabase)

      const { data, error } = await supabase.from("inventory_meal_plan").insert(dataToInsert);
      if (error) {
        throw error;
      }
      // console.log("Inserted Data:", data);
      
      // Reset states after processing
      setSelectedIngredient(null); // Close modal
      setSelectedInventory([]); // Reset inventory
      setAdjustingQuantity(false); // Exit adjusting mode
  
      alert("Quantities successfully logged to the console!");
    } catch (err) {
      console.error("Error finalizing quantities:", err.message);
      alert("Failed to finalize quantities. Please try again.");
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
                          Needed in {getRecipeNameById(recipe.recipeId)}:{" "}
                          <strong>
                            {recipe.quantity} {ingredient.ingredients.unit?.unit_tag || ""}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}
                  {ingredient.inventoryItems?.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <h4>Linked Inventory Items:</h4>
                      <ul>
                        {/* {ingredient.inventoryItems.map((inventory, idx) => (
                          <li key={idx}>
                            Inventory ID: {inventory.inventory_id},
                            original quantity: {inventory.inventory.quantity} {inventory.ingredients.unit.unit_tag},
                             Used Quantity:{" "}
                            {inventory.used_quantity} {inventory.ingredients.unit.unit_tag}, Status ID: {inventory.status_id},  Status: {inventory.inventory_meal_plan_status.name}
                            expiry date: {inventory.inventory.expiry_date.date}, {inventory.inventory.days_left}days left
                          </li>
                        ))} */}
                        {ingredient.inventoryItems?.map((inventory, idx) => (
                          <li key={idx}>
                            Inventory ID: {inventory.inventory_id || "N/A"},
                            original quantity: {inventory.inventory?.quantity || 0}{" "}
                            {inventory.ingredients?.unit?.unit_tag || "unit not specified"},
                            Used Quantity:{" "}
                            {inventory.used_quantity || 0}{" "}
                            {inventory.ingredients?.unit?.unit_tag || "unit not specified"},
                            Status ID: {inventory.status_id || "N/A"}, 
                            Status: {inventory.inventory_meal_plan_status?.name || "Unknown"},
                            expiry date: {inventory.inventory?.expiry_date?.date || "No expiry date"}, 
                            {inventory.inventory?.days_left || 0} days left
                          </li>
                        ))}


                      </ul>
                    </div>
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
                        {/* {item.quantity} {item.unit?.unit_tag || ""} (Expiry:{" "}
                        {item.expiry_date?.date || "No expiry date"}) */}
                        {item.quantity || 0} {item.unit?.unit_tag || "unit not specified"} (Expiry:{" "}
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
                  {/* {selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0)}{" "} */}
                  {selectedInventory
                    .filter((item) => item.preselected) // Only include preselected items
                    .reduce((sum, item) => sum + item.selectedQuantity, 0)}{" "}
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
                            <span>
                              Original: {recipe.quantity}{" "}
                              {selectedIngredient.ingredients.unit?.unit_tag || ""}
                            </span>{" "}
                            |{" "}
                            <span>
                              Exceed Allocated: {recipe.exceedAllocation || 0}{" "}
                              {selectedIngredient.ingredients.unit?.unit_tag || ""}
                            </span>{" "}
                            |{" "}
                            <span>
                              <strong>
                                Total:{" "}
                                {recipe.quantity + (recipe.exceedAllocation || 0)}{" "}
                                {selectedIngredient.ingredients.unit?.unit_tag || ""}
                              </strong>
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                              onClick={() => adjustExceedAllocation(recipe.recipeId, -1)}
                              disabled={recipe.exceedAllocation <= 0}
                              style={{
                                background: "blue",
                                color: "white",
                                borderRadius: "5px",
                              }}
                            >
                              -
                            </button>
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
                              onChange={(e) =>
                                handleExceedInputChange(recipe.recipeId, e.target.value)
                              }
                              style={{
                                width: "60px",
                                textAlign: "center",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                padding: "5px",
                              }}
                            />
                            <button
                              onClick={() => adjustExceedAllocation(recipe.recipeId, 1)}
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
