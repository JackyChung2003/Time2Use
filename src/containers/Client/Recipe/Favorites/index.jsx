import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";
import BackButton from "../../../../components/Button/BackButton";
import { useRecipeContext } from "../Contexts/RecipeContext";
import Loader from "../../../../components/Loader/CommonLoader";

const RecipeFavorites = () => {
  const {
    favorites,
    toggleFavorite,
    fetchRecipesByIds,
    loading,
    filters,
    applyFilters,
  } = useRecipeContext();

  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState(""); // Added search state
  const [isOverlayOpen, setOverlayOpen] = useState(false);

  const navigate = useNavigate();

  // Fetch filter options (categories, tags, and equipment)
  const fetchFilterOptions = async () => {
    try {
      const [{ data: categoriesData }, { data: tagsData }, { data: equipmentData }] = await Promise.all([
        supabase.from("category").select("id, name"),
        supabase.from("tags").select("id, name"),
        supabase.from("equipment").select("id, name"),
      ]);

      setCategories(categoriesData || []);
      setTags(tagsData || []);
      setEquipment(equipmentData || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch favorite recipes
  useEffect(() => {
    const fetchFavoriteRecipes = async () => {
      if (favorites.length === 0) {
        setFavoriteRecipes([]);
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchRecipesByIds(favorites);
        if (data) {
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
    fetchFilterOptions();
  }, [favorites, fetchRecipesByIds]);

  // Filter favorite recipes based on search term and filters
  const filteredRecipes = favoriteRecipes.filter((recipe) => {
    const matchesSearch = recipe.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filters.categories.length
      ? filters.categories.some((category) =>
          (recipe.categories || []).includes(category)
        )
      : true;

    const matchesTags = filters.tags.length
      ? filters.tags.some((tag) => (recipe.tags || []).includes(tag))
      : true;

    const matchesEquipment = filters.equipment.length
      ? filters.equipment.some((equip) => (recipe.equipment || []).includes(equip))
      : true;

    const matchesCookTime = filters.cookTime
      ? recipe.cook_time <= filters.cookTime
      : true;

    return matchesSearch && matchesCategory && matchesTags && matchesEquipment && matchesCookTime;
  });

  if (isLoading || loading) {
    return <Loader />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <BackButton />
      <h1>Your Favorite Recipes</h1>

      {/* Search Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px",
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <button
          onClick={() => setOverlayOpen(true)}
          style={{
            padding: "10px",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Filters
        </button>
      </div>

      {filteredRecipes.length > 0 ? (
        filteredRecipes.map((recipe) => (
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

      {/* Filter Overlay */}
      {isOverlayOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setOverlayOpen(false)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "red",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              cursor: "pointer",
            }}
          >
            X
          </button>
          <h2 style={{ padding: "20px" }}>Filter Options</h2>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
            }}
          >
            {/* Categories */}
            <div style={{ marginBottom: "20px" }}>
              <h3>Category</h3>
              {categories.map((category) => (
                <label key={category.id} style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.name)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      applyFilters({
                        categories: checked
                          ? [...filters.categories, category.name]
                          : filters.categories.filter((c) => c !== category.name),
                      });
                    }}
                  />
                  {category.name}
                </label>
              ))}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: "20px" }}>
              <h3>Tags</h3>
              {tags.map((tag) => (
                <label key={tag.id} style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag.name)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      applyFilters({
                        tags: checked
                          ? [...filters.tags, tag.name]
                          : filters.tags.filter((t) => t !== tag.name),
                      });
                    }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>

            {/* Equipment */}
            <div style={{ marginBottom: "20px" }}>
              <h3>Equipment</h3>
              {equipment.map((equip) => (
                <label key={equip.id} style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={filters.equipment.includes(equip.name)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      applyFilters({
                        equipment: checked
                          ? [...filters.equipment, equip.name]
                          : filters.equipment.filter((eq) => eq !== equip.name),
                      });
                    }}
                  />
                  {equip.name}
                </label>
              ))}
            </div>

            {/* Cooking Time */}
            <div style={{ marginBottom: "20px" }}>
              <h3>Cooking Time</h3>
              <select
                value={filters.cookTime || ""}
                onChange={(e) =>
                  applyFilters({
                    cookTime: e.target.value ? Number(e.target.value) : null,
                  })
                }
                style={{ padding: "10px", borderRadius: "5px", width: "100%" }}
              >
                <option value="">Any</option>
                <option value="15">Less than 15 mins</option>
                <option value="30">Less than 30 mins</option>
                <option value="60">Less than 60 mins</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeFavorites;
