import React from 'react';

const NotificationButton = () => {
  const handleEnableNotifications = async () => {
    try {
      await main(); // Calling the main function defined in script.js
    } catch (error) {
      console.error("Notification setup failed:", error.message);
    }
  };

  return (
    <button onClick={handleEnableNotifications} style={{ fontSize: '20px', cursor: 'pointer' }}>
      🔔 Enable Notifications
    </button>
  );
};

export default NotificationButton;
