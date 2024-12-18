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
  // ingredient if neeed
  // cooking time if need

  const [filters, setFilters] = useState({
    categories: [],
    tags: [],
    equipment: [],
    cookTime: null,
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
          recipe_tags ( tags (name) ),
          recipe_equipment ( equipment (name) ),
          recipe_category ( category (name) ),
          recipe_ingredients ( ingredients (name) )
        `);
      
        // console.log("Raw data fetched from Supabase:", data); // Log the raw data here

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
  }, []);

  useEffect(() => {
    // console.log("Filters changed:", filters);
    fetchRecipes(); // Re-fetch recipes based on new filters
}, [filters]);

  return (
    // <RecipeContext.Provider value={{ recipes, tags, filters, fetchRecipes, fetchTags, applyFilters, loading }}>
    <RecipeContext.Provider
      value={{
        recipes,
        tags,
        categories,
        equipment,
        filters,
        fetchRecipes,
        fetchTags,
        fetchCategories,
        fetchEquipment,
        applyFilters,
        loading,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};
