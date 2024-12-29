import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../../../../config/supabaseClient";

// Create context
const RecipeContext = createContext();

// Hook for consuming context
export const useRecipeContext = () => useContext(RecipeContext);

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [tags, setTags] = useState([]); // State to store tags
  const [categories, setCategories] = useState([]); // Categories
  const [equipment, setEquipment] = useState([]); // Equipment
  const [ingredients, setIngredients] = useState([]); // State for ingredients
  const [mealTypes, setMealTypes] = useState([]); // State to store meal types

  const [filters, setFilters] = useState({
    categories: [],
    tags: [],
    equipment: [],
    cookTime: null,
    ingredients: [], // Add ingredients to filters
  });
  
  const [loading, setLoading] = useState(true); // Add the missing state

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
          
        // recipe_tags ( tags (name) ),
        // recipe_tags:recipe_tags_recipe_id_fkey ( tags (name) ),
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

  const applyFilters = (newFilters) => {
    setFilters((prevFilters) => ({
        ...prevFilters,
        ...newFilters,
    }));
    // console.log("Filters updated:", newFilters);
  };

  useEffect(() => {
    fetchRecipes(); // Fetch recipes on mount
    fetchTags(); // Fetch tags on mount
    fetchCategories(); // Fetch categories on mount
    fetchEquipment(); // Fetch equipment on mount
    fetchIngredients(); // Fetch ingredients on mount
    fetchMealTypes(); // Fetch meal types on mount
  }, []);

  useEffect(() => {
    // console.log("Filters changed:", filters);
    fetchRecipes(); // Re-fetch recipes based on new filters
}, [filters]);

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
                nutritional_info,
                unit:quantity_unit_id (
                  unit_tag,
                  unit_description,
                  conversion_rate_to_grams 
                )
              ),
              quantity
            `)
            .eq("recipe_id", recipeId);
            
            
            // quantity_unit_id:ingredients_quantity_unit_id_fkey (

        if (error) {
            console.error("Error fetching recipe ingredients:", error);
        } else {
            console.log("Recipe ingredients:", data);
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
                instruction,
                variations
            `)
            .eq("recipe_id", recipeId)
            .order("step_number", { ascending: true }); // Ensure steps are in order

        if (error) {
            console.error("Error fetching recipe steps:", error);
        } else {
            console.log("Recipe steps:", data);
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
            .select("meal_type_id, recipe_id, notes")
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
        const { data, error } = await supabase.from("meal_type").select("id, name");
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
            .select("id, name, image_path, description")
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


  return (
    // <RecipeContext.Provider value={{ recipes, tags, filters, fetchRecipes, fetchTags, applyFilters, loading }}>
    <RecipeContext.Provider
      value={{
        recipes,
        tags,
        categories,
        equipment,
        filters,
        ingredients,
        mealTypes,
        fetchRecipes,
        fetchTags,
        fetchCategories,
        fetchEquipment,
        fetchIngredients,
        fetchRecipeIngredients,
        fetchRecipeSteps,
        fetchMealPlansByDate,
        fetchRecipesByIds,
        applyFilters,
        loading,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
