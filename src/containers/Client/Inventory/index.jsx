import React, { useState, useEffect } from 'react';
import './Inventory.css';
import { fetchItems, updateQuantityInDatabase } from './inventory';
import supabase from '../../../config/supabaseClient';


const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [items, setItems] = useState([]); // State to hold fetched items

  useEffect(() => {
    const loadItems = async () => {
      const fetchedItems = await fetchItems();
      setItems(fetchedItems);
    };

    loadItems();
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const handlePortionClick = (item, portion) => {
    // Calculate the new quantity based on the selected portion
    let newQuantity = item.quantity - portion;
  
    // Round newQuantity to 2 decimal places
    newQuantity = parseFloat(newQuantity.toFixed(2));
  
    // Update the item's quantity (you will need to update the database here)
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, quantity: newQuantity } : i
    );
    setItems(updatedItems);
  
    // Call a function to update the quantity in the database
    updateQuantityInDatabase(item.id, newQuantity);
  };
  

  const updateQuantityInDatabase = async (itemId, newQuantity) => {
    try {
      // Call your Supabase function to update the quantity
      const { data, error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .match({ ingredient_id: itemId });

      if (error) {
        throw error;
      }

      console.log('Quantity updated:', data);
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  return (
    <div className="inventory-container">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search for items..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Title */}
      <div className="tracker-title">Tracker</div>

      {/* List of Items */}
      <div className="item-list">
        {filteredItems.map((item) => (
          <div key={item.id} className="item-container">
            {/* Main Item Rectangle */}
            <div className="item">
              <div className="left-section">
              <div className="green-dot"></div>
                <div className="circle-image">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
                <div className="text-section">
                  <div className="item-name">{item.name}</div>
                  <div className="item-days">{item.daysLeft} left</div>
                </div>
              </div>

              <div className="right-section">
                <span className="tag">{item.category}</span>
                <span className="item-quantity">{item.quantity} {item.quantity_unit}</span>
                <span
                  className="dropdown-icon"
                  onClick={() => toggleDropdown(item.id)}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Dropdown Box BELOW the entire rectangle */}
            {activeDropdown === item.id && (
              <div className="dropdown-box">

                {/* If the unit is "unit", show + and - buttons */}
                {item.quantity_unit === 'unit' && (
                  <div className="unit-controls">
                    <button
                      onClick={() => handlePortionClick(item, 1)}
                      className="quantity-button"
                    >
                      - 
                    </button>
                    <div className="quantity-container">
                    <div className="quantity-box">{item.quantity}</div>
                    </div>
                    <button
                      onClick={() => handlePortionClick(item, -1)}
                      className="quantity-button"
                    >
                      + 
                    </button>
                  </div>
                )}

                {/* If the unit is not "unit", show the portion buttons */}
                {item.quantity_unit !== 'unit' && (
                  <div className="portion-section">
                    <div className="quantity-container">
                    <div className="quantity-box">{item.quantity}</div>
                    <div className="quantity-unit">{item.quantity_unit}</div>
                    </div>
                    <p>Used portion</p>
                    <div className="portion-buttons">
                      <button
                        onClick={() => handlePortionClick(item, item.quantity * 0.25)}
                      >
                        1/4
                      </button>
                      <button
                        onClick={() => handlePortionClick(item, item.quantity * 0.5)}
                      >
                        1/2
                      </button>
                      <button
                        onClick={() => handlePortionClick(item, item.quantity * 0.75)}
                      >
                        3/4
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
