import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RecipeExplore = () => {
    const [recipes, setRecipes] = useState([
        { id: 1, name: "Spaghetti Bolognese", ingredients: ["pasta", "beef", "tomato sauce"] },
        { id: 2, name: "Chicken Curry", ingredients: ["chicken", "curry paste", "coconut milk"] },
        { id: 3, name: "Vegetable Stir Fry", ingredients: ["broccoli", "carrot", "soy sauce"] },
    ]);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const filteredRecipes = recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: '20px' }}>
            <h1>Explore Recipes</h1>
            <p>Find recipes based on your preferences and available ingredients.</p>

            <input
                type="text"
                placeholder="Search recipes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: '10px', width: '100%', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '5px' }}
            />

            <div>
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe) => (
                        <div 
                            key={recipe.id} 
                            style={{ padding: '10px', border: '1px solid #ddd', marginBottom: '10px', borderRadius: '5px', cursor: 'pointer' }}
                            onClick={() => navigate(`/recipes/recipe/${recipe.id}`)}
                        >
                            <h3>{recipe.name}</h3>
                            <p>Ingredients: {recipe.ingredients.join(", ")}</p>
                        </div>
                    ))
                ) : (
                    <p>No recipes found.</p>
                )}
            </div>
        </div>
    );
};

export default RecipeExplore;