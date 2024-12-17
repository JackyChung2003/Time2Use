// // import { createContext, useContext, useState, useEffect } from "react";
// // import supabase from "../../../../config/supabaseClient";
// // // Create the Recipe Context
// // const RecipeContext = createContext();

// // export const RecipeProvider = ({ children }) => {
// //   const [recipes, setRecipes] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const fetchRecipes = async () => {
// //       const { data, error } = await supabase
// //         .from("recipes")
// //         .select("*");
// //       if (error) console.error("Error fetching recipes:", error);
// //       else setRecipes(data || []);
// //       setLoading(false);
// //     };
// //     fetchRecipes();
// //   }, []);

// //   return (
// //     <RecipeContext.Provider value={{ recipes, loading }}>
// //       {children}
// //     </RecipeContext.Provider>
// //   );
// // };

// // export const useRecipeContext = () => {
// //   return useContext(RecipeContext);
// // };

// import{ createContext, useContext, useState } from "react";

// // Create context
// const RecipeContext = createContext();

// // Hook for consuming context
// export const useRecipeContext = () => useContext(RecipeContext);

// export const RecipeProvider = ({ children }) => {
//     const [recipes, setRecipes] = useState([]);
//     const [filters, setFilters] = useState({
//         category: null,
//         tags: [],
//         equipment: [],
//         cookTime: null,
//     });

//     // Fetch recipes logic here
//     // const fetchRecipes = async () => {
//     //   // Placeholder fetch logic
//     //   console.log("Fetching recipes...");
//     // };
//     const fetchRecipes = async () => {
//         try {
//             const { data, error } = await supabase
//                 .from('recipes')
//                 .select(`
//                     id,
//                     name,
//                     description,
//                     prep_time,
//                     cook_time,
//                     category_id,
//                     created_at,
//                     image_path,
//                     recipe_ingredients (
//                         ingredients (name)
//                     ),
//                     recipe_tags (
//                         tags (name)
//                     ),
//                     recipe_equipment (
//                         equipment (name)
//                     )
//                 `);
    
//             if (error) {
//                 console.error('Error fetching recipes:', error);
//                 return;
//             }
    
//             // Map the data correctly
//             const recipesWithDetails = data.map((recipe) => ({
//                 ...recipe,
//                 ingredients: recipe.recipe_ingredients?.map((ri) => ri.ingredients.name) || [],
//                 tags: recipe.recipe_tags?.map((rt) => rt.tags.name) || [],
//                 equipment: recipe.recipe_equipment?.map((re) => re.equipment.name) || [],
//             }));
    
//             setRecipes(recipesWithDetails || []);
//         } catch (error) {
//             console.error('Unexpected error:', error);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Function to apply filters
//     const applyFilters = (newFilters) => {
//         setFilters((prevFilters) => ({
//             ...prevFilters,
//             ...newFilters,
//         }));
//         console.log("Filters applied:", newFilters);
//     };

//     return (
//         // <RecipeContext.Provider value={{ recipes, setRecipes, filters, applyFilters }}>
//         <RecipeContext.Provider
//           value={{
//             recipes,
//             filters,
//             fetchRecipes,
//             applyFilters,
//           }}
//         >
//             {children}
//         </RecipeContext.Provider>
//     );
// };

import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../../../../config/supabaseClient";

// Create context
const RecipeContext = createContext();

// Hook for consuming context
export const useRecipeContext = () => useContext(RecipeContext);

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [filters, setFilters] = useState({
    categories: [],
    tags: [],
    equipment: [],
    cookTime: null,
  });
  const [loading, setLoading] = useState(true); // Add the missing state

//   // Fetch recipes logic here
//   const fetchRecipes = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase.from("recipes").select("*");
//       if (error) {
//         console.error("Error fetching recipes:", error);
//       } else {
//         setRecipes(data || []);
//       }
//     } catch (err) {
//       console.error("Unexpected error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };
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
      
        console.log("Raw data fetched from Supabase:", data); // Log the raw data here

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
        console.log("Recipes with categories:", recipesWithDetails);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to apply filters
  const applyFilters = (newFilters) => {
    console.log("Previous Filters:", filters);
    console.log("New Filters Applied:", newFilters);
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
    console.log("Filters applied:", newFilters);
  };

  useEffect(() => {
    fetchRecipes(); // Fetch recipes on mount
  }, []);

  return (
    <RecipeContext.Provider value={{ recipes, filters, fetchRecipes, applyFilters, loading }}>
      {children}
    </RecipeContext.Provider>
  );
};
