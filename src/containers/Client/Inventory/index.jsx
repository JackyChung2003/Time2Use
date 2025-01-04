import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
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
  const [usedAmount, setUsedAmount] = useState({});
  const [pendingSwipe, setPendingSwipe] = useState(null);  // State to track pending swipe actions
  const [isProcessing, setIsProcessing] = useState(false);


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

  useEffect(() => {
    if (pendingSwipe) {
      confirmAction();  // Run only when pendingSwipe is set
    }
  }, [pendingSwipe]);  // This ensures confirmAction is called after pendingSwipe is updated
  
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  const sortedItems = items
  .filter((item) => item.condition_id === 1) // Only show items with condition_id = 1
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

  const handleDoneClick = (item) => {
    const amountUsed = parseFloat(usedAmount[item.id] || 0);
    if (amountUsed > 0 && amountUsed <= item.quantity) {
      const updatedQuantity = item.quantity - amountUsed;
      handleQuantityChange(item, updatedQuantity);
      setUsedAmount({ ...usedAmount, [item.id]: '' }); // Clear input after updating
    } else {
      alert("Please enter a valid amount within the range!");
    }
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

   // Function to remove an item from the list after updating the condition
  const removeItemFromList = (itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  // Function to confirm and execute the action (discard or used)
  const confirmAction = async () => {
    if (pendingSwipe && !isProcessing) {
      setIsProcessing(true); // Disable further actions until processing completes
      const { id, action } = pendingSwipe;
      const newConditionId = action === 'discard' ? 3 : 2;
  
      try {
        const { data, error, count } = await inventoryUtils.updateItemCondition(id, newConditionId);
  
        if (error) {
          console.error('Error updating item condition:', error);
          return;
        }
  
        if (count === 0) {
          console.warn('No matching rows found to update.');
          return;
        }
  
        // Update UI after action
        removeItemFromList(id);
      } catch (err) {
        console.error('Error during action confirmation:', err.message);
      } finally {
        setIsProcessing(false); // Re-enable actions
        setPendingSwipe(null);  // Reset the pending swipe state
      }
    }
  };
  

  // Handle swipe action by setting the pendingSwipe state
  const handleSwipeAction = (item, action) => {
    setPendingSwipe({ id: item.id, action });  // Store pending swipe action
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
      {sortedItems.length === 0 ? (
        <div className="empty-inventory-message">Oops, your inventory is empty...</div>
      ) : (
        <div className="item-sections">
          {/* Expired Food Section */}
          <div className="expired-section">
            <h2 className="section-title">Expired Food</h2>
            <div className="item-list">
              {sortedItems
                .filter(item => item.daysLeft !== null && item.daysLeft <= 0)
                .map(item => (
                  <Item
                    key={item.id}
                    item={item}
                    setItems={setItems}
                    handleClick={handleClick}
                    expandedItems={expandedItems}
                    setExpandedItems={setExpandedItems}
                    usedAmount={usedAmount}
                    setUsedAmount={setUsedAmount}
                    handleQuantityChange={handleQuantityChange}
                    handlePortionClickWithState={handlePortionClickWithState}
                    handleDoneClick={handleDoneClick}
                    activeDropdown={activeDropdown}
                    toggleDropdown={toggleDropdown}
                    handleSwipeAction={handleSwipeAction}
                  />
                ))}
            </div>
          </div>
  
          {/* Fresh & Good Section */}
          <div className="fresh-section">
            <h2 className="section-title">Fresh & Good</h2>
            <div className="item-list">
              {sortedItems
                .filter(item => item.daysLeft > 0 || item.daysLeft === null)
                .map(item => (
                  <Item
                    key={item.id}
                    item={item}
                    setItems={setItems}
                    handleClick={handleClick}
                    expandedItems={expandedItems}
                    setExpandedItems={setExpandedItems}
                    usedAmount={usedAmount}
                    setUsedAmount={setUsedAmount}
                    handleQuantityChange={handleQuantityChange}
                    handlePortionClickWithState={handlePortionClickWithState}
                    handleDoneClick={handleDoneClick}
                    activeDropdown={activeDropdown}
                    toggleDropdown={toggleDropdown}
                    handleSwipeAction={handleSwipeAction}
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};  

const Item = ({
  item,
  setItems,
  handleClick,
  expandedItems,
  setExpandedItems,
  usedAmount,
  setUsedAmount,
  handleQuantityChange,
  handlePortionClickWithState,
  handleDoneClick,
  activeDropdown,
  toggleDropdown,
  handleSwipeAction,
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);  // Add this line

  // Swipeable hook
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setIsSwiped(true),
    onSwipedRight: () => setIsSwiped(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  const handleActionClick = (action) => {
    if (!isProcessing) {  // Prevent further actions during processing
      setIsProcessing(true);
      setIsSwiped(false);  // Reset swipe state
      handleSwipeAction(item, action);  // Trigger action
    }
  };
  

  return (
    <div className="item-container"{...swipeHandlers}>
      <div
        className="swipeable-item"
        style={{
          transform: isSwiped ? "translateX(-50%)" : "translateX(0)",
        }}
      ></div>

      <div className="item">
        {/* Buttons revealed when swiped */}
        {isSwiped && (
          <div className="action-buttons">
            <button
              className="used-button"
              onClick={() => handleActionClick("used")}
            >
              Used
            </button>
            <button
              className="discard-button"
              onClick={() => handleActionClick("discard")}
            >
              Discard
            </button>
          </div>
        )}
        <div className="left-section">
          <div className={`green-dot ${item.statusColor}`} />
          <div className="circle-image">
            <img src={item.imageUrl} alt={item.name} />
          </div>
          <div className="text-section">
            <div className="item-name">{item.name}</div>
            <div className="item-days">
              {item.expiryDate == null ? (
                <>
                  {/* Display predicted shelf life when expiryDate is null */}
                  <div
                    className={`shelf-life ${expandedItems[item.id] ? 'full-text' : ''}`}
                    onClick={() => handleClick(item.id)}
                  >
                    {expandedItems[item.id] ? item.pred_shelf_life : `${item.pred_shelf_life.slice(0, 20)}`}
                  </div>
                  {/* Display days left for items without expiry date */}
                  {item.daysLeft != null && (
                    <div className="days-left">
                      {item.daysLeft}d left
                    </div>
                  )}
                </>
              ) : (
                // Display days left if expiryDate is not null
                <div className="days-left">
                      {item.daysLeft}d left
                </div>
              )}
            </div>

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
  
          {/* Quantity Adjustment */}
          {['unit', 'pcs', 'can', 'box'].includes(item.quantity_unit) ? (
            <div className="unit-controls">
              <button onClick={() => handlePortionClickWithState(item, -1)} className="quantity-button">-</button>
              <div className="quantity-container">
                <div className="quantity-box">{item.quantity}</div>
              </div>
              <button onClick={() => handlePortionClickWithState(item, 1)} className="quantity-button">+</button>
            </div>
          ) : (
            <div className="portion-section">
              <div className="quantity-container">
                <input
                  type="number"
                  value={item.quantity === null || item.quantity === undefined ? '' : item.quantity}
                  onChange={(e) => handleQuantityChange(item, e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="quantity-box"
                  min="0"
                />
                <div className="quantity-unit">({item.quantity_unit})</div>
              </div>
              <div className="used-amount-container">
                <label htmlFor={`used-amount-${item.id}`}>Used amount:</label>
                <input
                  type="number"
                  id={`used-amount-${item.id}`}
                  className="used-amount-input"
                  value={usedAmount[item.id] || ''}
                  onChange={(e) => setUsedAmount({ ...usedAmount, [item.id]: e.target.value })}
                />
                <div className="quantity-unit">({item.quantity_unit})</div>
                <img
                  src="/image/tick-icon.png"
                  alt="Confirm"
                  className="done-icon"
                  onClick={() => handleDoneClick(item)}
                />
              </div>
              <p>or</p>
              <div className="portion-row">
                <p>Used portion:</p>
                <div className="portion-buttons">
                  <button onClick={() => handlePortionClickWithState(item, item.quantity * 0.2)}>1/5</button>
                  <button onClick={() => handlePortionClickWithState(item, item.quantity * 0.4)}>2/5</button>
                  <button onClick={() => handlePortionClickWithState(item, item.quantity * 0.6)}>3/5</button>
                  <button onClick={() => handlePortionClickWithState(item, item.quantity * 0.8)}>4/5</button>
                </div>
              </div>
            </div>
          )}
  
          {/* Nutritional Facts */}
          <div className="nutritional-facts">
            <h4>
              Nutritional Facts
              <img src="/image/nutrition-facts-icon.png" alt="Nutrition Icon" className="nutrition-icon" />
            </h4>
            <p>
              Fat: {item.nutritionalInfo.fat}, Protein: {item.nutritionalInfo.protein},
              Calories: {item.nutritionalInfo.calories}kcal, Carbohydrates: {item.nutritionalInfo.carbohydrate}
            </p>
          </div>
  
          {/* Storage Tips */}
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
  );
}
export default Inventory;
