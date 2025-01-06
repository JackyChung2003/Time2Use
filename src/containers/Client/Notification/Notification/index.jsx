import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import "./index.css";

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch notification day
        const { data: notificationDays, error: notificationDayError } = await supabase
          .from("notification_day")
          .select("day");

        if (notificationDayError) {
          console.error("Error fetching notification days:", notificationDayError.message);
          return;
        }

        const notificationDay = notificationDays[0]?.day;

        if (!notificationDay) {
          console.error("No notification day configured.");
          return;
        }

        // Fetch inventory items where days_left matches the notification day
        const { data: inventoryItems, error: inventoryError } = await supabase
          .from("inventory")
          .select("days_left, ingredients(name)")
          .eq("days_left", notificationDay)
          .eq("condition_id", 1); // Only fetch available items

        if (inventoryError) {
          console.error("Error fetching inventory items:", inventoryError.message);
          return;
        }

        // Update notifications with relevant items
        if (inventoryItems.length > 0) {
          setNotifications(
            inventoryItems.map((item) => ({
              message: `Get Cooking! Your ${item.ingredients.name} is expiring soon - tap here for a recipe that uses it!`,
            }))
          );
          setShowNotification(true); // Show notification popup
        }
      } catch (error) {
        console.error("Error fetching notification data:", error.message);
      }
    };

    fetchNotifications();
  }, []);

  const handleClose = () => {
    setShowNotification(false); // Close the notification popup
  };

  return (
    <>
      {showNotification && (
        <div className="notification-popup">
          <div className="notification-content">
            {notifications.map((notification, index) => (
              <p key={index}>{notification.message}</p>
            ))}
            <button className="close-button" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Notification;
