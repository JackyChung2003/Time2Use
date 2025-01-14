import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRecipeContext } from "../../../Contexts/RecipeContext";
import BackButton from "../../../../../../components/Button/BackButton";
import supabase from "../../../../../../config/supabaseClient";

import SortableRecipeList from "../../../../../../components/SortableDragAndDrop/Recipes_List/SortableRecipeList";
import "./index.css"; 
import { set } from "date-fns";
import CommonLoader from "../../../../../../components/Loader/CommonLoader";

import InventoryVisualization from "../../../../../../components/InventoryVisualization";

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
    fetchInventoryData,
    fetchPax,
    toggleFavorite,
    favorites
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
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0); // Index of the current recipe
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [previousStepIndex, setPreviousStepIndex] = useState(null);

  
  const [totalWeightInGrams, setTotalWeightInGrams] = useState(0);
  const [nutritionFacts, setNutritionFacts] = useState({
    calories: 0,
    protein: 0,
    carbohydrate: 0,
    fat: 0,
});


const [activeTab, setActiveTab] = useState("ingredients");

  // const [pax, setPax] = useState(1); // Added pax state
  const [pax, setPax] = useState(1); // Default Pax value is 1

  const calculateNutrition = (ingredients) => {
    let totalNutrition = {
        calories: 0,
        protein: 0,
        carbohydrate: 0,
        fat: 0,
    };
    let totalWeightInGrams = 0; // Total weight of all ingredients in grams

    ingredients.forEach((ingredient) => {
        const { nutritional_info, unit } = ingredient.ingredients;
        const { quantity } = ingredient;

        // Parse and sanitize nutritional info
        let { calories, protein, carbohydrate, fat } = nutritional_info;
        protein = typeof protein === "string" ? parseFloat(protein.replace("g", "")) || 0 : protein || 0;
        carbohydrate = typeof carbohydrate === "string" ? parseFloat(carbohydrate.replace("g", "")) || 0 : carbohydrate || 0;
        fat = typeof fat === "string" ? parseFloat(fat.replace("g", "")) || 0 : fat || 0;

        const conversionRate = unit?.conversion_rate_to_grams || 1;
        const quantityInGrams = conversionRate > 0 ? quantity * conversionRate : 0;

        if (quantityInGrams > 0) {
            totalWeightInGrams += quantityInGrams;
            const factor = quantityInGrams / 100;
            totalNutrition.calories += calories * factor;
            totalNutrition.protein += protein * factor;
            totalNutrition.carbohydrate += carbohydrate * factor;
            totalNutrition.fat += fat * factor;
        } else {
            console.warn(`Invalid conversion rate for unit: ${unit?.unit_tag}`);
        }
    });

    setTotalWeightInGrams(totalWeightInGrams);

    // Calculate per 100g values
    const per100gNutrition = totalWeightInGrams
        ? {
              calories: (totalNutrition.calories / (totalWeightInGrams / 100)).toFixed(2),
              protein: (totalNutrition.protein / (totalWeightInGrams / 100)).toFixed(2),
              carbohydrate: (totalNutrition.carbohydrate / (totalWeightInGrams / 100)).toFixed(2),
              fat: (totalNutrition.fat / (totalWeightInGrams / 100)).toFixed(2),
          }
        : { calories: 0, protein: 0, carbohydrate: 0, fat: 0 };

    setNutritionFacts({
        total: {
            calories: totalNutrition.calories.toFixed(2),
            protein: totalNutrition.protein.toFixed(2),
            carbohydrate: totalNutrition.carbohydrate.toFixed(2),
            fat: totalNutrition.fat.toFixed(2),
        },
        per100g: per100gNutrition,
    });
};
  
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
        // const recipeIngredients = await Promise.all(
        //   fetchedRecipes.map(async (recipe) => {
        //     const ingredientsData = await fetchRecipeIngredients(recipe.id);
        //     return { recipeId: recipe.id, ingredients: ingredientsData };
        //   })
        // );
        // Fetch ingredients for recipes and adjust quantities based on pax
        const recipeIngredients = await Promise.all(
          fetchedRecipes.map(async (recipe) => {
            const ingredientsData = await fetchRecipeIngredients(recipe.id);
            // setIngredients(ingredientsData);
            // calculateNutrition(ingredientsData);

            // Adjust ingredient quantities based on pax
            const adjustedIngredients = ingredientsData.map((ingredient) => ({
              ...ingredient,
              quantity: ingredient.quantity * pax,
            }));
  
            return { recipeId: recipe.id, ingredients: adjustedIngredients };
          })
        );
  
        setIngredients(recipeIngredients);
        calculateNutrition(recipeIngredients.flatMap((ri) => ri.ingredients));
        
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
    pax,
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

  // useEffect(() => {
  //   const loadInitialPax = async () => {
  //     if (planned_date && meal_type_id) {
  //       const fetchedPax = await fetchPax(planned_date, meal_type_id);
  //       if (fetchedPax) {
  //         setPax(fetchedPax); // Set the fetched Pax value
  //       }
  //     }
  //   };
  
  //   loadInitialPax();
  // }, [planned_date, meal_type_id, fetchPax]);

  useEffect(() => {
    const loadInitialPax = async () => {
      if (planned_date && meal_type_id) {
        try {
          console.log("Fetching pax value...");
          console.log("Planned Date:", planned_date);
          console.log("Meal Type ID:", meal_type_id);
          // Fetch the pax value using the provided fetchPax function
          const fetchedPax = await fetchPax(planned_date, meal_type_id);
          
          console.log("Fetched Pax:", fetchedPax);
          if (fetchedPax !== undefined && fetchedPax !== null) {
            setPax(fetchedPax); // Set the fetched Pax value
          } else {
            console.warn("No pax value returned. Defaulting to 1.");
            setPax(1); // Fallback to default value
          }
        } catch (error) {
          console.error("Error fetching pax:", error.message);
          setPax(1); // Fallback to default value in case of an error
        }
      }
    };
  
    loadInitialPax();
  }, [planned_date, meal_type_id, fetchPax]);
  

  useEffect(() => {
    const updatedIngredients = ingredients.map((recipeIngredient) => ({
      ...recipeIngredient,
      ingredients: recipeIngredient.ingredients.map((ingredient) => ({
        ...ingredient,
        quantity: ingredient.quantity * pax, // Adjust based on Pax
      })),
    }));
    setIngredients(updatedIngredients);
  }, [pax]);
  

  useEffect(() => {
    const loadStepsForCurrentRecipe = async () => {
        if (recipes.length > 0 && currentRecipeIndex < recipes.length) {
            const currentRecipe = recipes[currentRecipeIndex];

            // Check if steps are already loaded for the current recipe
            if (!currentRecipe?.steps || currentRecipe.steps.length === 0) {
                try {
                    // Fetch steps for the current recipe
                    const recipeSteps = await fetchRecipeSteps(currentRecipe.id);

                    // Update the current recipe's steps in the recipes array
                    setRecipes((prevRecipes) =>
                        prevRecipes.map((recipe, index) =>
                            index === currentRecipeIndex
                                ? { ...recipe, steps: recipeSteps }
                                : recipe
                        )
                    );

                    // Optionally set the current steps state
                    setSteps(recipeSteps);
                } catch (error) {
                    console.error("Failed to load steps for the current recipe:", error);
                }
            } else {
                // Use already loaded steps
                setSteps(currentRecipe.steps);
            }
        }
    };

    loadStepsForCurrentRecipe();
  }, [currentRecipeIndex, recipes, fetchRecipeSteps]);

  const checkAllIngredientsComplete = () => {
    return recipes.every((recipe) => {
      const recipeIngredients =
        ingredients.find((ri) => ri.recipeId === recipe.id)?.ingredients || [];
  
      return recipeIngredients.every((ingredient) => {
        const linkedInventory = inventoryData.filter(
          (item) =>
            item.inventory.ingredient_id === ingredient.ingredients.id &&
            mealPlans.some((mealPlan) => mealPlan.id === item.meal_plan_id)
        );
  
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
  
          // Convert allocated quantity to the ingredient's unit
          const convertedQuantity =
            (inventory.used_quantity * inventoryConversionRate) / baseConversionRate;
          return sum + convertedQuantity;
        }, 0);
  
        return totalAllocated >= ingredient.quantity; // Check if the status is "Complete"
      });
    });
  };
  
  const startCooking = () => {
    if (pax < 1) {
      alert("Please select at least 1 pax.");
      return;
    }

    if (checkAllIngredientsComplete()) {
      setShowModal(true); // Open modal if all ingredients are complete
    } else {
      alert("Some ingredients are incomplete. Please ensure all ingredients are complete before starting."); // Show an alert for incomplete ingredients
    }
  };

  const markAsCooked = async () => {
    try {
      // Update status for meal plans with status_id === 3
      const { error } = await supabase
        .from("meal_plan")
        .update({ status_id: 2, updated_at: new Date().toISOString() })
        .eq("status_id", 3);
  
      if (error) throw error;
  
      alert("Meal plans marked as cooked!");
      setRefreshCounter((prev) => prev + 1); // Refresh data
    } catch (err) {
      console.error("Error marking as cooked:", err.message);
      alert("Failed to mark meal plans as cooked. Please try again.");
    }
  };
  
  const confirmSequence = () => {
    setShowModal(false);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };

  const allocateInventoryFIFO = (ingredient, inventory) => {
    const target = ingredient.quantity; // Target quantity required
    const ingredientConversionRate = ingredient.ingredients.unit?.conversion_rate_to_grams || 1; // Ingredient conversion rate
    const targetInBaseUnit = target * ingredientConversionRate; // Convert target to base unit (grams)
    const minimumQuantity = 5 * ingredientConversionRate; // Minimum quantity in base unit
  
    // Step 1: Sort inventory by expiry date first, then by quantity
    const sortedInventory = [...inventory].sort((a, b) => {
      const dateA = new Date(a.expiry_date?.date || "9999-12-31");
      const dateB = new Date(b.expiry_date?.date || "9999-12-31");
      if (dateA - dateB !== 0) {
        return dateA - dateB; // Sort by expiry date first
      }
      return a.quantity - b.quantity; // Then by quantity
    });
  
    // Step 2: Find the optimal combination of items
    let remainingRequired = targetInBaseUnit; // Remaining required quantity in base unit
    const selectedItems = [];
    const disqualifiedItems = [];
  
    for (let i = 0; i < sortedInventory.length; i++) {
      const item = sortedInventory[i];
      const itemConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1; // Inventory item conversion rate
      const itemQuantityInBaseUnit = item.quantity * itemConversionRate; // Convert item quantity to base unit (grams)
  
      // Check if the item meets the minimum quantity requirement
      if (itemQuantityInBaseUnit < minimumQuantity) {
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
  
      // If the requirement is satisfied, stop
      if (remainingRequired <= 0) {
        break;
      }
    }
  
    // Step 3: Combine selected, disqualified, and unselected items
    const finalInventory = sortedInventory.map((item) => {
      const selectedItem = selectedItems.find((selected) => selected.id === item.id);
      const disqualifiedItem = disqualifiedItems.find((disqualified) => disqualified.id === item.id);
      return selectedItem || disqualifiedItem || { ...item, preselected: false, predisqualified: false, selectedQuantity: 0, adjustedQuantity: 0 };
    });
  
  
    return finalInventory;
  };
  

  const preselectLinkedInventory = (linkedInventory, fullInventory) => {
    // Get IDs of the linked inventory items
    const linkedIds = linkedInventory.map((item) => item.inventory_id);
  
    // Map full inventory to match the linked IDs, deselecting others
    const updatedInventory = fullInventory.map((item) => {
    const linkedItem = linkedInventory.find((linked) => linked.inventory_id === item.id);

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
  
    return updatedInventory;
  };
  
  const handleIngredientClick = async (ingredient, recipeId) => {
    try {
      setSelectedIngredient(ingredient); // Set selected ingredient first
      setInventoryItems([]); // Reset inventory items
      setSelectedInventory([]); // Reset selected inventory
      setAdjustingQuantity(false); // Reset adjusting state

      const inventory = await fetchUserInventory(ingredient.ingredients.id);

      if (inventory.length === 0) {
        console.warn("No inventory available for this ingredient.");
        setAdjustingQuantity(false); // Stop adjusting if inventory is empty
        return; // Exit the function early
      }

      const inventoryMealPlanData = await fetchInventoryMealPlanByMealPlanId(mealPlanIds);

      // Filter inventory meal plan data for the current ingredient
      const linkedInventory = inventoryMealPlanData.filter(
        (item) =>
          item.inventory.ingredient_id === ingredient.ingredients.id &&
          item.meal_plan?.recipe_id === recipeId
      );

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
      }
      return [
        ...prevSelected,
       {
          ...item,
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

    // Validation for capped and uncapped
    if ((currentlySelected.length === 0) || (totalSelectedQuantity < selectedIngredient.quantity)) {
      alert(
        `You must select at least ${ "one item"} to proceed. Now you have selected ${totalSelectedQuantity} ${selectedIngredient.ingredients.unit?.unit_tag || ""}.`
  
      );
      return;
    }
  
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
        const excess = totalSelected - target;
        return redistributeExcessToMaintainTarget(updatedInventory, itemId, excess);
      }
      // Return updated inventory for both capped and uncapped modes
      return updatedInventory;
    });
  };  

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

          // Validate input against the maximum allowable quantity and target
          if (parsedQuantity > maxAllowedQuantity || parsedQuantity > target) {
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
  
  if (loading) {
    return <CommonLoader />;
  }

  if (recipes.length === 0) {
    return <div>No recipes found for this meal plan.</div>;
  }

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
        return {
          ...item,
          selectedQuantity: 0,
          convertedUnit: item.ingredients.unitInv?.unitInv_tag || "unit not specified", // Keep original unit
        };
      }

      // Determine the quantity to allocate
      const allocatedQuantityInBaseUnit = Math.min(availableQuantityInBaseUnit, remainingRequired);
  
      // Adjust the allocated quantity based on `isCurrentlyConverted`
      const allocatedQuantityInIngredientUnit = isCurrentlyConverted
        ? (allocatedQuantityInBaseUnit * inventoryConversionRate) / baseConversionRate // Convert back to converted unit
        : allocatedQuantityInBaseUnit; // Convert to ingredient unit
  
  
      // Deduct the allocated amount from the remaining required
      remainingRequired -= allocatedQuantityInBaseUnit;
  
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
        // Prompt user if they want to continue from the last step or start over
        if (previousStepIndex !== null || currentRecipeIndex > 0) {
            const continueFromLast = window.confirm(
                "Would you like to continue from your last step(Yes) or start over(No)?"
            );

            if (continueFromLast) {
                // Continue from the last saved recipe and step
                setCurrentStepIndex(previousStepIndex || 0);
            } else {
                // Start over from the first recipe and first step
                setCurrentRecipeIndex(0);
                setCurrentStepIndex(0);
            }
        } else {
            // No previous steps, start from the beginning
            setCurrentRecipeIndex(0);
            setCurrentStepIndex(0);
        }
    } else {
        // Save the current recipe and step indices when exiting cooking mode
        setPreviousStepIndex(currentStepIndex);
    }

    // Toggle the cooking mode state
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

         // Update `status_id` in `meal_plan` table to 2 (Complete)
        const { error: mealPlanUpdateError } = await supabase
          .from("meal_plan")
          .update({ status_id: 2, updated_at: new Date().toISOString() })
          .in("id", mealPlanIds);

        if (mealPlanUpdateError) {
            throw mealPlanUpdateError;
        }

        console.log("Updated meal_plan status to Complete");

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

  const handlePaxChange = (delta) => {
    setPax((prevPax) => {
      const newPax = Math.max(1, prevPax + delta); // Ensure Pax is at least 1
      mealPlans.forEach((mealPlan) => {
        updatePaxInSupabase(mealPlan.id, newPax); // Update Pax in Supabase for each meal plan
      });
      return newPax;
    });
  
    // Recalculate ingredient quantities based on the new Pax value
    const updatedIngredients = ingredients.map((recipeIngredient) => ({
      ...recipeIngredient,
      ingredients: recipeIngredient.ingredients.map((ingredient) => ({
        ...ingredient,
        quantity: ingredient.quantity * (pax + delta), // Multiply by the new Pax value
      })),
    }));
    setIngredients(updatedIngredients);
  };

  const updatePaxInSupabase = async (mealPlanId, newPax) => {
    try {
      console.log("Updating Pax for meal plan ID:", mealPlanId);
      console.log("New Pax Value:", newPax);
      const { error } = await supabase
        .from("meal_plan")
        .update({ serving_packs: newPax, updated_at: new Date().toISOString() })
        .eq("id", mealPlanId);
  
      if (error) throw error;
  
      console.log(`Pax updated to ${newPax} for meal plan ID ${mealPlanId}`);
    } catch (err) {
      console.error("Error updating pax:", err.message);
      alert("Failed to update Pax. Please try again.");
    }
  };

//   const calculateNutrition = (ingredients) => {
//     let totalNutrition = {
//         calories: 0,
//         protein: 0,
//         carbohydrate: 0,
//         fat: 0,
//     };
//     let totalWeightInGrams = 0; // Total weight of all ingredients in grams

//     ingredients.forEach((ingredient) => {
//         const { nutritional_info, unit } = ingredient.ingredients;
//         // const { nutritional_info, quantity, unit } = ingredient.ingredients;
//         const { quantity } = ingredient;
        
//         console.log("nutritional_info:", nutritional_info);
//         console.log("quantity:", quantity);
//         console.log("unit:", unit);

//         let { calories, protein, carbohydrate, fat } = nutritional_info;
//         console.log("calories:", calories);
//         console.log("protein (raw):", protein);
//         console.log("carbohydrate (raw):", carbohydrate);
//         console.log("fat (raw):", fat);

//         // Strip "g" and convert to number for protein, carbohydrate, and fat
//         protein = typeof protein === "string" ? parseFloat(protein.replace("g", "")) || 0 : protein || 0;
//         carbohydrate = typeof carbohydrate === "string" ? parseFloat(carbohydrate.replace("g", "")) || 0 : carbohydrate || 0;
//         fat = typeof fat === "string" ? parseFloat(fat.replace("g", "")) || 0 : fat || 0;


//         console.log("protein (parsed):", protein);
//         console.log("carbohydrate (parsed):", carbohydrate);
//         console.log("fat (parsed):", fat);

//         const conversionRate = unit.conversion_rate_to_grams;
//         console.log("conversionRate:", conversionRate);

//         // Handle unit conversion to grams (example for common units)
//         let quantityInGrams = quantity;
//         if (conversionRate && conversionRate > 0) {
//             quantityInGrams *= conversionRate;
//         } else {
//             console.warn(`Unit ${unit.unit_tag} does not have a valid conversion rate.`);
//             return; // Skip this ingredient if no valid conversion rate
//         }

//         // Update the total weight
//         totalWeightInGrams += quantityInGrams;

//         // Nutritional info is per 100 grams; calculate based on quantity
//         const factor = quantityInGrams / 100;
//         totalNutrition.calories += calories * factor;
//         totalNutrition.protein += protein * factor;
//         totalNutrition.carbohydrate += carbohydrate * factor;
//         totalNutrition.fat += fat * factor;
//     });

//     setTotalWeightInGrams(totalWeightInGrams);

//     // Calculate per 100g nutrition values
//     const per100gNutrition = {
//         calories: (totalNutrition.calories / (totalWeightInGrams / 100)).toFixed(2),
//         protein: (totalNutrition.protein / (totalWeightInGrams / 100)).toFixed(2),
//         carbohydrate: (totalNutrition.carbohydrate / (totalWeightInGrams / 100)).toFixed(2),
//         fat: (totalNutrition.fat / (totalWeightInGrams / 100)).toFixed(2),
//     };

//     console.log(`Total Weight of Recipe: ${totalWeightInGrams.toFixed(2)}g`);
//     console.log("Total Nutrition:", totalNutrition);
//     console.log("Per 100g Nutrition:", per100gNutrition);

//     // Update state with both total and per 100g nutrition facts
//     setNutritionFacts({
//         total: {
//             calories: totalNutrition.calories.toFixed(2),
//             protein: totalNutrition.protein.toFixed(2),
//             carbohydrate: totalNutrition.carbohydrate.toFixed(2),
//             fat: totalNutrition.fat.toFixed(2),
//         },
//         per100g: per100gNutrition,
//     });
// };
  

  return (
    <div className="recipe-preparation-page">
      {/* <BackButton onClick={() => navigate(-1)} />
      <h1>Recipe Preparation</h1>
      <h3>Date: {planned_date}</h3>
      <h3>Meal Type: {mealTypes.find((type) => type.id === meal_type_id)?.name || "Unknown"}</h3>
      <h3>
        {console.log("mealPlans:", mealPlans)}
        Status:{" "}
        {mealPlans.every((mealPlan) => mealPlan.meal_plan_status.id === 2)
          ? "Complete"
          : mealPlans.some((mealPlan) => mealPlan.meal_plan_status.id === 3)
          ? "Deadline Passed"
          : "Planning"}
      </h3> */}

      {recipes.map((recipe) => {
      const recipeIngredients = ingredients.find((ri) => ri.recipeId === recipe.id)?.ingredients || [];
      return (
        <div key={recipe.id} className="recipe-details">
          <section className="recipe-image-detail-section">
                <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                    alt={recipe.name}
                    className="recipe-detail-image"
                />
                <div className="image-overlay">
                    <BackButton />
                    {/* <h1 className="recipe-title">{recipe.name}</h1> */}
                    <div className="meal-plan-status-container">
                      <span
                        className={`meal-plan-status ${
                          mealPlans.every((mealPlan) => mealPlan.meal_plan_status.id === 2)
                            ? "complete"
                            : mealPlans.some(
                                (mealPlan) => mealPlan.meal_plan_status.id === 3
                              )
                            ? "deadline-passed"
                            : "planning"
                        }`}
                      >
                        {mealPlans.every((mealPlan) => mealPlan.meal_plan_status.id === 2)
                          ? "Complete"
                          : mealPlans.some((mealPlan) => mealPlan.meal_plan_status.id === 3)
                          ? "Deadline Passed"
                          : "Planning"}
                      </span>
                    </div>
                    <div className="action-buttons">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(recipe.id);
                            }}
                            className="favorite-button"
                        >
                            {favorites.includes(recipe.id) ? "❤️" : "🤍"}
                        </button>
                    </div>
                </div>
            </section>
            <section className="recipe-details">
                <h2 className="recipe-detail-title">{recipe.name}</h2>
                <p className="recipe-description">{recipe.description}</p>
                <div className="left-right-space-evenly-section">
                    <p className="prep-time">Prep Time: {recipe.prep_time} mins</p>
                    <p className="cook-time">Cook Time: {recipe.cook_time} mins</p>
                </div>


                <div className="total-meal-weight">
                    <p><strong>Total Meal Weight: </strong>{(totalWeightInGrams * (pax / 1)).toFixed(2)} g</p>
                </div>
            </section>
            <section className="nutrition-facts">
                <h3>Nutrition Facts</h3>
                <div className="nutrition-content">
                    <div className="total-nutrition">
                        <h4>Total Nutrition</h4>
                        <ul>
                            <li>Calories: {nutritionFacts.total?.calories || 0} kcal</li>
                            <li>Protein: {nutritionFacts.total?.protein || 0} g</li>
                            <li>Carbohydrate: {nutritionFacts.total?.carbohydrate || 0} g</li>
                            <li>Fats: {nutritionFacts.total?.fat || 0} g</li>
                        </ul>
                    </div>
                    <div className="per-100g-nutrition">
                        <h4>Per 100g</h4>
                        <ul>
                            <li>Calories: {nutritionFacts.per100g?.calories || 0} kcal</li>
                            <li>Protein: {nutritionFacts.per100g?.protein || 0} g</li>
                            <li>Carbohydrate: {nutritionFacts.per100g?.carbohydrate || 0} g</li>
                            <li>Fats: {nutritionFacts.per100g?.fat || 0} g</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Toggle Buttons */}
            <div className="radio-inputs">
                <label className="radio">
                <input
                    type="radio"
                    name="toggle"
                    checked={activeTab === "ingredients"}
                    onChange={() => setActiveTab("ingredients")}
                />
                <span className="name">Ingredients</span>
                </label>
                <label className="radio">
                <input
                    type="radio"
                    name="toggle"
                    checked={activeTab === "steps"}
                    onChange={() => setActiveTab("steps")}
                />
                <span className="name">Steps</span>
                </label>
            </div>

            {/* Conditional Rendering */}
            {activeTab === "ingredients" && (
                <section className="ingredients-section">
                  <h3>Ingredients</h3>
                  
                  <section className="serving-adjuster">
                      <h4>Serving Packs</h4>
                      <button 
                        onClick={() => handlePaxChange(-1)}
                        className="adjust-serving-button"
                      >-
                      </button>
                      <span className="serving-count">{pax}</span>
                      <button 
                        onClick={() => handlePaxChange(1)}
                        className="adjust-serving-button"
                      >+
                      </button>
                  </section>
                  
                  <section className="ingredients-section">
                    <h3>Ingredients List ({recipeIngredients.length} item(s))</h3>
                    <div className="left-right-space-evenly-section">
                      <button
                        onClick={handleAutoDistribute}
                        className="auto-distribute-button"
                      >
                        Auto Distribute All
                      </button>

                      <button
                        onClick={handleDeleteAll}
                        className="delete-all-button"
                      >
                        Delete All
                      </button>
                    </div>
                    <ul className="ingredients-list">
                      {recipeIngredients.map((ingredient, index) => {
                        // Map `mealPlanId` to the corresponding ingredient
                        const linkedInventory = inventoryData.filter(
                          (item) =>
                            item.inventory.ingredient_id === ingredient.ingredients.id &&
                            mealPlans.some((mealPlan) => mealPlan.id === item.meal_plan_id)
                        );
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

                        // console.log("inventory used_quantity:", linkedInventory);
                        // console.log("totalAllocated:", totalAllocated);

                        // Determine if the status is "Complete"
                        const isComplete = totalAllocated >= ingredient.quantity;

                        return (
                          <li
                            key={index}
                            // onClick={() => handleIngredientClick(ingredient)}
                            onClick={() => handleIngredientClick(ingredient, recipe.id)}
                            className="ingredient-item"
                          >
                            {/* Display ingredient details */}
                            <img 
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.ingredients.icon_path}`} 
                            alt={ingredient.ingredients.name} 
                            className="ingredient-image"
                          />
                            {ingredient.ingredients.name} - {ingredient.quantity}{" "}
                            {ingredient.ingredients.unit?.unit_tag || ""}

                            {/* Check and display inventory data if exists */}
                            {/* {linkedInventory
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
                            )} */}
                            {linkedInventory
                              .filter((inventory) => inventory.meal_plan.recipe_id === recipe.id).length > 0 && (
                                <div className="linked-inventory-container">
                                  <h4 className="linked-inventory-header">
                                    Linked Inventory Data{" "}
                                    <span className={`inventory-status ${isComplete ? "complete" : "incomplete"}`}>
                                      ({isComplete ? "Complete" : "Incomplete"})
                                    </span>
                                    <button
                                      className="delete-all-button"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the parent onClick
                                        linkedInventory.forEach((inventory) =>
                                          handleDeleteInventory(
                                            inventory.inventory_id,
                                            inventory.meal_plan_id,
                                            inventory.ingredients.id
                                          )
                                        );
                                      }}
                                    >
                                      Delete All
                                    </button>
                                  </h4>
                                  {/* {linkedInventory
                                    .filter((inventory) => inventory.meal_plan.recipe_id === recipe.id)
                                    .map((inventory) => (
                                      <div key={inventory.id} className="inventory-item">
                                        <p>
                                          <strong>Original quantity:</strong>{" "}
                                          {inventory.ingredients.unit?.unit_tag === inventory.ingredients.unitInv?.unitInv_tag ? (
                                            <>
                                              {inventory.inventory.init_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                            </>
                                          ) : inventory.ingredients.unit?.conversion_rate_to_grams ===
                                            inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check ? (
                                            <>
                                              {inventory.inventory.init_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                                              {inventory.inventory.init_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                            </>
                                          ) : (
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
                                            <>
                                              {inventory.used_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                            </>
                                          ) : inventory.ingredients.unit?.conversion_rate_to_grams ===
                                            inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check ? (
                                            <>
                                              {inventory.used_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                                              {inventory.used_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                                            </>
                                          ) : (
                                            <>
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
                                    ))} */}
                                    {linkedInventory
        .filter((inventory) => inventory.meal_plan.recipe_id === recipe.id)
        .map((inventory) => {
          const allocationPercentage =
            (inventory.used_quantity / inventory.inventory.init_quantity) * 100;

          return (
            <div key={inventory.id} className="inventory-item">
              <p>
                <strong>Original quantity:</strong>{" "}
                {inventory.ingredients.unit?.unit_tag === inventory.ingredients.unitInv?.unitInv_tag ? (
                  <>
                    {inventory.inventory.init_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                  </>
                ) : inventory.ingredients.unit?.conversion_rate_to_grams ===
                  inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check ? (
                  <>
                    {inventory.inventory.init_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                    {inventory.inventory.init_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                  </>
                ) : (
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
                <strong>Quantity left:</strong>{" "}
                {inventory.ingredients.unit?.unit_tag === inventory.ingredients.unitInv?.unit_tag ? (
                  <>
                    {inventory.inventory.quantity} {inventory.ingredients.unit?.unit_tag || ""}
                  </>
                ) : inventory.ingredients.unit?.conversion_rate_to_grams ===
                  inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check ? (
                  <>
                    {inventory.inventory.quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                    {inventory.inventory.quantity} {inventory.ingredients.unit?.unit_tag || ""}
                  </>
                ) : (
                  <>
                    {inventory.inventory.quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                    {Math.round(
                      (inventory.inventory.quantity *
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
                  <>
                    {inventory.used_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                  </>
                ) : inventory.ingredients.unit?.conversion_rate_to_grams ===
                  inventory.ingredients.unitInv?.conversion_rate_to_grams_for_check ? (
                  <>
                    {inventory.used_quantity} {inventory.ingredients.unitInv?.unitInv_tag || ""} /
                    {inventory.used_quantity} {inventory.ingredients.unit?.unit_tag || ""}
                  </>
                ) : (
                  <>
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
              <InventoryVisualization linkedInventory={linkedInventory} recipe={recipe} />
            </div>
          );
        })}



                                </div>
                              )}

                          </li>
                        );
                      })}
                    </ul>
                  </section>
                </section>
            )}
            {activeTab === "steps" && (
              <section className="steps-section">
                <h3>Steps</h3>
                <ul className="steps-list">
                    {steps.map((step) => (
                        <li key={step.step_number} className="step-item">
                            <strong>{step.step_number}:</strong> {step.instruction}
                        </li>
                    ))}
                </ul>
            </section>
            )}
        </div>
      );
    })}
      {mealPlans.some((mealPlan) => mealPlan.meal_plan_status.id === 3) ? (
        // Show the "Mark as Cooked" button if any meal plan has status id === 3
        <button
          onClick={markAsCooked}
          style={{
            padding: "10px 20px",
            background: "green",
            color: "white",
            borderRadius: "5px",
            marginTop: "20px",
          }}
        >
          Mark as Cooked
        </button>
      ) : !mealPlans.every((mealPlan) => mealPlan.meal_plan_status.id === 2) ? (
        // Show the "Start Cooking" button if not all meal plans have status id === 2
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
          {console.log("HEREEEEEEEE")}
        </button>
      ) : null}
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
                  <>
                  <p>
                    <strong>No {selectedIngredient.ingredients.name} in your inventory.</strong>
                  </p>
                  <button
                    onClick={() => {
                      navigate(`/recipes/shopping-list`); // Navigate to details page
                    }}
                    style={{
                      marginTop: "10px",
                      padding: "10px 20px",
                      background: "orange",
                      color: "white",
                      borderRadius: "5px",
                    }}
                  >
                    View Missing Ingredients for This Week&apos;s Plan
                  </button>
                </>
                  
                ) : (
                  <>
                    <p>
                      <strong>Your Selection:</strong>{" "}
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
                          <li
                            key={item.id}
                            style={{
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
                  {selectedInventory
                    .filter((item) => item.preselected) // Only include preselected items
                    .map((item) => {
                      // Check if the item is currently converted
                      const isConverted = item.isConverted || false;

                      // Check if the unit conversion rates match
                      const isConversionRateMatching =
                        item.ingredients.unit?.conversion_rate_to_grams ===
                        item.ingredients.unitInv?.conversion_rate_to_grams_for_check;

                      // Adjust quantity if conversion rates do not match
                      const adjustedQuantity = isConversionRateMatching
                        ? item.selectedQuantity // If matching, use the normal quantity
                        : item.selectedQuantity / (item.ingredients.unit?.conversion_rate_to_grams || 1); // Else, divide by the unit's conversion rate

                      // Determine whether to display ~ based on whether the adjusted quantity is a whole number
                      const displayAdjustedQuantity = Number.isInteger(adjustedQuantity)
                        ? adjustedQuantity // Display as an integer if it's a whole number
                        : `~${Math.round(adjustedQuantity)}`; // Display with ~ if not a whole number

                      const displayConvertedQuantity = item.selectedQuantity * item.ingredients.unit?.conversion_rate_to_grams;

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
                </p>

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

                        const handleConvertUnit = (itemId) => {
                          setSelectedInventory((prevSelectedInventory) =>
                            prevSelectedInventory.map((item) => {
                              if (item.id === itemId) {
                                const baseConversionRate = item.ingredients.unit?.conversion_rate_to_grams || 1;
                                const inventoryConversionRate = item.ingredients.unitInv?.conversion_rate_to_grams_for_check || 1;
                        
                                const isCurrentlyConverted = item.isConverted || false;

                                  const newSelectedQuantity = isCurrentlyConverted
                                  ? Math.floor((item.selectedQuantity * baseConversionRate) / inventoryConversionRate) // Convert back and round
                                  : Math.floor((item.selectedQuantity * inventoryConversionRate) / baseConversionRate); // Convert and round
                        
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
        <div className="cooking-mode-overlay">
          <h2 className="cooking-mode-title">
            Recipe: {recipes[currentRecipeIndex]?.name || "Unknown Recipe"} - Step{" "}
            {currentStepIndex + 1}
          </h2>
          <p className="cooking-mode-instruction">
            {recipes[currentRecipeIndex]?.steps?.[currentStepIndex]?.instruction ||
              "No instruction available"}
          </p>

          <div className="cooking-mode-buttons">
            {/* Previous Recipe Button */}
            {currentRecipeIndex > 0 && currentStepIndex === 0 && (
              <button
                onClick={() => {
                  setCurrentRecipeIndex((prev) => prev - 1);
                  setCurrentStepIndex(
                    recipes[currentRecipeIndex - 1]?.steps?.length - 1 || 0
                  );
                }}
                className="cooking-mode-button previous-recipe-button"
              >
                Go to Previous Recipe
              </button>
            )}

            {/* Previous Step Button */}
            <button
              onClick={handlePreviousStep}
              className={`cooking-mode-button ${
                currentStepIndex === 0 ? "hidden" : ""
              }`}
            >
              Previous Step
            </button>

            {/* Next Step Button */}
            <button
              onClick={handleNextStep}
              className={`cooking-mode-button ${
                currentStepIndex ===
                (recipes[currentRecipeIndex]?.steps?.length - 1 || 0)
                  ? "hidden"
                  : ""
              }`}
            >
              Next Step
            </button>

            {/* Proceed to Next Recipe or Finish Cooking */}
            {currentStepIndex ===
              (recipes[currentRecipeIndex]?.steps?.length - 1 || 0) &&
              (currentRecipeIndex < recipes.length - 1 ? (
                <button
                  onClick={() => {
                    setCurrentRecipeIndex((prev) => prev + 1);
                    setCurrentStepIndex(0);
                  }}
                  className="cooking-mode-button next-recipe-button"
                >
                  Proceed to Next Recipe
                </button>
              ) : (
                <button
                  onClick={finishCooking}
                  className="cooking-mode-button finish-cooking-button"
                >
                  Finish Cooking
                </button>
              ))}

            {/* Exit Cooking Mode */}
            <button
              onClick={toggleCookingMode}
              className="cooking-mode-button exit-cooking-button"
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
