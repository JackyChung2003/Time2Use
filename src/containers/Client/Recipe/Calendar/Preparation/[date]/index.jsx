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
    fetchInventoryData
  } = useRecipeContext();

  const navigate = useNavigate();
  const { date } = useParams(); // Get date from URL
  const location = useLocation();
  const { planned_date, meal_type_id } = location.state || {};

  const [refreshCounter, setRefreshCounter] = useState(0);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [ingredients, setIngredients] = useState([]);
  const [mergedIngredients, setMergedIngredients] = useState([]);
  // const [isCombined, setIsCombined] = useState(true);


  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);

  const [selectedInventory, setSelectedInventory] = useState([]); // State to track selected inventory items
  const [adjustingQuantity, setAdjustingQuantity] = useState(false); // Add this state

  const exceedAmount = Math.max(
    0,
    (selectedInventory || []).reduce((sum, item) => sum + item.selectedQuantity, 0) -
      (selectedIngredient?.quantity || 0)
  );
  
  const [mealPlanIds, setMealPlanIds] = useState([]);// Add a global state for requiredQuantity
  const [requiredQuantity, setRequiredQuantity] = useState(null);
  const [mealPlans, setMealPlans] = useState([]); // Store meal plans
  const [inventoryData, setInventoryData] = useState([]); // Store inventory data

  const [linkedInventory, setLinkedInventory] = useState([]); // For storing the inventory
  const [isUpdateMode, setIsUpdateMode] = useState(false); // Track if Update or Finalize mode

  const [steps, setSteps] = useState([]);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [previousStepIndex, setPreviousStepIndex] = useState(null);

  const [convertedItems, setConvertedItems] = useState({}); // Track converted state
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
  
        // Fetch meal plans and inventory data
        const [mealPlans, inventoryData] = await Promise.all([
          fetchMealPlansByDate(planned_date),
          fetchInventoryData({ plannedDate: planned_date }),
        ]);
  
        // Filter relevant meal plans
        const relevantPlans = mealPlans.filter(
          (meal) => meal.meal_type_id === meal_type_id
        );
        // console.log("Relevant Meal Plans:", relevantPlans);
        setMealPlans(relevantPlans);
  
        if (relevantPlans.length === 0) {
          console.warn("No meal plans found for the given date and meal type.");
          setRecipes([]);
          // setMergedIngredients([]);
          setIngredients([]);
          setInventoryData(inventoryData);
          return;
        }
  
        // Fetch recipes by IDs
        const recipeIds = relevantPlans.map((meal) => meal.recipe_id);
        const fetchedRecipes = await fetchRecipesByIds(recipeIds);
        setRecipes(fetchedRecipes);
  
        // Fetch ingredients for recipes
        const recipeIngredients = await Promise.all(
          fetchedRecipes.map(async (recipe) => {
            const ingredientsData = await fetchRecipeIngredients(recipe.id);
            return { recipeId: recipe.id, ingredients: ingredientsData };
          })
        );
        setIngredients(recipeIngredients);
        
        // Fetch inventory meal plan data
        const mealPlanIds = relevantPlans.map((plan) => plan.id);
        // console.log("Meal Plan IDs:", mealPlanIds);
        setMealPlanIds(mealPlanIds);

        const inventoryMealPlanData = await fetchInventoryMealPlanByMealPlanId(mealPlanIds);
        // console.log("Inventory Meal Plan Data:", inventoryMealPlanData);

        setInventoryData(inventoryData);
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
    fetchInventoryData,
    refreshCounter,
  ]);
  
  // Handle selected inventory changes
  useEffect(() => {
    if (selectedInventory.length > 0) {
      assignToRecipes();
    }
  }, [selectedInventory]);
  
  // Handle exceed amount changes
  useEffect(() => {
    if (exceedAmount > 0) {
      autoAllocateExceed();
    }
  }, [exceedAmount]);
  
  useEffect(() => {
    const loadSteps = async () => {
        if (recipes.length > 0) {
            // Fetch steps for the first recipe as an example (or the selected recipe)
            const recipeId = recipes[0]?.id; // Change this logic to suit your needs
            const recipeSteps = await fetchRecipeSteps(recipeId); // Replace with your actual fetch logic
            setSteps(recipeSteps);
        }
    };

    loadSteps();
}, [recipes, fetchRecipeSteps]);

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

  // const allocateInventoryFIFO = (ingredient, inventory) => {
  //   const target = ingredient.quantity;
  //   // console.log("Target Quantity Needed:", target);
  
  //   // Step 1: Sort inventory by expiry date first, then by quantity
  //   const sortedInventory = [...inventory].sort((a, b) => {
  //     const dateA = new Date(a.expiry_date?.date || "9999-12-31");
  //     const dateB = new Date(b.expiry_date?.date || "9999-12-31");
  //     if (dateA - dateB !== 0) {
  //       return dateA - dateB; // Sort by expiry date first
  //     }
  //     return a.quantity - b.quantity; // Then by quantity
  //   });
  
  //   // console.log("Sorted Inventory by Expiry and Quantity:", sortedInventory);
  
  //   // Step 2: Find the optimal combination of items
  //   let remainingRequired = target;
  //   const selectedItems = [];
  //   for (let i = 0; i < sortedInventory.length; i++) {
  //     const item = sortedInventory[i];
  
  //     // If the current item's quantity alone satisfies the requirement, take it and stop
  //     if (item.quantity >= remainingRequired) {
  //       selectedItems.push({
  //         ...item,
  //         selectedQuantity: remainingRequired,
  //         preselected: true,
  //       });
  //       remainingRequired = 0;
  //       break;
  //     }
  
  //     // Otherwise, take the current item fully and subtract its quantity from the requirement
  //     selectedItems.push({
  //       ...item,
  //       selectedQuantity: item.quantity,
  //       preselected: true,
  //     });
  //     remainingRequired -= item.quantity;
  
  //     // If the requirement is satisfied, stop
  //     if (remainingRequired <= 0) {
  //       break;
  //     }
  //   }
  
  //   // console.log("Selected Items:", selectedItems);
  
  //   // Step 3: Mark the remaining inventory as unselected
  //   const finalInventory = sortedInventory.map((item) => {
  //     const selectedItem = selectedItems.find((selected) => selected.id === item.id);
  //     return selectedItem
  //       ? selectedItem
  //       : { ...item, preselected: false, selectedQuantity: 0 }; // Mark unselected
  //   });
  
  //   // console.log("Final Allocated Inventory:", finalInventory);
  
  //   return finalInventory;
  // };
  
  // const allocateInventoryFIFO = (ingredient, inventory) => {
  //   const target = ingredient.quantity; // Target quantity required
  //   const ingredientConversionRate = ingredient.ingredients.unit?.conversion_rate_to_grams || 1; // Ingredient conversion rate
  //   const targetInBaseUnit = target * ingredientConversionRate; // Convert target to base unit (grams)
  
  //   console.log("Ingredient:", ingredient);
  //   console.log("Ingredient Conversion Rate:", ingredientConversionRate);
  //   console.log("Target Quantity in Base Unit (grams):", targetInBaseUnit);
  
  //   // Step 1: Sort inventory by expiry date first, then by quantity
  //   const sortedInventory = [...inventory].sort((a, b) => {
  //     const dateA = new Date(a.expiry_date?.date || "9999-12-31");
  //     const dateB = new Date(b.expiry_date?.date || "9999-12-31");
  //     if (dateA - dateB !== 0) {
  //       return dateA - dateB; // Sort by expiry date first
  //     }
  //     return a.quantity - b.quantity; // Then by quantity
  //   });
  
  //   console.log("Sorted Inventory by Expiry Date and Quantity:", sortedInventory);
  
  //   // Step 2: Find the optimal combination of items
  //   let remainingRequired = targetInBaseUnit; // Remaining required quantity in base unit
  //   const selectedItems = [];
  //   for (let i = 0; i < sortedInventory.length; i++) {
  //     const item = sortedInventory[i];
  //     const itemConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1; // Inventory item conversion rate
  //     const itemQuantityInBaseUnit = item.quantity * itemConversionRate; // Convert item quantity to base unit (grams)
  
  //     // Adjust quantity in ingredient's unit
  //     const adjustedQuantity = itemQuantityInBaseUnit / ingredientConversionRate;
  
  //     console.log(`Inventory Item ${i + 1}:`, item);
  //     console.log("Item Conversion Rate:", itemConversionRate);
  //     console.log("Item Quantity in Base Unit (grams):", itemQuantityInBaseUnit);
  //     console.log("Adjusted Quantity in Ingredient's Unit:", adjustedQuantity);
  
  //     // If the current item's quantity alone satisfies the requirement, take it and stop
  //     if (itemQuantityInBaseUnit >= remainingRequired) {
  //       console.log("Item fully satisfies the remaining requirement.");
  //       selectedItems.push({
  //         ...item,
  //         selectedQuantity: remainingRequired / itemConversionRate, // Convert back to item's unit
  //         preselected: true,
  //         adjustedQuantity: remainingRequired / ingredientConversionRate, // Adjusted quantity for ingredient's unit
  //       });
  //       remainingRequired = 0;
  //       break;
  //     }
  
  //     // Otherwise, take the current item fully and subtract its quantity from the requirement
  //     selectedItems.push({
  //       ...item,
  //       selectedQuantity: item.quantity, // Use the full quantity in item's unit
  //       preselected: true,
  //       adjustedQuantity, // Adjusted quantity for ingredient's unit
  //     });
  //     remainingRequired -= itemQuantityInBaseUnit;
  
  //     console.log("Remaining Required Quantity in Base Unit (grams):", remainingRequired);
  
  //     // If the requirement is satisfied, stop
  //     if (remainingRequired <= 0) {
  //       console.log("Requirement fully satisfied.");
  //       break;
  //     }
  //   }
  
  //   // Step 3: Mark the remaining inventory as unselected
  //   const finalInventory = sortedInventory.map((item) => {
  //     const selectedItem = selectedItems.find((selected) => selected.id === item.id);
  //     return selectedItem
  //       ? selectedItem
  //       : { ...item, preselected: false, selectedQuantity: 0, adjustedQuantity: 0 }; // Mark unselected
  //   });
  
  //   console.log("Selected Items:", selectedItems);
  //   console.log("Final Allocated Inventory:", finalInventory);
  
  //   return finalInventory;
  // };
  
  const allocateInventoryFIFO = (ingredient, inventory) => {
    const target = ingredient.quantity; // Target quantity required
    const ingredientConversionRate = ingredient.ingredients.unit?.conversion_rate_to_grams || 1; // Ingredient conversion rate
    const targetInBaseUnit = target * ingredientConversionRate; // Convert target to base unit (grams)
    const minimumQuantity = 5 * ingredientConversionRate; // Minimum quantity in base unit
  
    console.log("Ingredient:", ingredient);
    console.log("Ingredient Conversion Rate:", ingredientConversionRate);
    console.log("Target Quantity in Base Unit (grams):", targetInBaseUnit);
    console.log("Minimum Quantity in Base Unit (grams):", minimumQuantity);
  
    // Step 1: Sort inventory by expiry date first, then by quantity
    const sortedInventory = [...inventory].sort((a, b) => {
      const dateA = new Date(a.expiry_date?.date || "9999-12-31");
      const dateB = new Date(b.expiry_date?.date || "9999-12-31");
      if (dateA - dateB !== 0) {
        return dateA - dateB; // Sort by expiry date first
      }
      return a.quantity - b.quantity; // Then by quantity
    });
  
    console.log("Sorted Inventory by Expiry Date and Quantity:", sortedInventory);
  
    // Step 2: Find the optimal combination of items
    let remainingRequired = targetInBaseUnit; // Remaining required quantity in base unit
    const selectedItems = [];
    const disqualifiedItems = [];
  
    for (let i = 0; i < sortedInventory.length; i++) {
      const item = sortedInventory[i];
      const itemConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1; // Inventory item conversion rate
      const itemQuantityInBaseUnit = item.quantity * itemConversionRate; // Convert item quantity to base unit (grams)
  
      console.log(`Inventory Item ${i + 1}:`, item);
      console.log("Item Conversion Rate:", itemConversionRate);
      console.log("Item Quantity in Base Unit (grams):", itemQuantityInBaseUnit);
  
      // Check if the item meets the minimum quantity requirement
      if (itemQuantityInBaseUnit < minimumQuantity) {
        console.log("Item does not meet the minimum quantity requirement. Marking as predisqualified.");
        disqualifiedItems.push({
          ...item,
          preselected: false,
          predisqualified: true, // Mark as predisqualified
          selectedQuantity: 0,
          adjustedQuantity: 0,
        });
        continue; // Skip this item
      }
  
      // Adjust quantity in ingredient's unit
      const adjustedQuantity = itemQuantityInBaseUnit / ingredientConversionRate;
  
      // If the current item's quantity alone satisfies the requirement, take it and stop
      if (itemQuantityInBaseUnit >= remainingRequired) {
        console.log("Item fully satisfies the remaining requirement.");
        selectedItems.push({
          ...item,
          selectedQuantity: remainingRequired / itemConversionRate, // Convert back to item's unit
          preselected: true,
          predisqualified: false,
          adjustedQuantity: remainingRequired / ingredientConversionRate, // Adjusted quantity for ingredient's unit
        });
        remainingRequired = 0;
        break;
      }
  
      // Otherwise, take the current item fully and subtract its quantity from the requirement
      selectedItems.push({
        ...item,
        selectedQuantity: item.quantity, // Use the full quantity in item's unit
        preselected: true,
        predisqualified: false,
        adjustedQuantity, // Adjusted quantity for ingredient's unit
      });
      remainingRequired -= itemQuantityInBaseUnit;
  
      console.log("Remaining Required Quantity in Base Unit (grams):", remainingRequired);
  
      // If the requirement is satisfied, stop
      if (remainingRequired <= 0) {
        console.log("Requirement fully satisfied.");
        break;
      }
    }
  
    // Step 3: Combine selected, disqualified, and unselected items
    const finalInventory = sortedInventory.map((item) => {
      const selectedItem = selectedItems.find((selected) => selected.id === item.id);
      const disqualifiedItem = disqualifiedItems.find((disqualified) => disqualified.id === item.id);
      return selectedItem || disqualifiedItem || { ...item, preselected: false, predisqualified: false, selectedQuantity: 0, adjustedQuantity: 0 };
    });
  
    console.log("Selected Items:", selectedItems);
    console.log("Disqualified Items:", disqualifiedItems);
    console.log("Final Allocated Inventory:", finalInventory);
  
    return finalInventory;
  };
  

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
  
  const handleIngredientClick = async (ingredient, recipeId) => {
    try {
      // setSelectedIngredient(null); // Clear previous selection
      console.log("recipe id",recipeId )

      setSelectedIngredient(ingredient); // Set selected ingredient first
      // setSelectedIngredient({ ...ingredient, recipeId }); // Store recipeId in state
      setInventoryItems([]); // Reset inventory items
      setSelectedInventory([]); // Reset selected inventory
      setAdjustingQuantity(false); // Reset adjusting state

      const inventory = await fetchUserInventory(ingredient.ingredients.id);

      if (inventory.length === 0) {
        console.warn("No inventory available for this ingredient.");
        setAdjustingQuantity(false); // Stop adjusting if inventory is empty
        return; // Exit the function early
      }

      // console.log('inventory:', inventory);
      // console.log('ingredient:', ingredient);
      // console.log("Fetched Inventory:", inventory);

      // Fetch linked inventory from the meal plan
      // const mealPlanIds = recipes.map((recipe) => recipe.id); // Assuming you can derive meal plan IDs from recipes
      // console.log("Meal Plan IDsHEREEEEE:", mealPlanIds);
      const inventoryMealPlanData = await fetchInventoryMealPlanByMealPlanId(mealPlanIds);
      // console.log("Fetched Inventory Meal Plan Data:", inventoryMealPlanData);

      // Filter inventory meal plan data for the current ingredient
      const linkedInventory = inventoryMealPlanData.filter(
        (item) =>
          item.inventory.ingredient_id === ingredient.ingredients.id &&
          item.meal_plan?.recipe_id === recipeId // Safely access recipe_id
          // item.inventory.ingredient_id === ingredient.ingredients.id &&
          // item.meal_plan?.recipe_id === recipeId // Safely access recipe_id
      );

      // console.log("Linked Inventory from Meal Plan:", linkedInventory);

      let allocatedInventory;
      if (linkedInventory.length > 0) {
        allocatedInventory = preselectLinkedInventory(linkedInventory, inventory);
        setIsUpdateMode(true); // Set update mode
      } else {
        allocatedInventory = allocateInventoryFIFO(ingredient, inventory);
        setIsUpdateMode(false); // Set finalize mode
      }

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
    if ((currentlySelected.length === 0) || (totalSelectedQuantity < selectedIngredient.quantity)) {
      alert(
        `You must select at least ${ "one item"} to proceed. Now you have selected ${totalSelectedQuantity} ${selectedIngredient.ingredients.unit?.unit_tag || ""}.`
  
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
  
  const adjustQuantity = (itemId, delta) => {
    setSelectedInventory((prevSelected) => {
    const inventory = prevSelected || [];
      const target = selectedIngredient.quantity;
  
      // Calculate the current total
      // let totalSelected = prevSelected.reduce((sum, item) => sum + item.selectedQuantity, 0);
      let totalSelected = inventory.reduce((sum, item) => sum + item.selectedQuantity, 0);
      
    
      // Map through inventory to adjust the quantity for the selected item
      const updatedInventory = inventory.map((item) => {
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
  
      if (totalSelected > target) {
        // If capped and total exceeds the target, redistribute excess
        const excess = totalSelected - target;
        // alert(
        //   `Cap is enabled, but you have exceeded the target of ${target} by selecting ${totalSelected}.`
        // );
        return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
      }
      
      // if (capped && totalSelected > target) {
      //   alert(
      //     `Cap is enabled, but you have exceeded the target of ${target} by selecting ${totalSelected}.`
      //   );
      // }
  
      // Return updated inventory for both capped and uncapped modes
      return updatedInventory;
    });
  };  
  
  // const handleQuantityInputChange = (itemId, newQuantity) => {
  //   setSelectedInventory((prevSelected) => {
  //     const target = selectedIngredient.quantity;
  
  //     // Parse and ensure valid quantity input
  //     const parsedQuantity = Math.max(1, parseInt(newQuantity) || 1);
  
  //     // Validate against the maximum allowed quantity for the item
  //     const updatedInventory = prevSelected.map((item) => {
  //       if (item.id === itemId) {
  //         if (parsedQuantity > item.quantity) {
  //           alert(`You cannot exceed the available quantity of ${item.quantity}.`);
  //           return item; // Return the item unchanged
  //         }
  //         return { ...item, selectedQuantity: parsedQuantity };
  //       }
  //       return item;
  //     });
  
  //     // if (capped) {
  //     //   const total = updatedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0);
  
  //     //   if (total > target) {
  //     //     const excess = total - target;
  //     //     return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
  //     //   }
  
  //     //   return updatedInventory; // Allow setting when within or exactly at the target
  //     // }
  
  //     // Allow unrestricted input in uncapped mode
  //     return updatedInventory;
  //   });
  // };

  // const handleQuantityInputChange = (itemId, newQuantity) => {
  //   setSelectedInventory((prevSelected) => {
  //     const target = selectedIngredient.quantity;
  //     // console.log("target", target);
  
  //     // Parse and ensure valid quantity input
  //     const parsedQuantity = Math.max(1, parseInt(newQuantity) || 1);
  //     console.log("parsedQuantity", parsedQuantity);
  
  //     // Validate and update the inventory
  //     const updatedInventory = prevSelected.map((item) => {
  //       if (item.id === itemId) {
  //         // Get conversion rates
  //         const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1;
  //         const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;
  
  //         // Check if item is converted
  //         const isCurrentlyConverted = item.isConverted || false;

  //         console.log("isconverted",isCurrentlyConverted);
  
  //         // Determine the maximum allowable quantity based on conversion
  //         const maxAllowedQuantity = isCurrentlyConverted
  //           ? Math.floor(item.quantity * inventoryConversionRate / baseConversionRate) // Converted maximum quantity
  //           : item.quantity; // Default maximum quantity
  
  //         // Validate input against the maximum allowable quantity
  //         if (parsedQuantity > maxAllowedQuantity) {
  //           alert(
  //             `You cannot exceed the ${
  //               isCurrentlyConverted ? "converted " : ""
  //             }available quantity of ${maxAllowedQuantity}.`
  //           );
  //           return item; // Return the item unchanged
  //         }
  
  //         // Update the selected quantity
  //         return { ...item, selectedQuantity: parsedQuantity };
  //       }
  //       return item;
  //     });
  
  //     return updatedInventory;
  //   });
  // };

  const handleQuantityInputChange = (itemId, newQuantity) => {
    setSelectedInventory((prevSelected) => {
      // Parse and ensure valid quantity input
      const parsedQuantity = Math.max(1, parseInt(newQuantity) || 1);
  
      const updatedInventory = prevSelected.map((item) => {
        if (item.id === itemId) {
          // Get conversion rates
          const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1;
          const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;
  
          // Check if item is converted
          const isCurrentlyConverted = item.isConverted || false;
  
          // Flip the logic for `target` calculation
          const target = !isCurrentlyConverted
            ? selectedIngredient.quantity * (baseConversionRate / inventoryConversionRate) // Convert target to inventory unit
            : selectedIngredient.quantity; // Keep original target if already converted
  
          // Flip the logic for `maxAllowedQuantity` calculation
          const maxAllowedQuantity = !isCurrentlyConverted
            ? Math.floor(item.quantity * inventoryConversionRate / baseConversionRate) // Converted maximum quantity
            : item.quantity; // Default maximum quantity
  
          // Log conversion details for debugging
          console.log("isCurrentlyConverted:", isCurrentlyConverted);
          console.log("parsedQuantity:", parsedQuantity);
          console.log("maxAllowedQuantity:", maxAllowedQuantity);
          console.log("target:", target);
  
          // Validate input against the maximum allowable quantity and target
          if (parsedQuantity > maxAllowedQuantity || parsedQuantity > target) {
            // alert(
            //   `You cannot exceed the ${
            //     !isCurrentlyConverted ? "converted " : ""
            //   }available quantity of ${Math.min(maxAllowedQuantity, target)}.`
            // );
            return item; // Return the item unchanged
          }
  
          // Update the selected quantity
          return { ...item, selectedQuantity: parsedQuantity };
        }
        return item;
      });
  
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
  
  // const handleFinalizeQuantities = async () => {
  //   try {
  //     // Check if selectedIngredient and selectedInventory are valid
  //     if (!selectedIngredient || !selectedInventory || selectedInventory.length === 0) {
  //       console.warn("Ingredient or inventory selection is missing.");
  //       return;
  //     }

  //     // Filter out entries with used_quantity === 0
  //     const filteredInventory = selectedInventory.filter((item) => item.selectedQuantity > 0);
  
  //     if (filteredInventory.length === 0) {
  //       alert("No valid inventory selected. Please select quantities to proceed.");
  //       return;
  //     }

  //     // Fetch the `status_id` for "Planning"
  //     const statusId = await getStatusIdByName("Planning");
  //     if (!statusId) {
  //       alert("Failed to fetch status ID for 'Planning'.");
  //       return;
  //     }

  //      // Use the `enrichInventory` function to enrich the inventory
  //     const enrichedInventory = await enrichInventory(
  //       filteredInventory,
  //       selectedIngredient,
  //       planned_date
  //     );
  //     // inventory_id
  //     // meal_plan_id
  //     // used_quantity
  //     // status_id
  //     // created_at
  //     // updated_at

  //     // Validate that no selectedQuantity exceeds the required cap
  //     for (const item of enrichedInventory) {
  //       if (item.selectedQuantity > requiredQuantity) {
  //         alert(
  //           `Selected quantity (${item.selectedQuantity}) exceeds the required cap (${requiredQuantity}) for inventory ID ${item.id}. Please adjust and try again.`
  //         );
  //         return; // Exit the function
  //       }
  //     }

  //     // Prepare the data for insertion
  //     const dataToInsert = enrichedInventory.map((item) => ({
  //       inventory_id: item.id,
  //       meal_plan_id: item.meal_plan_id,
  //       used_quantity: item.selectedQuantity,
  //       status_id: statusId, // Use the dynamically fetched status_id
  //       created_at: new Date().toISOString(), // Track when the entry was created
  //       ingredient_id: selectedIngredient.ingredients.id,
  //     }));
  
  //     // Log data for debugging
  //     console.log("Filtered and Enriched Data to Insert:", dataToInsert);
  
  //     // Insert into the database (uncomment when using Supabase)

  //     // const { data, error } = await supabase.from("inventory_meal_plan").insert(dataToInsert);
  //     // if (error) {
  //     //   throw error;
  //     // }
  //     // console.log("Inserted Data:", data);
      
  //     // Reset states after processing
  //     setSelectedIngredient(null); // Close modal
  //     setSelectedInventory([]); // Reset inventory
  //     setAdjustingQuantity(false); // Exit adjusting mode
  
  //     // alert("Quantities successfully logged to the console!");
  //     setRefreshCounter((prev) => prev + 1);
  //   } catch (err) {
  //     console.error("Error finalizing quantities:", err.message);
  //     alert("Failed to finalize quantities. Please try again.");
  //   }
  // };

  const handleFinalizeQuantities = async () => {
    try {
      // Check if selectedIngredient and selectedInventory are valid
      if (!selectedIngredient || !selectedInventory || selectedInventory.length === 0) {
        console.warn("Ingredient or inventory selection is missing.");
        return;
      }
  
      // Filter out entries with selectedQuantity === 0
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
  
      // Use the `enrichInventory` function to enrich the inventory
      const enrichedInventory = await enrichInventory(
        filteredInventory,
        selectedIngredient,
        planned_date
      );
      
  
      // Validate that no selectedQuantity exceeds the required cap
      for (const item of enrichedInventory) {
        const baseConversionRate = selectedIngredient.ingredients.unit?.conversion_rate_to_grams || 1;
        const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;
        const isCurrentlyConverted = item.isConverted || false;
        
        // Determine the adjusted required quantity in the item's unit
        const requiredQuantityInItemUnit = isCurrentlyConverted
          ? requiredQuantity
          : (requiredQuantity * baseConversionRate) / inventoryConversionRate; // Use cap in base unit

        if (item.selectedQuantity > requiredQuantityInItemUnit) {
          alert(
            `Selected quantity (${item.selectedQuantity}) exceeds the required cap (${requiredQuantityInItemUnit}) for inventory ID ${item.id}. Please adjust and try again.`
          );
          return; // Exit the function
        }
      }
  
      // Prepare the data for insertion
      const dataToInsert = enrichedInventory.map((item) => {
        const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1;
        const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;
        const isCurrentlyConverted = item.isConverted || false;

        // Ensure used_quantity is in the base unit (non-converted)
        const usedQuantity = isCurrentlyConverted
          ? (item.selectedQuantity * baseConversionRate) / inventoryConversionRate // Convert back to base unit
          : item.selectedQuantity; // Already in base unit
  
        return {
          inventory_id: item.id,
          meal_plan_id: item.meal_plan_id,
          used_quantity: usedQuantity, // Push non-converted quantity
          status_id: statusId, // Use the dynamically fetched status_id
          created_at: new Date().toISOString(), // Track when the entry was created
          ingredient_id: selectedIngredient.ingredients.id,
        };
      });
  
      // Log data for debugging
      console.log("Filtered and Enriched Data to Insert (Base Unit):", dataToInsert);
  
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
  
      setRefreshCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error finalizing quantities:", err.message);
      alert("Failed to finalize quantities. Please try again.");
    }
  };
  
  const handleUpdateQuantities = async () => {
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
  
      // Log filtered inventory
      console.log("Filtered Inventory:", filteredInventory);
  
      // Use the `enrichInventory` function to enrich the inventory
      const enrichedInventory = await enrichInventory(
        filteredInventory,
        selectedIngredient,
        planned_date
      );
  
      // Log enriched inventory for debugging
      // console.log("Enriched Inventory for Update:", enrichedInventory);
  
      // Log other key details
      // console.log("Selected Ingredient for Update:", selectedIngredient);
      // console.log("Meal Plan IDs for Update:", mealPlanIds);
      // console.log("Selected Inventory for Update:", selectedInventory);
      // console.log("Ingredient ID for Update:", selectedIngredient.ingredients.id);
  
      // Update rows based on `meal_plan_id`, `inventory_id`, and `ingredient_id`
      const updatePromises = enrichedInventory.map((item) => {
        console.log("Updating row with the following details:", {
          meal_plan_id: item.meal_plan_id,
          inventory_id: item.inventory_id,
          ingredient_id: selectedIngredient.ingredients.id,
          used_quantity: item.selectedQuantity,
        });
  
        return supabase
          .from("inventory_meal_plan")
          .update({
            used_quantity: item.selectedQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("meal_plan_id", item.meal_plan_id) // Match meal_plan_id
          .eq("inventory_id", item.id) // Match inventory_id
          .eq("ingredient_id", selectedIngredient.ingredients.id); // Match ingredient_id
      });
  
      // Execute all update promises
      const results = await Promise.all(updatePromises);
  
      // Log results of the updates
      results.forEach(({ data, error }, index) => {
        if (error) {
          console.error(`Error updating row ${index + 1}:`, error.message);
        } else {
          console.log(`Update successful for row ${index + 1}:`, data);
        }
      });
  
      // Log success message
      console.log("Updated Quantities Successfully using meal_plan_id, inventory_id, and ingredient_id!");
  
      // Reset states after processing
      setSelectedIngredient(null); // Close modal
      setSelectedInventory([]); // Reset inventory
      setAdjustingQuantity(false); // Exit adjusting mode
  
      // alert("Quantities successfully updated!");
      setRefreshCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error updating quantities:", err.message);
      alert("Failed to update quantities. Please try again.");
    }
  };

  const handleDeleteInventory = async (inventoryId, mealPlanId, ingredientId) => {
    try {
      const { data, error } = await supabase
        .from("inventory_meal_plan")
        .delete()
        .eq("inventory_id", inventoryId) // Match inventory_id
        .eq("meal_plan_id", mealPlanId) // Match meal_plan_id
        .eq("ingredient_id", ingredientId); // Match ingredient_id
  
      if (error) {
        console.error("Error deleting inventory:", error.message);
        alert("Failed to delete the inventory item. Please try again.");
        return;
      }
  
      console.log("Deleted inventory:", data);
      // alert("Inventory item deleted successfully!");
  
      // Optionally, refresh the data or update the UI
      const updatedLinkedInventory = linkedInventory.filter(
        (item) =>
          item.inventory_id !== inventoryId ||
          item.meal_plan_id !== mealPlanId ||
          item.ingredient_id !== ingredientId
      );
      setLinkedInventory(updatedLinkedInventory);
      setRefreshCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Unexpected error deleting inventory:", err.message);
      alert("Failed to delete the inventory item. Please try again.");
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
  

  

  // const handleToggleCapped = () => {
  //   setCapped((prevCapped) => {
  //     console.log("Previous capped value:", prevCapped);
  //     return !prevCapped;
  //   });
  // };
  
  if (loading) {
    return <div>Loading preparation details...</div>;
  }

  if (recipes.length === 0) {
    return <div>No recipes found for this meal plan.</div>;
  }

  // const autoAdjustQuantities = () => {
  //   let remainingRequired = selectedIngredient.quantity;
  
  //   const adjustedInventory = (selectedInventory || []).map((item) => {
  //     if (!item.preselected || remainingRequired <= 0) {
  //       // Skip items not selected or when no more is required
  //       return { ...item, selectedQuantity: 0 };
  //     }
  
  //     const allocatedQuantity = Math.min(item.quantity, remainingRequired);
  //     remainingRequired -= allocatedQuantity;
  
  //     return { ...item, selectedQuantity: allocatedQuantity };
  //   });
  
  //   setSelectedInventory(adjustedInventory);
  
  //   if (remainingRequired > 0) {
  //     alert(
  //       `Not enough inventory to fulfill the required amount of ${selectedIngredient.quantity}.`
  //     );
  //   }
  // };

  // const autoAdjustQuantities = () => {
  //   const baseConversionRate = selectedIngredient.ingredients.unit?.conversion_rate_to_grams || 1; // Ingredient base unit conversion rate
  //   let remainingRequired = selectedIngredient.quantity * baseConversionRate; // Convert required quantity to base unit (grams)
  
  //   const adjustedInventory = (selectedInventory || []).map((item) => {
  //     const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1; // Inventory unit conversion rate
  
  //     // Calculate available quantity in base unit
  //     const availableQuantityInBaseUnit = item.quantity * inventoryConversionRate;
  
  //     if (!item.preselected || remainingRequired <= 0) {
  //       // Skip items not selected or when no more is required
  //       return {
  //         ...item,
  //         selectedQuantity: 0,
  //         convertedUnit: item.ingredients.unitInv?.unitInv_tag || "unit not specified", // Keep original unit
  //       };
  //     }
  
  //     // Determine the quantity to allocate
  //     const allocatedQuantityInBaseUnit = Math.min(availableQuantityInBaseUnit, remainingRequired);
  //     const allocatedQuantityInIngredientUnit = allocatedQuantityInBaseUnit / baseConversionRate;
  
  //     // Deduct the allocated amount from the remaining required
  //     remainingRequired -= allocatedQuantityInBaseUnit;
  
  //     return {
  //       ...item,
  //       selectedQuantity: allocatedQuantityInIngredientUnit,
  //       convertedUnit: selectedIngredient.ingredients.unit?.unit_description || "unit not specified", // Update to target unit
  //     };
  //   });
  
  //   setSelectedInventory(adjustedInventory);
  
  //   if (remainingRequired > 0) {
  //     alert(
  //       `Not enough inventory to fulfill the required amount of ${selectedIngredient.quantity} ${selectedIngredient.ingredients.unit?.unit_tag}.`
  //     );
  //   }
  // };

  const autoAdjustQuantities = () => {
    const baseConversionRate = selectedIngredient.ingredients.unit?.conversion_rate_to_grams || 1; // Ingredient base unit conversion rate
    let remainingRequired = selectedIngredient.quantity * baseConversionRate; // Convert required quantity to base unit (grams)
  
    console.log("Base Conversion Rate:", baseConversionRate);
    console.log("Remaining Required (Base Unit):", remainingRequired);
  
    const adjustedInventory = (selectedInventory || []).map((item) => {
      const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1; // Inventory unit conversion rate
  
      // Check if the item is converted
      const isCurrentlyConverted = item.isConverted || false;
  
      console.log("Processing Item:", item.id);
      console.log("Item Quantity:", item.quantity);
      console.log("Inventory Conversion Rate:", inventoryConversionRate);
      console.log("Is Currently Converted:", isCurrentlyConverted);
  
      // Calculate the available quantity in base unit
      const availableQuantityInBaseUnit = isCurrentlyConverted
        ? (item.quantity * baseConversionRate) / inventoryConversionRate // Convert back to base unit
        : item.quantity * inventoryConversionRate; // Keep in base unit
  
      console.log("Available Quantity in Base Unit:", availableQuantityInBaseUnit);
  
      if (!item.preselected || remainingRequired <= 0) {
        // Skip items not selected or when no more is required
        // console.log("Skipping item (not preselected or no remaining required).");
        return {
          ...item,
          selectedQuantity: 0,
          convertedUnit: item.ingredients.unitInv?.unitInv_tag || "unit not specified", // Keep original unit
        };
      }
  
      // Determine the quantity to allocate
      const allocatedQuantityInBaseUnit = Math.min(availableQuantityInBaseUnit, remainingRequired);
  
      // console.log("Allocated Quantity in Base Unit:", allocatedQuantityInBaseUnit);
  
      // Adjust the allocated quantity based on `isCurrentlyConverted`
      const allocatedQuantityInIngredientUnit = isCurrentlyConverted
        ? (allocatedQuantityInBaseUnit * inventoryConversionRate) / baseConversionRate // Convert back to converted unit
        : allocatedQuantityInBaseUnit; // Convert to ingredient unit
  
      // console.log("Allocated Quantity in Ingredient Unit:", allocatedQuantityInIngredientUnit);
  
      // Deduct the allocated amount from the remaining required
      remainingRequired -= allocatedQuantityInBaseUnit;
  
      // console.log("Remaining Required After Allocation:", remainingRequired);
  
      return {
        ...item,
        selectedQuantity: Math.round(allocatedQuantityInIngredientUnit), // Ensure it's a whole number
        convertedUnit: isCurrentlyConverted
          ? item.ingredients.unitInv?.unitInv_tag || "unit not specified" // Display converted unit
          : selectedIngredient.ingredients.unit?.unit_description || "unit not specified", // Display base unit
      };
    });
  
    // console.log("Final Adjusted Inventory:", adjustedInventory);
  
    setSelectedInventory(adjustedInventory);
  
    if (remainingRequired > 0) {
      alert(
        `Not enough inventory to fulfill the required amount of ${selectedIngredient.quantity} ${selectedIngredient.ingredients.unit?.unit_tag}.`
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

  // const autoAllocateExceed = () => {
  //   setSelectedIngredient((prev) => {
  //     const totalRecipes = prev.quantity;
  //     // console.log("Total Recipes:", totalRecipes);
  //     // console.log("prev:", prev);
  //     // const totalRecipes = prev.recipes.length;
  //     const allocationPerRecipe = Math.floor(exceedAmount / totalRecipes);

  //     const updatedRecipes = prev.recipes.map((recipe, index) => {
  //       const remainingExceed =
  //         index === totalRecipes - 1 // Add remaining to the last recipe
  //           ? exceedAmount - allocationPerRecipe * (totalRecipes - 1)
  //           : allocationPerRecipe;

  //       return { ...recipe, exceedAllocation: remainingExceed };
  //     });

  //     return { ...prev, recipes: updatedRecipes };
  //   });
  // };

  const autoAllocateExceed = () => {
    setSelectedIngredient((prev) => {
      if (!prev || !prev.recipes || prev.recipes.length === 0) {
        console.warn("No recipes found to allocate exceed.");
        return prev;
      }
  
      const totalExceed = Math.max(
        0,
        selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0) - prev.quantity
      );
  
      if (totalExceed <= 0) {
        console.log("No exceed to allocate.");
        return prev;
      }
  
      console.log("Total Exceed to Allocate:", totalExceed);
  
      const totalRecipes = prev.recipes.length;
      const evenAllocation = Math.floor(totalExceed / totalRecipes); // Base allocation for each recipe
      let remainingExceed = totalExceed % totalRecipes; // Remainder to distribute
  
      const updatedRecipes = prev.recipes.map((recipe, index) => {
        // Allocate even portion to each recipe
        let allocation = evenAllocation;
  
        // Distribute the remainder one by one to recipes
        if (remainingExceed > 0) {
          allocation += 1;
          remainingExceed -= 1;
        }
  
        return {
          ...recipe,
          exceedAllocation: allocation,
        };
      });
  
      console.log("Updated Recipes with Exceed Allocation:", updatedRecipes);
  
      return {
        ...prev,
        recipes: updatedRecipes,
      };
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

  // const handleAutoDistribute = async () => {
  //   try {
  //     // Iterate through all recipes and their respective ingredients
  //     for (const recipe of recipes) {
  //       const recipeIngredients = ingredients.find((ri) => ri.recipeId === recipe.id)?.ingredients || [];
  
  //       for (const ingredient of recipeIngredients) {
  //         // Simulate handleIngredientClick
  //         const inventory = await fetchUserInventory(ingredient.ingredients.id);
  //         const linkedInventory = (await fetchInventoryMealPlanByMealPlanId(mealPlanIds)).filter(
  //           (item) =>
  //             item.inventory.ingredient_id === ingredient.ingredients.id &&
  //             item.meal_plan?.recipe_id === recipe.id
  //         );
  
  //         let allocatedInventory;
  //         if (linkedInventory.length > 0) {
  //           allocatedInventory = preselectLinkedInventory(linkedInventory, inventory);
  //         } else {
  //           allocatedInventory = allocateInventoryFIFO(ingredient, inventory);
  //         }
  
  //         // Prepare the selected inventory and finalize
  //         const enrichedInventory = allocatedInventory.map((item) => ({
  //           ...item,
  //           selectedQuantity: item.selectedQuantity || 0, // Ensure proper quantity
  //           preselected: true,
  //         }));
  
  //         setSelectedIngredient(ingredient); // Track the current ingredient for updates
  //         setSelectedInventory(enrichedInventory); // Update the selected inventory
  
  //         // Simulate handleFinalizeQuantities for this ingredient
  //         const filteredInventory = enrichedInventory.filter((item) => item.selectedQuantity > 0);
  
  //         if (filteredInventory.length > 0) {
  //           const statusId = await getStatusIdByName("Planning");
  //           const enrichedData = await enrichInventory(
  //             filteredInventory,
  //             ingredient,
  //             planned_date
  //           );
  
  //           const dataToInsert = enrichedData.map((item) => ({
  //             inventory_id: item.id,
  //             meal_plan_id: item.meal_plan_id,
  //             used_quantity: item.selectedQuantity,
  //             status_id: statusId,
  //             created_at: new Date().toISOString(),
  //             ingredient_id: ingredient.ingredients.id,
  //           }));
  
  //           const { error } = await supabase.from("inventory_meal_plan").insert(dataToInsert);
  //           if (error) {
  //             throw error;
  //           }
  //         }
  //       }
  //     }
  
  //     // Refresh the page after all distributions
  //     setRefreshCounter((prev) => prev + 1);
  //     alert("All ingredients have been auto-distributed!");
  //   } catch (error) {
  //     console.error("Error during auto distribution:", error.message);
  //     alert("Failed to auto-distribute inventory. Please try again.");
  //   }
  // };

  const handleAutoDistribute = async () => {
    try {
      const failedDistributions = []; // Track ingredients that fail to distribute
      const completedIngredients = []; // Track ingredients already complete
  
      // Iterate through all recipes and their respective ingredients
      for (const recipe of recipes) {
        const recipeIngredients = ingredients.find((ri) => ri.recipeId === recipe.id)?.ingredients || [];
  
        for (const ingredient of recipeIngredients) {
          // Check if ingredient is already complete
          const linkedInventory = (await fetchInventoryMealPlanByMealPlanId(mealPlanIds)).filter(
            (item) =>
              item.inventory.ingredient_id === ingredient.ingredients.id &&
              item.meal_plan?.recipe_id === recipe.id
          );
  
          const totalAllocated = linkedInventory.reduce((sum, item) => sum + item.used_quantity, 0);
          if (totalAllocated >= ingredient.quantity) {
            completedIngredients.push({
              ingredient: ingredient.ingredients.name,
              totalAllocated,
            });
            continue; // Skip this ingredient as it is already complete
          }
  
          // Simulate handleIngredientClick
          const inventory = await fetchUserInventory(ingredient.ingredients.id);
  
          let allocatedInventory;
          if (linkedInventory.length > 0) {
            allocatedInventory = preselectLinkedInventory(linkedInventory, inventory);
          } else {
            allocatedInventory = allocateInventoryFIFO(ingredient, inventory);
          }
  
          // Prepare the selected inventory and finalize
          const enrichedInventory = allocatedInventory.map((item) => ({
            ...item,
            selectedQuantity: item.selectedQuantity || 0, // Ensure proper quantity
            preselected: true,
          }));
  
          setSelectedIngredient(ingredient); // Track the current ingredient for updates
          setSelectedInventory(enrichedInventory); // Update the selected inventory
  
          // Simulate handleFinalizeQuantities for this ingredient
          const filteredInventory = enrichedInventory.filter((item) => item.selectedQuantity > 0);
  
          if (filteredInventory.length > 0) {
            const statusId = await getStatusIdByName("Planning");
            const enrichedData = await enrichInventory(filteredInventory, ingredient, planned_date);
  
            const dataToInsert = enrichedData.map((item) => ({
              inventory_id: item.id,
              meal_plan_id: item.meal_plan_id,
              used_quantity: item.selectedQuantity,
              status_id: statusId,
              created_at: new Date().toISOString(),
              ingredient_id: ingredient.ingredients.id,
            }));
  
            const { error } = await supabase.from("inventory_meal_plan").insert(dataToInsert);
            if (error) {
              throw error;
            }
  
            // Check if fully distributed
            const totalDistributed = filteredInventory.reduce((sum, item) => sum + item.selectedQuantity, 0);
            if (totalDistributed < ingredient.quantity) {
              failedDistributions.push({
                ingredient: ingredient.ingredients.name,
                required: ingredient.quantity,
                distributed: totalDistributed,
              });
            }
          } else {
            // Log failure for zero distributed inventory
            failedDistributions.push({
              ingredient: ingredient.ingredients.name,
              required: ingredient.quantity,
              distributed: 0,
            });
          }
        }
      }
  
      // Refresh the page after all distributions
      setRefreshCounter((prev) => prev + 1);
  
      // Notify the user of the results
      alert(`Auto-distribution complete!`);
  
      if (completedIngredients.length > 0) {
        console.log("Ingredients already completed:", completedIngredients);
        alert(`The following ingredients were already complete and skipped:\n${completedIngredients.map(i => `${i.ingredient} (Allocated: ${i.totalAllocated})`).join('\n')}`);
      }
  
      if (failedDistributions.length > 0) {
        console.warn("Failed to distribute for some ingredients:", failedDistributions);
        alert(
          `The following ingredients could not be fully distributed due to insufficient inventory:\n${failedDistributions.map(i => `${i.ingredient} (Required: ${i.required}, Distributed: ${i.distributed})`).join('\n')}`
        );
      }
  
    } catch (error) {
      console.error("Error during auto-distribution:", error.message);
      alert("Failed to auto-distribute inventory. Please try again.");
    }
  };

  
  const handleDeleteAll = async () => {
    try {
      // Ensure we have meal plans to process
      if (!mealPlanIds || mealPlanIds.length === 0) {
        alert("No meal plans found to delete inventory allocations.");
        return;
      }
  
      // Confirm deletion with the user
      const confirmDelete = window.confirm(
        "Are you sure you want to delete all inventory allocations for this meal plan? This action cannot be undone."
      );
      if (!confirmDelete) return;
  
      // Delete all linked inventory for the current meal plan
      const { data, error } = await supabase
        .from("inventory_meal_plan")
        .delete()
        .in("meal_plan_id", mealPlanIds); // Match all meal plan IDs in the list
  
      if (error) {
        throw error;
      }
  
      console.log("Deleted inventory allocations:", data);
  
      // Optionally, refresh the data or update the UI
      setLinkedInventory([]); // Clear linked inventory state
      setRefreshCounter((prev) => prev + 1); // Trigger a refresh
      alert("All inventory allocations have been deleted successfully.");
    } catch (err) {
      console.error("Error deleting all inventory allocations:", err.message);
      alert("Failed to delete all inventory allocations. Please try again.");
    }
  };
  
  const toggleCookingMode = () => {
      if (!isCookingMode) {
          // Prompt user if they want to continue from the last step
          if (previousStepIndex !== null) {
              const continueFromLast = window.confirm(
                  "Would you like to continue from your last step or start over?"
              );
              if (continueFromLast) {
                  setCurrentStepIndex(previousStepIndex);
              } else {
                  setCurrentStepIndex(0);
              }
          } else {
              setCurrentStepIndex(0);
          }
      } else {
          setPreviousStepIndex(currentStepIndex); // Save the current step when exiting
      }
      setIsCookingMode((prev) => !prev);
  };

  const handleNextStep = () => {
      if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
      }
  };

  const handlePreviousStep = () => {
      if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
      }
  };

  // const finishCooking = async () => {
  //     try {
  //         // Update `status_id` to 2 (Complete) in the database
  //         const { data, error } = await supabase
  //             .from("inventory_meal_plan")
  //             .update({ status_id: 2, updated_at: new Date().toISOString() })
  //             .in("meal_plan_id", mealPlanIds); // Match your conditions here

  //         if (error) {
  //             throw error;
  //         }

  //         alert("Cooking finished and status updated successfully!");
  //         setIsCookingMode(false); // Exit cooking mode
  //         setCurrentStepIndex(0); // Reset steps
  //         setPreviousStepIndex(null); // Clear saved step
  //         setRefreshCounter((prev) => prev + 1); // Refresh data
  //     } catch (err) {
  //         console.error("Error finishing cooking:", err.message);
  //         alert("Failed to finish cooking. Please try again.");
  //     }
  // };

  const finishCooking = async () => {
    try {
        // Update `status_id` in `inventory_meal_plan` table to 2 (Complete)
        const { data: mealPlanData, error: mealPlanError } = await supabase
            .from("inventory_meal_plan")
            .update({ status_id: 2, updated_at: new Date().toISOString() })
            .in("meal_plan_id", mealPlanIds);

        if (mealPlanError) {
            throw mealPlanError;
        }

        console.log("Updated inventory_meal_plan:", mealPlanData);

        // Fetch all inventory rows affected
        const { data: affectedRows, error: fetchError } = await supabase
            .from("inventory_meal_plan")
            .select("inventory_id, used_quantity")
            .in("meal_plan_id", mealPlanIds);

        if (fetchError) {
            throw fetchError;
        }

        console.log("Affected Rows in inventory_meal_plan:", affectedRows);

        // Update the `quantity` in the inventory table for each affected row
        const updatePromises = affectedRows.map(async (row) => {
            const { data: inventoryData, error: inventoryError } = await supabase
                .from("inventory")
                .select("quantity")
                .eq("id", row.inventory_id)
                .single();

            if (inventoryError) {
                throw inventoryError;
            }

            const updatedQuantity = Math.max(0, inventoryData.quantity - row.used_quantity);

            const { error: updateError } = await supabase
                .from("inventory")
                .update({ quantity: updatedQuantity, updated_at: new Date().toISOString() })
                .eq("id", row.inventory_id);

            if (updateError) {
                throw updateError;
            }

            console.log(`Updated inventory for ID ${row.inventory_id} to quantity ${updatedQuantity}`);
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);

        alert("Cooking finished, quantities updated, and status set to complete!");
        setIsCookingMode(false); // Exit cooking mode
        setCurrentStepIndex(0); // Reset steps
        setPreviousStepIndex(null); // Clear saved step
        setRefreshCounter((prev) => prev + 1); // Refresh data
    } catch (err) {
        console.error("Error finishing cooking:", err.message);
        alert("Failed to finish cooking. Please try again.");
    }
  };


  return (
    <div className="recipe-preparation-page">
      <BackButton onClick={() => navigate(-1)} />
      <h1>Recipe Preparation</h1>
      <h3>Date: {planned_date}</h3>
      <h3>Meal Type: {mealTypes.find((type) => type.id === meal_type_id)?.name || "Unknown"}</h3>

      <button
        onClick={handleAutoDistribute}
        style={{
          padding: "10px 20px",
          background: "purple",
          color: "white",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        Auto Distribute All
      </button>

      <button
        onClick={handleDeleteAll}
        style={{
          padding: "10px 20px",
          background: "red",
          color: "white",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        Delete All
      </button>

      
      {recipes.map((recipe) => {
      const recipeIngredients = ingredients.find((ri) => ri.recipeId === recipe.id)?.ingredients || [];
      return (
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
              {recipeIngredients.map((ingredient, index) => {
                // Map `mealPlanId` to the corresponding ingredient
                const linkedInventory = inventoryData.filter(
                  (item) =>
                    item.inventory.ingredient_id === ingredient.ingredients.id &&
                    mealPlans.some((mealPlan) => mealPlan.id === item.meal_plan_id)
                );

                // // Calculate the total allocated quantity
                // const totalAllocated = linkedInventory.reduce(
                //   (sum, inventory) => sum + inventory.used_quantity,
                //   0
                // );
                // Calculate the total allocated quantity with unit conversion checks
                const totalAllocated = linkedInventory.reduce((sum, inventory) => {
                  const baseConversionRate = ingredient.ingredients.unit?.conversion_rate_to_grams || 1;
                  const inventoryConversionRate =
                    inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;

                  // If units match, no conversion needed
                  if (
                    ingredient.ingredients.unit?.unit_tag === inventory.ingredients.unitInv?.unitInv_tag
                  ) {
                    return sum + inventory.used_quantity;
                  }

                  // If conversion rates match but units differ, add without adjustment
                  if (baseConversionRate === inventoryConversionRate) {
                    return sum + inventory.used_quantity;
                  }

                  // Convert allocated quantity to the ingredient's unit
                  const convertedQuantity =
                    (inventory.used_quantity * inventoryConversionRate) / baseConversionRate;
                  return sum + convertedQuantity;
                }, 0);

                console.log("inventory used_quantity:", linkedInventory);
                console.log("totalAllocated:", totalAllocated);

                // Determine if the status is "Complete"
                const isComplete = totalAllocated >= ingredient.quantity;

                return (
                  <li
                    key={index}
                    // onClick={() => handleIngredientClick(ingredient)}
                    onClick={() => handleIngredientClick(ingredient, recipe.id)}
                    style={{
                      cursor: "pointer",
                      color: "blue",
                      fontWeight: "bold",
                      fontSize: "16px",
                    }}
                  >
                    {/* Display ingredient details */}
                    {ingredient.ingredients.name} - {ingredient.quantity}{" "}
                    {ingredient.ingredients.unit?.unit_tag || ""}

                    {/* Check and display inventory data if exists */}
                    {/* {linkedInventory.length > 0 && ( */}
                    {linkedInventory
                    .filter((inventory) => inventory.meal_plan.recipe_id === recipe.id).length > 0 && (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px",
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                        }}
                      >
                        <h4
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          Linked Inventory Data{" "}
                          <span
                            style={{
                              color: isComplete ? "green" : "red",
                              fontWeight: "bold",
                            }}
                          >
                            ({isComplete ? "Complete" : "Incomplete"})
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent onClick
                              // Delete all linked inventory
                              linkedInventory.forEach((inventory) =>
                                handleDeleteInventory(
                                  inventory.inventory_id,
                                  inventory.meal_plan_id,
                                  inventory.ingredients.id
                                )
                              );
                            }}
                            style={{
                              marginLeft: "20px",
                              padding: "5px 10px",
                              backgroundColor: "red",
                              color: "white",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Delete All
                          </button>
                        </h4>
                        {linkedInventory
                        .filter((inventory) => inventory.meal_plan.recipe_id === recipe.id) 
                        .map((inventory) => (
                          <div
                            key={inventory.id}
                            style={{
                              marginBottom: "10px",
                              padding: "10px",
                              border: "1px solid #ccc",
                              borderRadius: "5px",
                            }}
                          > 
                            {console.log("Inventory:", inventory)}
                            <p>
                              <strong>Original quantity:</strong>{" "}
                              {inventory.ingredients.unit?.unit_tag === inventory.ingredients.unitInv?.unitInv_tag ? (
                                // If the unit tags match, display quantity in a single unit
                                <>
                                  {inventory.inventory.init_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                </>
                              ) : inventory.ingredients.unit?.conversion_rate_to_grams ===
                                inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check ? (
                                // If conversion rates match but units differ, display both units
                                <>
                                  {inventory.inventory.init_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                                  {inventory.inventory.init_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                </>
                              ) : (
                                // If conversion rates and unit tags differ, show adjusted quantities
                                <>
                                  {inventory.inventory.init_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                                  {Math.round(
                                    (inventory.inventory.init_quantity *
                                      (inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1)) /
                                      (inventory.ingredients.unit?.conversion_rate_to_grams || 1)
                                  )}{" "}
                                  {inventory.ingredients.unit?.unit_tag || ""}
                                </>
                              )}
                            </p>
                            <p>
                              <strong>Quantity allocated:</strong>{" "}
                              {inventory.ingredients.unit?.unit_tag === inventory.ingredients.unitInv?.unitInv_tag ? (
                                // If the unit tags match, display allocated quantity in a single unit
                                <>
                                  {inventory.used_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                </>
                              ) : inventory.ingredients.unit?.conversion_rate_to_grams ===
                                inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check ? (
                                // If conversion rates match but units differ, display both units
                                <>
                                  {inventory.used_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                                  {inventory.used_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                </>
                              ) : (
                                // If conversion rates and unit tags differ, show adjusted quantities with a ~ for approximations
                                <>
                                  {/* {inventory.used_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                                  ~{Math.round(
                                    (inventory.used_quantity *
                                      (inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1)) /
                                      (inventory.ingredients.unit?.conversion_rate_to_grams || 1)
                                  )}{" "}
                                  {inventory.ingredients.unit?.unit_tag || ""} */}
                                  {inventory.used_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /{" "}
                                  {
                                    Number.isInteger(
                                      (inventory.used_quantity *
                                        (inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1)) /
                                        (inventory.ingredients.unit?.conversion_rate_to_grams || 1)
                                    )
                                      ? Math.round(
                                          (inventory.used_quantity *
                                            (inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1)) /
                                            (inventory.ingredients.unit?.conversion_rate_to_grams || 1)
                                        )
                                      : `~${Math.round(
                                          (inventory.used_quantity *
                                            (inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1)) /
                                            (inventory.ingredients.unit?.conversion_rate_to_grams || 1)
                                        )}`
                                  }{" "}
                                  {inventory.ingredients.unit?.unit_tag || ""}

                                </>
                              )}
                            </p>
                            <p>
                              <strong>Expiry Date:</strong>{" "}
                              {inventory.inventory.expiry_date.date || "No expiry date"}
                            </p>
                            <p>{inventory.inventory.days_left} days left</p>
                            <p>
                              <strong>Status:</strong>{" "}
                              {inventory.inventory_meal_plan_status.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>




          </div>
        </div>
      );
    })}

      {/* <button
        // onClick={toggleCombineIngredients}
        style={{
          padding: "10px 20px",
          background: isCombined ? "red" : "green",
          color: "white",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        {isCombined ? "Separate Ingredients" : "Combine Ingredients"}
      </button> */}

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
                
                {inventoryItems.length === 0 ? (
                  // Message when no inventory items exist
                  // <p>
                  //   <strong>No {selectedIngredient.ingredients.name} in your inventory.</strong>
                  // </p>
                  // Message and alternative button when no inventory items exist
                  <>
                  <p>
                    <strong>No {selectedIngredient.ingredients.name} in your inventory.</strong>
                  </p>
                  <button
                    onClick={() => {
                      // Navigate or show a modal for missing ingredients
                      // console.log("Navigating to Missing Ingredients for Weekly Plan");
                      navigate(`/recipes/shopping-list`); // Navigate to details page
                      // You can replace this with navigation logic or modal display
                    }}
                    style={{
                      marginTop: "10px",
                      padding: "10px 20px",
                      background: "orange",
                      color: "white",
                      borderRadius: "5px",
                    }}
                  >
                    View Missing Ingredients for This Week's Plan
                  </button>
                </>
                  
                ) : (
                  <>
                    <p>
                      <strong>Your Selection:</strong>{" "}
                      {/* {selectedInventory
                        .filter((item) => item.preselected) // Only count selected items
                        .reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      {selectedIngredient.ingredients.unit?.unit_tag || ""} */}
                      {selectedInventory
                        .filter((item) => item.preselected) // Only count selected items
                        .map((item) => {
                          // Check if the unit conversion rates match
                          const isConversionRateMatching =
                            item.ingredients.unit?.conversion_rate_to_grams ===
                            item.ingredients.unitInv?.conversion_rate_to_grams_for_check;

                          // Adjust quantity if conversion rates do not match
                          const adjustedQuantity = isConversionRateMatching
                            ? item.quantity // If matching, use the normal quantity
                            : item.quantity / (item.ingredients.unit?.conversion_rate_to_grams || 1); // Else, divide by the unit's conversion rate

                          // Format the display string based on conversion status
                          return isConversionRateMatching ? (
                            `${item.quantity} ${item.ingredients.unit?.unit_tag || "unit not specified"}`
                          ) : (
                            `${item.quantity} ${item.ingredients.unitInv?.unitInv_tag || "unit not specified"} (~${Math.round(
                              adjustedQuantity
                            )} ${item.ingredients.unit?.unit_tag || "unit not specified"})`
                          );
                        })
                        .join(", ")} {/* Join the individual item strings with commas */}
                    </p>

                    {/* Inventory selection */}
                    {/* <ul>
                      {console.log("Inventory Items:", inventoryItems)}
                      {inventoryItems.map((item) => (
                        <li
                          key={item.id}
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
                              checked={
                                selectedInventory.find((selected) => selected.id === item.id)?.preselected || false
                              }
                              onChange={() => toggleInventorySelection(item)}
                            />
                            {item.quantity || 0} {item.ingredients.unitInv.unitInv_tag || "unit not specified"} (Expiry:{" "}
                            {item.expiry_date?.date || "No expiry date"})
                          </label>
                        </li>
                      ))}
                    </ul> */}
                    <ul>
                      {console.log("Inventory Items Before Sorting:", inventoryItems)}
                      {console.log("Selected Inventory Before Sorting:", selectedInventory)}
                      {inventoryItems
                        .sort((a, b) => {
                          // Parse dates for comparison
                          const dateA = new Date(a.expiry_date?.date || "9999-12-31");
                          const dateB = new Date(b.expiry_date?.date || "9999-12-31");

                          // Compare expiry dates first
                          if (dateA - dateB !== 0) {
                            return dateA - dateB; // Sort by date
                          }

                          // If dates are the same, compare quantities
                          return a.quantity - b.quantity;
                        })
                        .map((item) => {
                          // Calculate adjusted quantity if the conversion rates don't match
                          const adjustedQuantity =
                            item.ingredients.unit?.conversion_rate_to_grams && item.ingredients.unitInv?.conversion_rate_to_grams_for_check
                              ? item.quantity / item.ingredients.unit.conversion_rate_to_grams
                              : 0;

                          // Check if the conversion rates match
                          const isConversionRateMatching =
                            item.ingredients.unit?.conversion_rate_to_grams === item.ingredients.unitInv?.conversion_rate_to_grams_for_check;

                          // Check if unitInv_tag is the same as unit_tag
                          const isUnitTagMatching = item.ingredients.unitInv?.unitInv_tag === item.ingredients.unit?.unit_tag;

                          return (
                          //   <li
                          //     key={item.id}
                          //     style={{
                          //       backgroundColor: selectedInventory.find((selected) => selected.id === item.id)?.preselected
                          //         ? "lightgreen"
                          //         : "white",
                          //       padding: "5px",
                          //       borderRadius: "5px",
                          //     }}
                          //   >
                          <li
                            key={item.id}
                            style={{
                              // backgroundColor: selectedInventory.find((selected) => selected.id === item.id)?.preselected
                              //   ? "lightgreen"
                              //   : item.predisqualified
                              //   ? "red" // Red background for predisqualified items
                              //   : "white", // Default background
                              backgroundColor: (() => {
                                const selectedItem = selectedInventory.find((selected) => selected.id === item.id);
                                if (selectedItem?.preselected) {
                                  return "lightgreen"; // Highlight preselected items in green
                                }
                                if (selectedItem?.predisqualified) {
                                  return "red"; // Highlight predisqualified items in red
                                }
                                return "white"; // Default background for others
                              })(),
                              color: item.predisqualified ? "white" : "black", // Ensure text contrast
                              padding: "5px",
                              borderRadius: "5px",
                              position: "relative", // Enable positioning for the tag
                            }}
                          >
                              <label>
                                <input
                                  type="checkbox"
                                  checked={selectedInventory.find((selected) => selected.id === item.id)?.preselected || false}
                                  onChange={() => toggleInventorySelection(item)}
                                  // disabled={item.predisqualified} 
                                  disabled={
                                    selectedInventory.find((selected) => selected.id === item.id)?.predisqualified || false
                                  }
                                />
                                {selectedInventory.find((selected) => selected.id === item.id)?.predisqualified && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      top: "5px",
                                      right: "5px",
                                      backgroundColor: "darkred",
                                      color: "white",
                                      padding: "2px 6px",
                                      borderRadius: "3px",
                                      fontSize: "12px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Not Enough for 1 Unit
                                    {/* {console.log("Predisqualified Item:", item)} */}
                                  </span>
                                )}

                                {isUnitTagMatching ? (
                                  // If unitInv_tag matches unit_tag, show one unit
                                  <>
                                    {item.quantity || 0} {item.ingredients.unit?.unit_description || "unit not specified"}
                                  </>
                                ) : isConversionRateMatching ? (
                                  // Display quantity and units if conversion rates match
                                  <>
                                    {item.quantity || 0} {item.ingredients.unitInv?.unitInv_tag || "unit not specified"} /
                                    {item.ingredients.unit?.unit_description || "unit not specified"}
                                  </>
                                ) : (
                                  // Display adjusted quantity if conversion rates don't match
                                  <>
                                    {item.quantity || 0} {item.ingredients.unitInv?.unitInv_tag || "unit not specified"} /
                                    {Math.round(adjustedQuantity)} {item.ingredients.unit?.unit_description || "unit not specified"}
                                  </>
                                )}
                                (Expiry: {item.expiry_date?.date || "No expiry date"})
                              </label>
                            </li>
                          );
                        })}
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
                )}

                {/* <div style={{ margin: "10px 0" }}>
                  <label style={{ display: "block", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={capped}
                      onChange={() => setCapped(!capped)}
                    />
                    Cap total to match required quantity
                  </label>
                </div> */}

                {/* <button
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
                </button> */}
                <button
                  onClick={() => setSelectedIngredient(null)} // Close modal on cancel
                  style={{
                    marginTop: "10px",
                    marginLeft: "10px",
                    padding: "10px 20px",
                    background: "red",
                    color: "white",
                    borderRadius: "5px",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3>Adjust Quantities for: {selectedIngredient.ingredients.name}</h3>
                <p>
                  <strong>Required:</strong> {selectedIngredient.quantity}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""}
                </p>
                {/* {console.log("Selected Inventory before filtering:", selectedInventory)} */}
                <p>
                  <strong>Your Adjusted Total:</strong>{" "}

                  {/* {selectedInventory.reduce((sum, item) => sum + item.selectedQuantity, 0)}{" "} */}
                  {/* {selectedInventory
                    .filter((item) => item.preselected) // Only include preselected items
                    .reduce((sum, item) => sum + item.selectedQuantity, 0)}{" "}
                  {selectedIngredient.ingredients.unit?.unit_tag || ""} */}

                  {selectedInventory
                    .filter((item) => item.preselected) // Only include preselected items
                    .map((item) => {
                      // Check if the item is currently converted
                      const isConverted = item.isConverted || false;

                      // Check if the unit conversion rates match
                      const isConversionRateMatching =
                        item.ingredients.unit?.conversion_rate_to_grams ===
                        item.ingredients.unitInv?.conversion_rate_to_grams_for_check;

                      // console.log("Conversion Rate Matching:", isConversionRateMatching);

                      // console.log("Conversion Rate Matching for Item ID", item.id, ":", isConversionRateMatching);
                      
                      // Adjust quantity if conversion rates do not match
                      const adjustedQuantity = isConversionRateMatching
                        ? item.selectedQuantity // If matching, use the normal quantity
                        : item.selectedQuantity / (item.ingredients.unit?.conversion_rate_to_grams || 1); // Else, divide by the unit's conversion rate

                      // Determine whether to display ~ based on whether the adjusted quantity is a whole number
                      const displayAdjustedQuantity = Number.isInteger(adjustedQuantity)
                        ? adjustedQuantity // Display as an integer if it's a whole number
                        : `~${Math.round(adjustedQuantity)}`; // Display with ~ if not a whole number

                      const displayConvertedQuantity = item.selectedQuantity * item.ingredients.unit?.conversion_rate_to_grams;

                      // // Format the display string based on conversion status
                      // return isConversionRateMatching ? (
                      //   `${item.selectedQuantity} ${item.ingredients.unit?.unit_tag || "unit not specified"}`
                      // ) : (
                      //   // `${item.selectedQuantity} ${item.ingredients.unitInv?.unitInv_tag || "unit not specified"} (${displayAdjustedQuantity} ${item.ingredients.unit?.unit_tag || "unit not specified"})`
                      //   `${displayAdjustedQuantity} ${item.ingredients.unit?.unit_tag || "unit not specified"} 
                      //   (${item.selectedQuantity} ${item.ingredients.unitInv?.unitInv_tag || "unit not specified"})`
                      // );
                      // Handle display logic based on isConverted
                      if (isConverted) {
                        // Display when converted
                        return `${item.selectedQuantity} ${item.ingredients.unit?.unit_tag || "unit not specified"} 
                                (${displayConvertedQuantity} ${item.ingredients.unitInv?.unitInv_tag || "unit not specified"})`;
                      } else {
                        // Display normal logic when not converted
                        return isConversionRateMatching
                          ? `${item.selectedQuantity} ${item.ingredients.unit?.unit_tag || "unit not specified"}`
                          : `${displayAdjustedQuantity} ${item.ingredients.unit?.unit_tag || "unit not specified"} 
                            (${item.selectedQuantity} ${item.ingredients.unitInv?.unitInv_tag || "unit not specified"})`;
                      }
                    })
                    .join(", ")}{" "}
                  {/* {selectedIngredient.ingredients.unit?.unit_tag || ""} */}


                </p>

                {/* <div>
                  <label style={{ display: "block", margin: "10px 0" }}>
                    <input
                      type="checkbox"
                      checked={capped}
                      onChange={handleToggleCapped}
                    />
                    Cap total to match required quantity
                  </label>
                </div> */}

                {!isUpdateMode && (
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
                )}

                <ul>
                {/* {console.log("Selected Inventory before filtering:", selectedInventory)} */}
                  {/* {console.log(
                    "Filtered Inventory (only preselected items):",
                    selectedInventory.filter((item) => item.preselected)
                  )} */}
                  {/* {selectedInventory

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
                          (selectedInventory.filter((item) => item.preselected).length === 1 && item.selectedQuantity >= selectedIngredient.quantity) || // Check if only one preselected item
                          // (selectedInventory.filter((item) => item.preselected).length === 1 && item.selectedQuantity >= item.quantity) || // Check if only one preselected item
                          item.selectedQuantity >= item.quantity // Check if maximum quantity reached
                        }
                        style={{ margin: "0 5px", backgroundColor: "blue", color: "white" }}
                      >
                        +
                      </button>
                    </li>
                  ))} */}
                  {/* {console.log("Selected Inventory before filtering:", selectedInventory)} */}
                  {/* {selectedInventory
                    .filter((item) => item.preselected) // Only show preselected items
                    .map((item) => {
                      // Get conversion rates
                      const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1; // Base unit conversion rate
                      const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1; // Inventory unit conversion rate
                  
                      // Convert quantity to the desired unit
                      const convertedQuantity =
                        baseConversionRate !== inventoryConversionRate
                          ? (item.quantity * inventoryConversionRate) / baseConversionRate // Perform unit conversion
                          : item.quantity; // Use original quantity if conversion rates match
                  
                      // Display the correct unit description
                      const displayUnit = item.ingredients.unit?.unit_description || "unit not specified";

                      const adjustedQuantity =
                            item.ingredients.unit?.conversion_rate_to_grams && item.ingredients.unitInv?.conversion_rate_to_grams_for_check
                              ? item.quantity / item.ingredients.unit.conversion_rate_to_grams
                              : 0;

                      // Check if the conversion rates match
                      const isConversionRateMatching = item.ingredients.unit?.conversion_rate_to_grams === item.ingredients.unitInv?.conversion_rate_to_grams_for_check;

                      const isUnitTagMatching = item.ingredients.unitInv?.unitInv_tag === item.ingredients.unit?.unit_tag;
                      return (
                        <li key={item.id}>
                          <label>
                            {isUnitTagMatching ? (
                                  // If unitInv_tag matches unit_tag, show one unit
                                  <>
                                    {item.quantity || 0} {item.ingredients.unit?.unit_description || "unit not specified"}
                                  </>
                                ) : isConversionRateMatching ? (
                                  // Display quantity and units if conversion rates match
                                  <>
                                    {item.quantity || 0} {item.ingredients.unitInv?.unitInv_tag || "unit not specified"} /
                                    {item.ingredients.unit?.unit_description || "unit not specified"}
                                  </>
                                ) : (
                                  // Display adjusted quantity if conversion rates don't match
                                  <>
                                    {item.quantity || 0} {item.ingredients.unitInv?.unitInv_tag || "unit not specified"} /
                                    ~{Math.round(adjustedQuantity)} {item.ingredients.unit?.unit_description || "unit not specified"}
                                    
                                  </>
                                )}
                                (Expiry: {item.expiry_date?.date || "No expiry date"})
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
                              (selectedInventory.filter((item) => item.preselected).length === 1 && item.selectedQuantity >= selectedIngredient.quantity) || // Check if only one preselected item
                              // (selectedInventory.filter((item) => item.preselected).length === 1 && item.selectedQuantity >= item.quantity) || // Check if only one preselected item
                              item.selectedQuantity >= item.quantity // Check if maximum quantity reached
                            }
                            style={{ margin: "0 5px", backgroundColor: "blue", color: "white" }}
                          >
                            +
                          </button>
                        </li>
                      );
                    })} */}

                    {selectedInventory
                      .filter((item) => item.preselected) // Only show preselected items
                      .map((item) => {
                        // Get conversion rates
                        const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1; // Base unit conversion rate
                        const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1; // Inventory unit conversion rate

                        // Convert quantity to the desired unit
                        const convertedQuantity =
                          baseConversionRate !== inventoryConversionRate
                            ? (item.selectedQuantity * inventoryConversionRate) / baseConversionRate // Perform unit conversion
                            : item.selectedQuantity; // Use original quantity if conversion rates match

                        const isUnitTagMatching = item.ingredients.unitInv?.unitInv_tag === item.ingredients.unit?.unit_tag;
                          
                        // Determine the display unit
                        const displayUnit = item.ingredients.unit?.unit_description || "unit not specified";
                        const inventoryUnit = item.ingredients.unitInv?.unitInv_tag || "unit not specified";

                        // Check if the conversion rates match
                        const isConversionRateMatching =
                          baseConversionRate === inventoryConversionRate;

                        const adjustedQuantity = isConversionRateMatching
                          ? item.quantity // If matching, use the normal quantity
                          : item.quantity / (item.ingredients.unit?.conversion_rate_to_grams || 1); // Else, divide by the unit's conversion rate

                        // const adjustedQuantity =
                        //   item.ingredients.unit?.conversion_rate_to_grams &&
                        //   item.ingredients.unitInv?.conversion_rate_to_grams_for_check
                        //     ? item.quantity / item.ingredients.unit.conversion_rate_to_grams
                        //     : 0;

                        // Handle unit conversion logic
                        // const handleConvertUnit = (item) => {
                        //   // Get base and inventory conversion rates
                        //   const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1;
                        //   const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;
                        
                        //   const updatedInventory = selectedInventory.map((inventoryItem) => {
                        //     if (inventoryItem.id === item.id) {
                        //       if (inventoryItem.isConverted) {
                        //         // Multiply back to original value
                        //         const originalQuantity = (inventoryItem.selectedQuantity * baseConversionRate) / inventoryConversionRate;
                        //         return {
                        //           ...inventoryItem,
                        //           selectedQuantity: originalQuantity,
                        //           isConverted: false, // Toggle back to original
                        //         };
                        //       } else {
                        //         // Divide to convert
                        //         const convertedQuantity = (inventoryItem.selectedQuantity * inventoryConversionRate) / baseConversionRate;
                        //         return {
                        //           ...inventoryItem,
                        //           selectedQuantity: convertedQuantity,
                        //           isConverted: true, // Mark as converted
                        //         };
                        //       }
                        //     }
                        //     return inventoryItem;
                        //   });
                        
                        //   // Update state with the modified inventory
                        //   setSelectedInventory(updatedInventory);
                        // };

                        const handleConvertUnit = (itemId) => {
                          setSelectedInventory((prevSelectedInventory) =>
                            prevSelectedInventory.map((item) => {
                              if (item.id === itemId) {
                                const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1;
                                const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;
                        
                                const isCurrentlyConverted = item.isConverted || false;
                                // const isCurrentlyConverted = item.isConverted || false;

                                // const newSelectedQuantity = isCurrentlyConverted
                                //   ? (item.selectedQuantity * baseConversionRate) / inventoryConversionRate // Convert back
                                //   : (item.selectedQuantity * inventoryConversionRate) / baseConversionRate; // Convert
                                
                                  const newSelectedQuantity = isCurrentlyConverted
                                  ? Math.floor((item.selectedQuantity * baseConversionRate) / inventoryConversionRate) // Convert back and round
                                  : Math.floor((item.selectedQuantity * inventoryConversionRate) / baseConversionRate); // Convert and round
                        
                                // console.log("Converted Quantity:", newSelectedQuantity);
                                // console.log("Is Currently Converted:", isCurrentlyConverted);
                                return {
                                  ...item,
                                  selectedQuantity: newSelectedQuantity,
                                  isConverted: !isCurrentlyConverted,
                                };
                              }
                              console.log("Updated Inventory:", selectedInventory);

                              return item;
                            })
                          );
                          
                        };
                        
                        
                        

                        return (
                          <li
                            key={item.id}
                            style={{
                              backgroundColor: selectedInventory.find((selected) => selected.id === item.id)?.preselected
                                ? "lightgreen"
                                : item.predisqualified
                                ? "red" // Highlight predisqualified items in red
                                : "white", // Default background
                              padding: "5px",
                              borderRadius: "5px",
                              position: "relative",
                            }}
                          >
                            <label>
                              {isConversionRateMatching ? (
                                // Display quantity and units if conversion rates match
                                <>
                                  {item.selectedQuantity.toFixed(2)} {displayUnit} (Expiry:{" "}
                                  {item.expiry_date?.date || "No expiry date"})
                                </>
                              ) : (
                                // Display adjusted quantity if conversion rates don't match
                                // <>
                                //   {item.selectedQuantity.toFixed(2)} {inventoryUnit}{" / "}
                                //   {Number.isInteger(convertedQuantity) 
                                //     ? convertedQuantity.toFixed(2) // Show without '~' if it's an integer
                                //     : `~${convertedQuantity.toFixed(2)}`}{" "} 
                                //   {displayUnit} (Expiry: {item.expiry_date?.date || "No expiry date"})
                                // </>

                                <>
                                  {item.quantity} {item.ingredients.unitInv?.unitInv_tag || "unit not specified"} {" / "}
                                  {Number.isInteger(adjustedQuantity) 
                                    ? adjustedQuantity.toFixed(2) // Show without '~' if it's an integer
                                    : `~${Math.round(adjustedQuantity)}`}{" "}
                                  {displayUnit} (Expiry: {item.expiry_date?.date || "No expiry date"})
                                </>
                              )}
                            </label>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginTop: "5px",
                                gap: "10px",
                              }}
                            >
                              {/* Unit Display */}
                              <span
                                style={{
                                  padding: "5px",
                                  backgroundColor: "lightgrey",
                                  borderRadius: "5px",
                                  fontWeight: "bold",
                                }}
                              >
                              </span>
                              {/* - Button */}
                              <button
                                onClick={() => adjustQuantity(item.id, -1)}
                                disabled={item.selectedQuantity <= 1} // Prevent going below 1
                                style={{ backgroundColor: "blue", color: "white", borderRadius: "5px" }}
                              >
                                -
                              </button>
                              {/* Input Field */}
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={item.selectedQuantity.toFixed(2)}
                                onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                                style={{
                                  width: "60px",
                                  textAlign: "center",
                                  border: "1px solid #ccc",
                                  borderRadius: "5px",
                                }}
                              />
                              {/* {isConversionRateMatching ? displayUnit : inventoryUnit} */}
                              <span>
                                {item.isConverted
                                  ? item.ingredients.unit?.unit_description || "unit not specified"
                                  : item.ingredients.unitInv?.unitInv_tag || "unit not specified"}
                              </span>
                              {/* + Button */}
                              <button
                                onClick={() => adjustQuantity(item.id, 1)}
                                // disabled={
                                //   (selectedInventory.filter((item) => item.preselected).length === 1 &&
                                //     item.selectedQuantity >= selectedIngredient.quantity) ||
                                //   item.selectedQuantity >= item.quantity // Check if maximum quantity reached
                                //   // (selectedInventory.filter((item) => item.preselected).length === 1 &&
                                //   //   item.selectedQuantity >= selectedIngredient.quantity) ||
                                //   // item.selectedQuantity >= item.quantity // Check if maximum quantity reached
                                // }
                                  
                                disabled={
                                  item.isConverted
                                    ? // If isConverted is true, check these conditions:
                                      (selectedInventory.filter((item) => item.preselected).length === 1 &&
                                        item.selectedQuantity >= selectedIngredient.quantity) || // Condition 1: Exceeds required amount
                                      item.selectedQuantity >= item.quantity // Condition 2: Exceeds available inventory
                                    : // If isConverted is false, use conversion calculation:
                                      (selectedInventory.filter((item) => item.preselected).length === 1 &&
                                        item.selectedQuantity >=
                                          Math.floor(
                                            (selectedIngredient.quantity *
                                              (item.ingredients.unit?.conversion_rate_to_grams || 1)) /
                                              (item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1)
                                          )) || // Check against converted quantity
                                      item.selectedQuantity >= item.quantity // Check if selected exceeds available inventory
                                }
                                
                                

                                style={{ backgroundColor: "blue", color: "white", borderRadius: "5px" }}
                              >
                                +
                              </button>
                              {/* Convert Button */}
                              {!isConversionRateMatching && (
                                <button
                                  // onClick={handleConvertUnit}
                                  onClick={() => handleConvertUnit(item.id)} 
                                  style={{
                                    backgroundColor: "orange",
                                    color: "white",
                                    borderRadius: "5px",
                                    padding: "5px 10px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  Convert
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}

                </ul>

                <button
                    onClick={() => setSelectedIngredient(null)} // Close modal on cancel
                    style={{
                      marginTop: "10px",
                      marginLeft: "10px",
                      padding: "10px 20px",
                      background: "red",
                      color: "white",
                      borderRadius: "5px",
                    }}
                  >
                    Cancel
                  </button>

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

                {/* <button
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
                </button> */}
                {isUpdateMode ? (
                  <button
                    onClick={handleUpdateQuantities}
                    style={{
                      padding: "10px 20px",
                      background: "blue",
                      color: "white",
                      borderRadius: "5px",
                      marginTop: "20px",
                    }}
                  >
                    Update Quantities
                  </button>
                ) : (
                  <button
                    onClick={handleFinalizeQuantities}
                    style={{
                      padding: "10px 20px",
                      background: "green",
                      color: "white",
                      borderRadius: "5px",
                      marginTop: "20px",
                    }}
                  >
                    Finalize Quantities
                  </button>
                )}

                {/* Exceed Section */}
                {/* {!capped && (
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
                )} */}

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
                onClick={() => {
                  confirmSequence();
                  toggleCookingMode();
                }}
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
      {isCookingMode && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0, 0, 0, 0.8)",
                        color: "#fff",
                        zIndex: 1000,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <h2>Step {currentStepIndex + 1}</h2>
                    <p>{steps[currentStepIndex]?.instruction}</p>

                    <div
                        style={{
                            marginTop: "20px",
                            display: "flex",
                            gap: "10px",
                        }}
                    >
                        <button
                            onClick={handlePreviousStep}
                            style={{
                                padding: "10px 20px",
                                background: "#007bff",
                                color: "#fff",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                visibility: currentStepIndex === 0 ? "hidden" : "visible",
                            }}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextStep}
                            style={{
                                padding: "10px 20px",
                                background: "#007bff",
                                color: "#fff",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                                visibility:
                                    currentStepIndex === steps.length - 1 ? "hidden" : "visible",
                            }}
                        >
                            Next
                        </button>
                        {currentStepIndex === steps.length - 1 && (
                            <button
                                onClick={finishCooking}
                                style={{
                                    padding: "10px 20px",
                                    background: "green",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                }}
                            >
                                Finish Cooking
                            </button>
                        )}
                        <button
                            onClick={toggleCookingMode}
                            style={{
                                padding: "10px 20px",
                                background: "red",
                                color: "#fff",
                                border: "none",
                                borderRadius: "5px",
                                cursor: "pointer",
                            }}
                        >
                            Exit Cooking Mode
                        </button>
                    </div>
                </div>
            )}

    </div>
  );
};

export default RecipePreparationPage;
