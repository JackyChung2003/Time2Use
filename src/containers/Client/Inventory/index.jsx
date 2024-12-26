import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import inventoryUtils from './index.js';
import supabase from '../../../config/supabaseClient';

const Inventory = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [items, setItems] = useState([]); // State to hold fetched items
  const [expandedItems, setExpandedItems] = useState({});  // State to manage expanded text per item
  const [sortOption, setSortOption] = useState(null); // State for sorting option
  const [showFilterMenu, setShowFilterMenu] = useState(false); // State to toggle filter menu

  useEffect(() => {
    const fetchUserAndInventory = async () => {
      setIsLoading(true); // Start loading
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching user session:", error.message);
        navigate("/login");
      } else {
        const loggedInUser = data?.session?.user || null;
        setUser(loggedInUser);
  
        if (loggedInUser) {
          const fetchedItems = await inventoryUtils.fetchItems(loggedInUser.id);
          setItems(fetchedItems);
        }
      }
      setIsLoading(false); // End loading
    };
  
    fetchUserAndInventory();
  }, [navigate]);
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const sortedItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) // Search filtering
    .sort((a, b) => {
      if (sortOption === 'days_left') {
        return (a.daysLeft || Infinity) - (b.daysLeft || Infinity); // Sort by days_left (smallest to greatest)
      } else if (sortOption === 'category') {
        return a.category.localeCompare(b.category); // Sort alphabetically by category
      }
      return 0; // Default order
    });

  const handleFilterClick = () => {
    setShowFilterMenu((prev) => !prev); // Toggle filter menu visibility
    };
  
  const handleSortOptionChange = (option) => {
    setSortOption(option); // Update sort option
    setShowFilterMenu(false); // Close the filter menu
  };
  
  const handleClick = (id) => {
    setExpandedItems((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    })); // Toggle full text for clicked item
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
  
      {/* Title */}
      <div className="tracker-header">
        <img
          src="/image/filter-icon.png" 
          alt="Filter Icon" 
          className="filter-icon"
          onClick={handleFilterClick}
        />
        <div className="tracker-title">Tracker</div>
      </div>
  
      {/* Filter Menu */}
      {showFilterMenu && (
        <div className="filter-menu">
          <button onClick={() => handleSortOptionChange('days_left')}>Sort by Days Left</button>
          <button onClick={() => handleSortOptionChange('category')}>Sort by Food Category</button>
        </div>
      )}
  
      {/* Display message if inventory is empty */}
      {sortedItems.length === 0 
        ? <div className="empty-inventory-message">Oops, your inventory is empty...</div> 
        : (
          <div className="item-list">
            {sortedItems.map(item => (
              <div key={item.id} className="item-container">
                <div className="item">
                  <div className="left-section">
                    <div className={`green-dot ${item.statusColor}`} />
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
                    <span className="dropdown-icon" onClick={() => toggleDropdown(item.id)}>▼</span>
                  </div>
                </div>
  
                {activeDropdown === item.id && (
                  <div className="dropdown-box">
                    <div className="date-purchased">
                      <img src="/image/date-icon.png" alt="Calendar Icon" className="date-icon" />
                      Date Purchased: {new Date(item.created_at).toISOString().split('T')[0]}
                    </div>
  
                    {item.quantity_unit === 'unit(s)' ? (
                      <div className="unit-controls">
                        <button onClick={() => handlePortionClickWithState(item, 1)} className="quantity-button">-</button>
                        <div className="quantity-container">
                          <div className="quantity-box">{item.quantity}</div>
                        </div>
                        <button onClick={() => handlePortionClickWithState(item, -1)} className="quantity-button">+</button>
                      </div>
                    ) : (
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
                          <button onClick={() => handlePortionClickWithState(item, item.quantity * 0.25)}>1/4</button>
                          <button onClick={() => handlePortionClickWithState(item, item.quantity * 0.5)}>1/2</button>
                          <button onClick={() => handlePortionClickWithState(item, item.quantity * 0.75)}>3/4</button>
                        </div>
                      </div>
                    )}
  
                    <div className="nutritional-facts">
                      <h4>
                        Nutritional Facts
                        <img src="/image/nutrition-facts-icon.png" alt="Nutrition Icon" className="nutrition-icon" />
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
                        <img src="/image/yellow-bulb-icon.png" alt="Bulb Icon" className="bulb-icon" />
                      </h4>
                      <p>{item.storageTips}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}  

export default Inventory;
