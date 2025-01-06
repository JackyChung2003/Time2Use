import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import "./index.css";

const Notification = () => {
  const [soonExpiringNotifications, setSoonExpiringNotifications] = useState([]);
  const [expiredNotifications, setExpiredNotifications] = useState([]);
  const [showSoonExpiringNotification, setShowSoonExpiringNotification] = useState(false);
  const [showExpiredNotification, setShowExpiredNotification] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Error fetching user:", userError?.message);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("notification_day(day)")
          .eq("user", user.id)
          .single();

        if (profileError || !profileData) {
          console.error("Error fetching profile:", profileError?.message);
          return;
        }

        const notificationDay = profileData.notification_day?.day;
        if (!notificationDay) {
          console.error("No notification day configured for this user.");
          return;
        }

        const { data: inventoryItems, error: inventoryError } = await supabase
          .from("inventory")
          .select("days_left, ingredients(name)")
          .eq("user_id", user.id)
          .lte("days_left", notificationDay)
          .eq("condition_id", 1);

        if (inventoryError) {
          console.error("Error fetching inventory items:", inventoryError.message);
          return;
        }

        const soonExpiringItems = [];
        const expiredItems = [];

        inventoryItems.forEach((item) => {
          if (item.days_left < 0) {
            expiredItems.push(`Oops! Your ${item.ingredients.name} has expired.`);
          } else {
            soonExpiringItems.push(`Get Cooking! Your ${item.ingredients.name} is expiring soon.`);
          }
        });

        if (soonExpiringItems.length > 0) {
          setSoonExpiringNotifications(soonExpiringItems);
          setShowSoonExpiringNotification(true);
        }
        if (expiredItems.length > 0) {
          setExpiredNotifications(expiredItems);
          setShowExpiredNotification(true);
        }
      } catch (error) {
        console.error("Error fetching notification data:", error.message);
      }
    };

    fetchNotifications();
  }, []);

  const closeSoonExpiringNotification = () => setShowSoonExpiringNotification(false);
  const closeExpiredNotification = () => setShowExpiredNotification(false);

  return (
    <>
      {showSoonExpiringNotification && (
        <div className="notification-popup">
          <div className="notification-content">
            <h3>Soon to Expire</h3>
            <div className="notification-list">
              {soonExpiringNotifications.length === 0 ? (
                <p>No ingredients are expiring soon.</p>
              ) : (
                soonExpiringNotifications.map((message, index) => (
                  <p key={index}>{message}</p>
                ))
              )}
            </div>
            <button className="close-button" onClick={closeSoonExpiringNotification}>
              Close
            </button>
          </div>
        </div>
      )}
      {showExpiredNotification && (
        <div className="notification-popup expired">
          <div className="notification-content">
            <h3>Expired Items</h3>
            <div className="notification-list">
              {expiredNotifications.length === 0 ? (
                <p>No expired items.</p>
              ) : (
                expiredNotifications.map((message, index) => (
                  <p key={index}>{message}</p>
                ))
              )}
            </div>
            <button className="close-button" onClick={closeExpiredNotification}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Notification;
