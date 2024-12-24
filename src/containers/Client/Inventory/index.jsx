import React, { useState, useEffect } from 'react';
import './index.css';
import inventoryUtils from './index.js';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [items, setItems] = useState([]); // State to hold fetched items
  const [expandedItems, setExpandedItems] = useState({});  // State to manage expanded text per item

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

  const handleClick = (id) => {
    setExpandedItems((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));  // Toggle full text for clicked item
  };

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const handlePortionClickWithState = async (item, portion) => {
    try {
      const newQuantity = await inventoryUtils.handlePortionClick(item, portion);
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: newQuantity } : i
        )
      );
    } catch (err) {
      console.error('Error handling portion click:', err);
    }
  };

  const handleQuantityChange = async (item, newQuantity) => {
    try {
      await inventoryUtils.handleQuantityChange(item, newQuantity, setItems);
    } catch (err) {
      console.error('Error handling quantity change:', err);
    }
  };

  return (
    <div className="inventory-container">
      <input
        type="text"
        placeholder="Search for items..."
        className="search-bar"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="tracker-title">Tracker</div>
      <div className="item-list">
        {filteredItems.map((item) => (
          <div key={item.id} className="item-container">
            <div className="item">
              <div className="left-section">
                <div className={`green-dot ${item.statusColor}`}></div>
                <div className="circle-image">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
                <div className="text-section">
                  <div className="item-name">{item.name}</div>

                  <div className={item.daysLeft == null ? 'item-days shelf-life' : 'item-days'}>
                    {item.daysLeft != null ? `${item.daysLeft}d left` : null}
                  </div>

                  {item.daysLeft == null && (
                    <div
                      className={`item-days shelf-life ${expandedItems[item.id] ? 'full-text' : ''}`}
                      onClick={() => handleClick(item.id)}
                    >
                      {expandedItems[item.id] ? item.pred_shelf_life : `${item.pred_shelf_life.slice(0, 20)}...`}
                    </div>
                  )}
                </div>
              </div>

              <div className="right-section">
                <span className="item-quantity">
                  {item.quantity} {item.quantity_unit}
                </span>
                <span className="tag">{item.category}</span>
                <span
                  className="dropdown-icon"
                  onClick={() => toggleDropdown(item.id)}
                >
                  ▼
                </span>
              </div>
            </div>

            {activeDropdown === item.id && (
              <div className="dropdown-box">
                <div className="date-purchased">
                  <img 
                    src="/image/date-icon.png" 
                    alt="Calendar Icon" 
                    className="date-icon"
                  />
                  Date Purchased: {new Date(item.created_at).toISOString().split('T')[0]}
                </div>

                {item.quantity_unit === 'unit(s)' && (
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

                {item.quantity_unit !== 'unit(s)' && (
                  <div className="portion-section">
                    <div className="quantity-container">
                      <input
                        type="number"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => handleQuantityChange(item, e.target.value)}
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
