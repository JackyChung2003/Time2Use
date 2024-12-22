import React, { useState, useEffect } from 'react';
import './index.css';
import inventoryUtils from './index.js';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [items, setItems] = useState([]); // State to hold fetched items

  useEffect(() => {
    const loadItems = async () => {
      const fetchedItems = await inventoryUtils.fetchItems();
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

  // Handle the portion click and update the item quantity in state after database update
  const handlePortionClickWithState = async (item, portion) => {
    try {
      // Call handlePortionClick without passing setItems
      const newQuantity = await inventoryUtils.handlePortionClick(item, portion);
      
      // Update the item quantity in state
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        )
      );
    } catch (err) {
      console.error('Error handling portion click:', err);
    }
  };
  
    // Handle direct quantity change in the input field
    const handleQuantityChange = async (item, newQuantity) => {
      try {
        // Call the handleQuantityChange from index.js and pass setItems
        await inventoryUtils.handleQuantityChange(item, newQuantity, setItems);
      } catch (err) {
        console.error('Error handling quantity change:', err);
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
                  <div className={`green-dot ${item.statusColor}`}></div>
                  <div className="circle-image">
                    <img src={item.imageUrl} alt={item.name} />
                  </div>
                  <div className="text-section">
                    <div className="item-name">{item.name}</div>
                    <div className="item-days">{item.daysLeft} left</div>
                  </div>
                </div>
    
                <div className="right-section">
                  <span className="item-quantity">{item.quantity} {item.quantity_unit}</span>
                  <span className="tag">{item.category}</span>
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
                  {item.quantity_unit=== 'unit(s)' && (
                    <div className="unit-controls">
                      <button
                        onClick={() => handlePortionClickWithState(item, 1)}
                        className="quantity-button"
                      >
                        - 
                      </button>
                      <div className="quantity-container">
                        <div className="quantity-box">{item.quantity}</div>
                      </div>
                      <button
                        onClick={() => handlePortionClickWithState(item, -1)}
                        className="quantity-button"
                      >
                        + 
                      </button>
                    </div>
                  )}
    
                  {/* If the unit is not "unit", show the portion buttons */}
                  {item.quantity_unit !== 'unit(s)' && (
                    <div className="portion-section">
                      <div className="quantity-container">
                        <input
                          type="number"
                          value={item.quantity === 0 ? '' : item.quantity} // Keep it bound to the state
                          onChange={(e) => handleQuantityChange(item, e.target.value)} // Call handler on change
                          className="quantity-box"
                          min="0"
                        />
                        <div className="quantity-unit">({item.quantity_unit})</div>
                      </div>
                      <p>Used portion</p>
                      <div className="portion-buttons">
                        <button
                          onClick={() => handlePortionClickWithState(item, item.quantity * 0.25)}
                        >
                          1/4
                        </button>
                        <button
                          onClick={() => handlePortionClickWithState(item, item.quantity * 0.5)}
                        >
                          1/2
                        </button>
                        <button
                          onClick={() => handlePortionClickWithState(item, item.quantity * 0.75)}
                        >
                          3/4
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nutritional Facts */}
                  <div className="nutritional-facts">
                    <h4>
                      Nutritional Facts
                      <img
                        src="/image/nutrition-facts-icon.png"
                        alt="Nutrition Icon"
                        className="nutrition-icon"
                      />
                      </h4>
                    <p>
                      Fat: {item.nutritionalInfo.fat}, 
                      Protein: {item.nutritionalInfo.protein}, 
                      Calories: {item.nutritionalInfo.calories}kcal, 
                      Carbohydrates: {item.nutritionalInfo.carbohydrate}
                    </p>
                  </div>

                  {/* Storage Tips */}
                  <div className="storage-tips">
                    <h4>
                      Storage Tips
                      <img
                        src="/image/yellow-bulb-icon.png"
                        alt="Bulb Icon"
                        className="bulb-icon"
                      />
                    </h4>
                    <p>{item.storageTips}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
};

export default Inventory;
