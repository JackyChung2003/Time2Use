import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';

// Ingredients Table Component
const IngredientsTable = ({ ingredients, handleEditIngredient, handleDeleteIngredient }) => {
  return (
    <div>
      <h2>Manage Ingredients</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category ID</th>
            <th>Unit ID</th>
            <th>Unit Inv ID</th>
            <th>Fat</th>
            <th>Protein</th>
            <th>Calories</th>
            <th>Carbohydrate</th>
            <th>Shelf Life</th>
            <th>Storage Tips</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient) => (
            <tr key={ingredient.id}>
              <td>{ingredient.name}</td>
              <td>{ingredient.ingredients_category_id}</td>
              <td>{ingredient.quantity_unit_id}</td>
              <td>{ingredient.quantity_unitInv_id}</td>
              <td>{ingredient.nutritional_info?.fat || ""}</td>
              <td>{ingredient.nutritional_info?.protein || ""}</td>
              <td>{ingredient.nutritional_info?.calories || ""}</td>
              <td>{ingredient.nutritional_info?.carbohydrate || ""}</td>
              <td>{ingredient.pred_shelf_life}</td>
              <td>{ingredient.storage_tips}</td>
              <td>
              <button className="edit-btn" onClick={() => handleEditIngredient(ingredient)}>Edit</button>
              <button className="delete-btn" onClick={() => handleDeleteIngredient(ingredient.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // State for the current page
  const rowsPerPage = 15; // Rows per page
  const navigate = useNavigate();

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*');

      if (ingredientsError) throw ingredientsError;

      const { data: ingredientcategories, error: ingredientcategoriesError } = await supabase
        .from('ingredients_category')
        .select('*');

      if (ingredientcategoriesError) throw ingredientcategoriesError;

      // Merge the data
      const ingredientDetails = ingredients.map(ingredient => {
        const catIngredient = ingredientcategories.find(cat => cat.id === ingredient.ingredients_category_id);
        return {
          ...ingredient,
          category_name: catIngredient ? catIngredient.category_name : "Unknown Category",
        };
      });

      setIngredients(ingredientDetails);
    } catch (error) {
      console.error('Error fetching ingredient details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle editing ingredient
  const handleEditIngredient = (ingredient) => {
    navigate(`/admin/ingredients/edit/${ingredient.id}`);
  };

  

  // Handle deleting ingredient
  const handleDeleteIngredient = async (id) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        const { error } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', id);

        if (error) {
          console.error("Error deleting ingredient:", error.message);
        } else {
          setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
        }
      } catch (error) {
        console.error('Error deleting ingredient:', error.message);
      }
    }
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = ingredients.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(ingredients.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-ingredients">
      <div className="admin-ingredients-header">
        <h2>Manage Ingredients</h2>
        <button
          className="create-ingredient-btn"
          onClick={() => navigate('/admin/ingredients/create')}
        >
          Create Ingredient
        </button>
      </div>

      <IngredientsTable
        ingredients={currentRows}
        handleEditIngredient={handleEditIngredient}
        handleDeleteIngredient={handleDeleteIngredient}
      />

      {/* Pagination Controls */}
      <div className="pagination-controls">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminIngredients;
