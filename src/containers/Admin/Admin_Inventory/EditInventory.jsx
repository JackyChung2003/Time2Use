import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';

const EditInventory = () => {
  const { id } = useParams(); // Get the inventory ID from the URL
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState('');
  const [expiryDateId, setExpiryDateId] = useState('');
  const [expiryDates, setExpiryDates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
    fetchExpiryDates();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, quantity, expiry_date_id')
        .eq('id', id)
        .single(); // Fetch the specific inventory item

      if (error) throw error;

      setInventory(data);
      setQuantity(data.quantity);
      setExpiryDateId(data.expiry_date_id);
    } catch (error) {
      console.error('Error fetching inventory:', error.message);
      alert('Failed to fetch inventory item.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiryDates = async () => {
    try {
      const { data, error } = await supabase.from('expiry_date').select('id, date');
      if (error) throw error;
      setExpiryDates(data);
    } catch (error) {
      console.error('Error fetching expiry dates:', error.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity, expiry_date_id: expiryDateId })
        .eq('id', id);

      if (error) throw error;

      alert('Inventory updated successfully!');
      navigate('/admin/inventories'); // Navigate back to the inventory list
    } catch (error) {
      console.error('Error updating inventory:', error.message);
      alert('Failed to update inventory item.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="edit-inventory">
      <h2>Edit Inventory Item</h2>
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Expiry Date:</label>
          <select
            value={expiryDateId}
            onChange={(e) => setExpiryDateId(e.target.value)}
            required
          >
            <option value="" disabled>Select an expiry date</option>
            {expiryDates.map((date) => (
              <option key={date.id} value={date.id}>
                {date.date}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="submit-btn">
          Update Inventory
        </button>
      </form>
    </div>
  );
};

export default EditInventory;
