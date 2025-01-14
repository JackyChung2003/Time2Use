import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';
import CommonLoader from '../../../components/Loader/CommonLoader';

const AdminInventories = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // State for the current page
  const rowsPerPage = 15; // Rows per page
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    try {
      const { data: inventories, error: inventoriesError } = await supabase
        .from('inventory')
        .select('id, user_id, ingredient_id, quantity, expiry_date_id');
  
      if (inventoriesError) throw inventoriesError;
  
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name');

      if (ingredientsError) throw ingredientsError;

      const { data: expirydates, error: expirydatesError } = await supabase
        .from('expiry_date')
        .select('id, date');
  
      if (expirydatesError) throw expirydatesError;
  
      const inventoryWithIngredients = inventories.map(inventory => {
        const temp = ingredients.find(ingredient => ingredient.id === inventory.ingredient_id); // Match by ID
        const exdate = expirydates.find(expirydate => expirydate.id === inventory.expiry_date_id);
        return {
          id: inventory.id,           // Add id here
          user: inventory.user_id,
          ingredient: temp.name,
          quantity: inventory.quantity,
          expiry_date: exdate?.date
        };
      });

      setInventories(inventoryWithIngredients);
    } catch (error) {
      console.error('Error fetching inventory with ingredients:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Inventory item deleted successfully.');
      setInventories(inventories.filter((inventory) => inventory.id !== id)); // Remove deleted item from state
    } catch (error) {
      console.error('Error deleting inventory:', error.message);
      alert('Failed to delete inventory item.');
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/inventories/edit/${id}`); // Redirect to an edit page with the item's ID
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = inventories.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(inventories.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) return  <CommonLoader />;

  return (
    <div className="admin-inventories">
      <div className="admin-inventories-header">
        <h2>Manage Inventory</h2>
        <button 
          className="create-inventory-btn"
          onClick={() => navigate('/admin/inventories/create-expiry-date')}
        >
          Create Expiry Date
        </button>
      </div>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th> {/* Added a column for ID */}
              <th>User ID</th>
              <th>Name of Ingredient</th>
              <th>Quantities</th>
              <th>Expiry Date</th>
              <th>Actions</th> {/* New column */}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((inventory) => (
              <tr key={inventory.id}>
                <td>{inventory.id}</td> {/* Display the inventory ID */}
                <td>{inventory.user}</td>
                <td>{inventory.ingredient}</td>
                <td>{inventory.quantity}</td>
                <td>{inventory.expiry_date}</td>
                <td>
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(inventory.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(inventory.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

export default AdminInventories;
