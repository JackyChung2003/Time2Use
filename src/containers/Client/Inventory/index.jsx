import React, { useState } from 'react';
import './Inventory.css';
import { items } from './inventory';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDropdown = (id) => {
    setActiveDropdown((prev) => (prev === id ? null : id));
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
                <div className="text-section">
                  <div className="item-name">{item.name}</div>
                  <div className="item-days">{item.daysLeft} left</div>
                </div>
                <div className="circle-image">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
              </div>

              <div className="right-section">
                <span className="tag">{item.category}</span>
                <span className="item-quantity">{item.quantity}</span>
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
                <p>More details or actions here...</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
