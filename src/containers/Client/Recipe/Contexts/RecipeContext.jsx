import { createContext, useContext, useState, useEffect, useCallback } from "react";
import supabase from "../../../../config/supabaseClient";

// Create context
const RecipeContext = createContext();

// Hook for consuming context
export const useRecipeContext = () => useContext(RecipeContext);

export const RecipeProvider = ({ children }) => {
  const [userData, setUserData] = useState(null); // State to store user data{
  const [recipes, setRecipes] = useState([]);
  const [tags, setTags] = useState([]); // State to store tags
  const [categories, setCategories] = useState([]); // Categories
  const [equipment, setEquipment] = useState([]); // Equipment
  const [ingredients, setIngredients] = useState([]); // State for ingredients
  const [mealTypes, setMealTypes] = useState([]); // State to store meal types
  const [favorites, setFavorites] = useState([]); // Track user's favorite recipes
  const [pax, setPax] = useState(1);

  const [filters, setFilters] = useState({
    categories: [],
    tags: [],
    equipment: [],
    cookTime: null,
    ingredients: [], // Add ingredients to filters
  });
  
  const [loading, setLoading] = useState(true); // Add the missing state

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user data:", error);
      } else {
        setUserData(data?.user);
        console.log("User data fetched:", data?.user);
      }
    } catch (err) {
      console.error("Unexpected error fetching user data:", err);
    }
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select(`
          id,
          name,
          description,
          prep_time,
          cook_time,
          image_path,
          recipe_tags:recipe_tags_recipe_id_fkey ( tags (name) ),
          recipe_equipment ( equipment (name) ),
          recipe_category ( category (name) ),
          recipe_ingredients ( ingredients (name) )
        `);
          
      if (error) {
        console.error("Error fetching recipes:", error);
      } else {
        // Map and ensure tags/equipment default to empty arrays
        const recipesWithDetails = data.map((recipe) => ({
          ...recipe,
          tags: recipe.recipe_tags?.map((rt) => rt.tags.name) || [],
          equipment: recipe.recipe_equipment?.map((re) => re.equipment.name) || [],
          categories: recipe.recipe_category?.map((rc) => rc.category.name) || [],
          ingredients: recipe.recipe_ingredients?.map((ri) => ri.ingredients.name) || [],
        }));
        setRecipes(recipesWithDetails || []);
        // console.log("Recipes with categories:", recipesWithDetails);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase.from("tags").select("id, name");

      if (error) {
        console.error("Error fetching tags:", error);
      } else {
        setTags(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching tags:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("category").select("id, name");
      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching categories:", err);
    }
  };

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase.from("equipment").select("id, name");
      if (error) {
        console.error("Error fetching equipments:", error);
      } else {
        setEquipment(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching equipment:", err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase.from("ingredients").select("id, name");
      if (error) {
        console.error("Error fetching ingredients:", error);
      } else {
        setIngredients(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching ingredients:", err);
    }
  };

  const fetchFavorites = useCallback(async () => {
    if (!userData) {
      console.error("User not logged in. Skipping fetchFavorites.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("recipe_id") // Fetch only the recipe IDs
        .eq("user_id", userData.id);

      if (error) {
        console.error("Error fetching favorites:", error.message);
        return;
      }

      console.log("Favorites fetched:", data);
      setFavorites(data.map((fav) => fav.recipe_id)); // Store favorite recipe IDs
    } catch (err) {
      console.error("Unexpected error fetching favorites:", err.message);
    }
  }, [userData]);
  
  const fetchPax = async (plannedDate, mealTypeId) => {
    try {
      const { data, error } = await supabase
        .from("meal_plan")
        .select("serving_packs")
        .eq("planned_date", plannedDate)
        .eq("meal_type_id", mealTypeId);
  
      if (error) {
        console.error("Error fetching pax:", error.message);
        return null; // Handle error gracefully
      }
  
      // console.log("Pax data:", data);
  
      // Ensure data exists and access the first element's serving_packs
      return data?.[0]?.serving_packs || null; // Safely access serving_packs
    } catch (err) {
      console.error("Unexpected error in fetchPax:", err.message);
      return null; // Handle unexpected errors
    }
  };

  const applyFilters = (newFilters) => {
    setFilters((prevFilters) => ({
        ...prevFilters,
        ...newFilters,
    }));
    // console.log("Filters updated:", newFilters);
  };


  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchUserData(); // Fetch user data first
      await Promise.all([
        fetchRecipes(), 
        fetchTags(),
        fetchCategories(),
        fetchEquipment(),
        fetchIngredients(),
        fetchMealTypes(),
      ]);
    };
    fetchInitialData(); // Execute the initial data fetching
  }, []);

  useEffect(() => {
    // console.log("Filters changed:", filters);
    fetchRecipes(); // Re-fetch recipes based on new filters
  }, [filters]);

  // Fetch favorites only after userData is available
  useEffect(() => {
    if (userData) {
      fetchFavorites(); // Fetch favorites when userData is available
    }
  }, [userData, fetchFavorites]);

  const fetchRecipeIngredients = async (recipeId) => {
    try {
        const { data, error } = await supabase
            .from("recipe_ingredients")
            // .select(`
            //     ingredients (id, name),
            //     quantity,
            //     unit
            // `)
            .select(`
              ingredients (
                id,
                name,
                icon_path,
                nutritional_info,
                unit:quantity_unit_id (
                  unit_tag,
                  unit_description,
                  conversion_rate_to_grams 
                )
              ),
              quantity,
              recipe_id
            `)
            .eq("recipe_id", recipeId);
            
            
            // quantity_unit_id:ingredients_quantity_unit_id_fkey (

        if (error) {
            console.error("Error fetching recipe ingredients:", error);
        } else {
            // console.log("Recipe ingredients:", data);
            return data || [];
        }
    } catch (err) {
        console.error("Unexpected error fetching recipe ingredients:", err);
        return [];
    }
  };

  const fetchRecipeSteps = async (recipeId) => {
    try {
        const { data, error } = await supabase
            .from("steps")
            .select(`
                step_number,
                instruction
            `)
            .eq("recipe_id", recipeId)
            .order("step_number", { ascending: true }); // Ensure steps are in order

        if (error) {
            console.error("Error fetching recipe steps:", error);
        } else {
            // console.log("Recipe steps:", data);
            return data || [];
        }
    } catch (err) {
        console.error("Unexpected error fetching recipe steps:", err);
        return [];
    }
  };

  const fetchMealPlansByDate = async (date) => {
    try {
        // Fetch meal plans for the given date
        const { data, error } = await supabase
            .from("meal_plan")
            // .select("id, meal_type_id, recipe_id, notes, planned_date, ")
            .select(`
              id,
              meal_type_id,
              recipe_id,
              notes,
              planned_date,
              meal_type:meal_type_id ( name ),
              meal_plan_status:status_id ( 
                id,
                name,
                description
              ),
              serving_packs
            `)
            .eq("planned_date", date);

        if (error) {
            console.error("Error fetching meal plans:", error);
            return [];
        }

        // Fetch meal types dynamically
        const { data: mealTypeData, error: mealTypeError } = await supabase
            .from("meal_type")
            .select("id, name");

        if (mealTypeError) {
            console.error("Error fetching meal types:", mealTypeError);
            return [];
        }

        // Map meal_type_id to their names
        const mealTypesMap = mealTypeData.reduce((map, type) => {
            map[type.id] = type.name;
            return map;
        }, {});

        // Enrich meal plans with meal type names
        const enrichedMealPlans = data.map((meal) => ({
            ...meal,
            meal_type_name: mealTypesMap[meal.meal_type_id] || "Unknown",
        }));

        return enrichedMealPlans;
    } catch (err) {
        console.error("Unexpected error fetching meal plans:", err);
        return [];
    }
  };

  const fetchMealTypes = async () => {
    try {
        const { data, error } = await supabase
          .from("meal_type")
          // .select("id, name");
          .select("*");
        if (error) {
            console.error("Error fetching meal types:", error);
        } else {
            setMealTypes(data || []);
        }
    } catch (err) {
        console.error("Unexpected error fetching meal types:", err);
    }
  };

  const fetchRecipesByIds = async (recipeIds) => {
    try {
        // Fetch recipes based on an array of recipe IDs
        const { data, error } = await supabase
            .from("recipes")
            // .select("id, name, image_path, description, prep_time, cook_time")
            .select(`
              id,
              name,
              description,
              prep_time,
              cook_time,
              image_path,
              recipe_tags:recipe_tags_recipe_id_fkey ( tags (name) ),
              recipe_equipment ( equipment (name) ),
              recipe_category ( category (name) ),
              recipe_ingredients ( ingredients (name) )
            `)
            .in("id", recipeIds); // Only fetch recipes with specified IDs

        if (error) {
            console.error("Error fetching recipes by IDs:", error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error("Unexpected error fetching recipes by IDs:", err);
        return [];
    }
  };

  // const fetchUserInventory = async (ingredientId) => {
  //   try {
  //     if (!userData) {
  //       console.error("User not logged in. Cannot fetch inventory.");
  //       return [];
  //     }

  //     const { data, error } = await supabase
  //       .from("inventory") // Replace with your inventory table name
  //       // .select(`
  //       //   id,
  //       //   user_id,
  //       //   ingredient_id,
  //       //   quantity,
  //       //   expiry_date_id,
  //       //   freshness_status_id,
  //       //   quantity_unit_id,
  //       //   init_quantity,
  //       //   days_left
  //       // `)
  //       .select(`
  //         id,
  //         user_id,
  //         ingredient_id,
  //         quantity,
  //         expiry_date_id,
  //         freshness_status_id,
  //         quantity_unit_id,
  //         init_quantity,
  //         days_left,
  //         expiry_date (
  //           id, 
  //           date
  //         ),
  //         freshness_status (
  //           id, 
  //           status_color
  //         ),
  //         unit:quantity_unit_id (
  //           id,
  //           unit_tag, 
  //           unit_description
  //         ),
  //         ingredients (
  //               id,
  //               name,
  //               nutritional_info,
  //               unit:quantity_unit_id (
  //                 unit_tag,
  //                 unit_description,
  //                 conversion_rate_to_grams 
  //               )
  //             )
  //       `)
  //       .eq("ingredient_id", ingredientId) // Filter by ingredient_id
  //       .eq("user_id", userData.id)// Use userData to filter by user_id
  //       .gt("days_left", 0); // Filter for items with days_left > 0

  //       // console.log("User inventory:", data);
  
  //     if (error) {
  //       console.error("Error fetching user inventory:", error);
  //       return [];
  //     }
  
  //     return data || [];
  //   } catch (err) {
  //     console.error("Unexpected error fetching user inventory:", err);
  //     return [];
  //   }
  // };
  
  // const fetchMealPlanIds = async (ingredientId, recipeId, plannedDate) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("meal_plan")
  //       .select("id, recipe_id")
  //       .eq("planned_date", plannedDate)
  //       .eq("recipe_id", recipeId);

  //     if (error) {
  //       console.error("Error fetching meal plan IDs:", error);
  //       return [];
  //     }

  //     return data || [];
  //   } catch (err) {
  //     console.error("Unexpected error fetching meal plan IDs:", err);
  //     return [];
  //   }
  // };

  const fetchUserInventory = async (ingredientId = null) => {
    try {
      if (!userData) {
        console.error("User not logged in. Cannot fetch inventory.");
        return [];
      }
  
      // Build the query
      const query = supabase
        .from("inventory") // Replace with your inventory table name
        .select(`
          id,
          user_id,
          ingredient_id,
          quantity,
          expiry_date_id,
          freshness_status_id,
          init_quantity,
          condition:condition_id (
            id,
            condition
          ),
          days_left,
          expiry_date (
            id, 
            date
          ),
          freshness_status (
            id, 
            status_color
          ),
          ingredients (
            id,
            name,
            nutritional_info,
            unit:quantity_unit_id (
              unit_tag,
              unit_description,
              conversion_rate_to_grams 
            ),
            unitInv:quantity_unitInv_id (
              id,
              unitInv_tag,
              conversion_rate_to_grams_for_check
            )
          )
        `)
        .eq("user_id", userData.id) // Filter by user_id
        .eq("condition_id", 1) // Filter for items in good condition
        .gt("days_left", 0); // Filter for items with days_left > 0
        // unit:quantity_unit_id (
        //   id,
        //   unit_tag, 
        //   unit_description
        // ),
  
      // Add `ingredient_id` filter if provided
      if (ingredientId) {
        query.eq("ingredient_id", ingredientId);
      }
  
      const { data, error } = await query;
  
      if (error) {
        console.error("Error fetching user inventory:", error);
        return [];
      }
  
      return data || [];
    } catch (err) {
      console.error("Unexpected error fetching user inventory:", err);
      return [];
    }
  };
  
  const fetchMealPlanId = async (recipe_id, meal_type_id, planned_date) => {
    try {
      const { data, error } = await supabase
        .from("meal_plan")
        .select("id")
        .eq("recipe_id", recipe_id)
        .eq("meal_type_id", meal_type_id)
        .eq("planned_date", planned_date)
        .single(); // Assuming one meal_plan per combination
  
      if (error) {
        console.error("Error fetching meal_plan_id:", error);
        return null;
      }
  
      return data?.id || null;
    } catch (err) {
      console.error("Unexpected error fetching meal_plan_id:", err.message);
      return null;
    }
  };
  

  const updateInventoryPlanStatus = async (inventoryMealPlanId, newStatusId) => {
    try {
      const { data, error } = await supabase
        .from("inventory_meal_plan")
        .update({
          status_id: newStatusId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventoryMealPlanId); // Match by inventory_meal_plan ID
  
      if (error) {
        throw error;
      }
  
      console.log(
        `Status updated to ${newStatusId} for inventory_meal_plan_id: ${inventoryMealPlanId}`
      );
      return data;
    } catch (err) {
      console.error("Error updating inventory plan status:", err.message);
      return null;
    }
  };

  const getStatusIdByName = async (statusName) => {
    try {
      const { data, error } = await supabase
        .from("inventory_meal_plan_status")
        .select("id")
        .eq("name", statusName)
        .single();
  
      if (error || !data) {
        console.error("Error fetching status ID:", error);
        return null;
      }
  
      return data.id; // Return the status ID
    } catch (err) {
      console.error("Unexpected error fetching status ID:", err.message);
      return null;
    }
  };
  
  const fetchInventoryMealPlanData = async (planned_date) => {
    try {
      const { data, error } = await supabase
        .from("inventory_meal_plan")
        .select("inventory_id, meal_plan_id, used_quantity, status_id")
        .eq("meal_plan_id", planned_date); // Use the provided planned_date or meal_plan_id
  
      if (error) {
        console.error("Error fetching inventory meal plan data:", error);
        return [];
      }
  
      return data;
    } catch (err) {
      console.error("Unexpected error fetching inventory meal plan data:", err.message);
      return [];
    }
  };

  const fetchInventoryMealPlanByMealPlanId = async (mealPlanIds) => {
    try {
      const { data, error } = await supabase
        .from("inventory_meal_plan")
        // .select("inventory_id, meal_plan_id, used_quantity, status_id")
        // .select("inventory_id, meal_plan_id, used_quantity, status_id, ingredients(id, name)") // Include ingredient details
        .select(`
          inventory_id, 
          meal_plan_id, 
          meal_plan (
            recipe_id,
            meal_type_id,
            planned_date,
            meal_type:meal_type_id (
              name
            ),
            meal_plan_status:status_id (
              id,
              name,
              description
            ),
            serving_packs
          ),
          used_quantity, 
          status_id, 
          inventory_meal_plan_status (
            name,
            description
          ),
          inventory (
            ingredient_id,
            quantity,
            expiry_date:expiry_date_id(
              date
            ),
            days_left,
            freshness_status_id,
            init_quantity,
            condition:condition_id (
              id, 
              condition
            )
          ),
          ingredients (
            id,
            name,
            nutritional_info,
            unit:quantity_unit_id (
              unit_tag,
              unit_description,
              conversion_rate_to_grams 
            ),
            unitInv:quantity_unitInv_id (
              id,
              unitInv_tag,
              conversion_rate_to_grams_for_check
            )
          )
        `)
        .in("meal_plan_id", mealPlanIds); // Query using multiple meal_plan_ids
  
      if (error) {
        console.error("Error fetching inventory meal plan data by meal_plan_id:", error);
        return [];
      }
  
      return data;
    } catch (err) {
      console.error("Unexpected error fetching inventory meal plan data by meal_plan_id:", err.message);
      return [];
    }
  };
  
  const enrichInventory = async (filteredInventory, selectedIngredient, planned_date) => {
    try {
      return await Promise.all(
        filteredInventory.map(async (item) => {
          if (item.meal_plan_id) {
            return item; // If meal_plan_id exists, return as is
          }
  
          // Fetch meal plan ID for the ingredient and recipe
          const { data: mealPlanData, error } = await supabase
            .from("meal_plan")
            .select("id")
            .eq("planned_date", planned_date) // Use the planned_date context
            // .eq("recipe_id", selectedIngredient.recipes[0]?.recipeId || null)
            // .eq("recipe_id", recipeId)
            .eq("recipe_id", selectedIngredient.recipe_id)
            .limit(1) // Assume one-to-one mapping
            .single();
  
          if (error) {
            console.warn(`Failed to fetch meal plan for inventory ID: ${item.id}`, error);
            return { ...item, meal_plan_id: null }; // Return with null if not found
          }
  
          return { ...item, meal_plan_id: mealPlanData?.id || null }; // Add the meal_plan_id
        })
      );
    } catch (error) {
      console.error("Error enriching inventory:", error.message);
      return []; // Return an empty array in case of error
    }
  };

  const fetchInventoryData = async ({ mealPlanIds  = null, plannedDate = null }) => {
    try {
      // Build the query based on the provided parameters
      let query = supabase.from("inventory_meal_plan").select(`
        inventory_id,
        meal_plan_id,
        meal_plan (
          recipe_id,
          meal_type_id,
          planned_date,
          serving_packs
        ),
        used_quantity,
        status_id,
        inventory_meal_plan_status (name, description),
        inventory (
          ingredient_id,
          quantity,
          expiry_date:expiry_date_id (date),
          days_left,
          freshness_status_id,
          init_quantity,
          condition:condition_id (
            id,
            condition
          )
        ),
        ingredients (
          id,
          name,
          nutritional_info,
          unit:quantity_unit_id (unit_tag, unit_description, conversion_rate_to_grams),
          unitInv:quantity_unitInv_id (
              id,
              unitInv_tag,
              conversion_rate_to_grams_for_check
            )
        )
      `)
      // .eq("condition_id", 1); // Filter for items in good condition
  
      // Apply filters dynamically
      if (mealPlanIds ) {
        query = query.in("meal_plan_id", mealPlanIds);
      }
  
      // If plannedDate is provided and mealPlanIds are not, fetch meal plan IDs for the date
    if (plannedDate && !mealPlanIds) {
      const { data: mealPlans, error: mealPlansError } = await supabase
        .from("meal_plan")
        .select("id")
        .eq("planned_date", plannedDate);

      if (mealPlansError) {
        console.error("Error fetching meal plans by planned date:", mealPlansError.message);
        return [];
      }

      const fetchedMealPlanIds = mealPlans?.map((plan) => plan.id) || [];
      if (fetchedMealPlanIds.length > 0) {
        query = query.in("meal_plan_id", fetchedMealPlanIds);
      } else {
        console.warn("No meal plans found for the given date.");
        return [];
      }
    }
  
      const { data, error } = await query;
  
      if (error) {
        console.error("Error fetching inventory data:", error.message);
        return [];
      }
  
      return data || [];
    } catch (err) {
      console.error("Unexpected error fetching inventory data:", err.message);
      return [];
    }
  };
  
  // const handleFavorite = async (recipeId) => {
  //   try {
  //     if (!userData) {
  //       alert("Please log in to save recipes to your favorites.");
  //       return { success: false, message: "User not logged in." };
  //     }

  //     // Check if the favorite already exists
  //     const { data, error } = await supabase
  //       .from("favorites")
  //       .select("id")
  //       .eq("recipe_id", recipeId)
  //       .eq("user_id", userData.id)
  //       .single();

  //     if (error && error.code !== "PGRST116") {
  //       console.error("Error checking favorite status:", error.message);
  //       return { success: false, message: "Failed to check favorite status." };
  //     }

  //     if (data) {
  //       // If favorite exists, delete it
  //       const { error: deleteError } = await supabase
  //         .from("favorites")
  //         .delete()
  //         .eq("id", data.id);

  //       if (deleteError) {
  //         console.error("Error removing favorite:", deleteError.message);
  //         return { success: false, message: "Failed to remove from favorites." };
  //       }

  //       return { success: true, message: "Removed from favorites." };
  //     } else {
  //       // If favorite doesn't exist, insert it
  //       const { error: insertError } = await supabase
  //         .from("favorites")
  //         .insert({ recipe_id: recipeId, user_id: userData.id });

  //       if (insertError) {
  //         console.error("Error adding to favorites:", insertError.message);
  //         return { success: false, message: "Failed to add to favorites." };
  //       }

  //       return { success: true, message: "Added to favorites." };
  //     }
  //   } catch (err) {
  //     console.error("Unexpected error handling favorite:", err.message);
  //     return { success: false, message: "An unexpected error occurred." };
  //   }
  // };

  const toggleFavorite = async (recipeId) => {
    if (!userData) {
      alert("Please log in to add favorites.");
      return;
    }

    try {
      // Check if the recipe is already favorited
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("recipe_id", recipeId)
        .eq("user_id", userData.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking favorite status:", error.message);
        return;
      }

      if (data) {
        // If favorited, remove it
        const { error: deleteError } = await supabase
          .from("favorites")
          .delete()
          .eq("id", data.id);

        if (deleteError) {
          console.error("Error removing favorite:", deleteError.message);
          return;
        }

        setFavorites((prev) => prev.filter((id) => id !== recipeId)); // Update state
      } else {
        // If not favorited, add it
        const { error: insertError } = await supabase
          .from("favorites")
          .insert({ recipe_id: recipeId, user_id: userData.id });

        if (insertError) {
          console.error("Error adding favorite:", insertError.message);
          return;
        }

        setFavorites((prev) => [...prev, recipeId]); // Update state
      }
    } catch (err) {
      console.error("Unexpected error toggling favorite:", err.message);
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        userData,
        recipes,
        tags,
        categories,
        equipment,
        filters,
        ingredients,
        mealTypes,
        favorites,
        pax,
        fetchRecipes,
        fetchTags,
        fetchCategories,
        fetchEquipment,
        fetchIngredients,
        fetchRecipeIngredients,
        fetchRecipeSteps,
        fetchMealPlansByDate,
        fetchRecipesByIds,
        fetchUserInventory,
        // fetchMealPlanIds,
        // updateInventoryPlanStatus,
        getStatusIdByName,
        fetchInventoryMealPlanData,
        fetchInventoryMealPlanByMealPlanId,
        enrichInventory,
        fetchInventoryData,
        applyFilters,
        toggleFavorite,
        fetchPax,
        loading,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
