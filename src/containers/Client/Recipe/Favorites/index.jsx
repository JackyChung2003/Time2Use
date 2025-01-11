import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";
import BackButton from "../../../../components/Button/BackButton";
import { useRecipeContext } from "../Contexts/RecipeContext";

const RecipeFavorites = () => {
  const { favorites, toggleFavorite, fetchRecipesByIds, loading } = useRecipeContext();
  const [favoriteRecipes, setFavoriteRecipes] = useState([]); // State to store favorite recipes
  const [isLoading, setIsLoading] = useState(true); // Local loading state
  const navigate = useNavigate();

  // Fetch favorite recipes
  useEffect(() => {
    const fetchFavoriteRecipes = async () => {
      if (favorites.length === 0) {
        setFavoriteRecipes([]); // No favorites, set an empty array
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchRecipesByIds(favorites); // Use context function
        if (data) {
          // Map tags and equipment for the recipes

          console.log("DATA", data);
          const enrichedData = data.map((recipe) => ({
            ...recipe,
            tags: recipe.recipe_tags?.map((tag) => tag.tags.name) || [],
            equipment: recipe.recipe_equipment?.map((equip) => equip.equipment.name) || [],
          }));
          setFavoriteRecipes(enrichedData);
        } else {
          setFavoriteRecipes([]);
        }
      } catch (err) {
        console.error("Error fetching favorite recipes:", err.message);
        setFavoriteRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteRecipes();
  }, [favorites, fetchRecipesByIds]);

  if (isLoading || loading) {
    return <div>Loading your favorite recipes...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <BackButton />
      <h1>Your Favorite Recipes</h1>
      
      {console.log("HEREEEEEE", favoriteRecipes)}
      {favoriteRecipes.length > 0 ? (
        favoriteRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() =>
              navigate(`/recipes/recipe/${recipe.id}`, {
                state: { recipe_id: recipe.id, recipe_name: recipe.name },
              })
            }
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              marginBottom: "10px",
              borderRadius: "5px",
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
            }}
          >
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
              alt={recipe.name}
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "5px",
                marginBottom: "10px",
              }}
            />
            <div>
              <h3>{recipe.name}</h3>
              <p>{recipe.description}</p>
              <p>Prep Time: {recipe.prep_time} mins</p>
              <p>Cook Time: {recipe.cook_time} mins</p>

              {/* Favorite Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(recipe.id);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "24px",
                  marginTop: "10px",
                }}
              >
                {favorites.includes(recipe.id) ? "❤️" : "🤍"}
              </button>

              {/* Tags */}
              {recipe.tags?.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Tags:</strong>{" "}
                  {recipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        background: "#ffcc00",
                        color: "#000",
                        padding: "5px 10px",
                        marginRight: "5px",
                        borderRadius: "5px",
                        fontSize: "12px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Equipment */}
              {recipe.equipment?.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Equipment:</strong>{" "}
                  {recipe.equipment.map((item, index) => (
                    <span
                      key={index}
                      style={{
                        background: "#000000",
                        color: "#fff",
                        padding: "5px 10px",
                        marginRight: "5px",
                        borderRadius: "3px",
                        fontSize: "12px",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <p>No favorite recipes found. Start adding some!</p>
      )}
    </div>
  );
};

export default RecipeFavorites;
