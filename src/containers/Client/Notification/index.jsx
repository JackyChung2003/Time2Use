import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import "./index.css";

const NotificationPopup = ({ title, messages, type, onClose }) => (
  <div className={`notification-popup ${type}`}>
    <div className="notification-content">
      <button className="close-button" onClick={onClose}>✕</button>
      <h3>{title}</h3>
      <div className="notification-list">
        {messages.length === 0 ? (
          <p>No items.</p>
        ) : (
          messages.map((message, index) => <p key={index}>{message}</p>)
        )}
      </div>
    </div>
  </div>
);

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
          console.error("Error fetching user or user is not logged in:", userError?.message);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profile")
          .select("notification_day")
          .eq("user", user.id)
          .single();

        if (profileError || !profileData) {
          console.error("Error fetching profile data:", profileError?.message);
          return;
        }

        const notificationDay = profileData.notification_day;
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

        inventoryItems?.forEach((item) => {
          if (item.days_left < 0) {
            expiredItems.push(`Oops! Your ${item.ingredients?.name} has expired.`);
          } else {
            soonExpiringItems.push(`Get Cooking! Your ${item.ingredients?.name} is expiring soon.`);
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
        <NotificationPopup
          title="Soon to Expire"
          messages={soonExpiringNotifications}
          type="soon-expire"
          onClose={closeSoonExpiringNotification}
        />
      )}
      {showExpiredNotification && (
        <NotificationPopup
          title="Expired Items"
          messages={expiredNotifications}
          type="expired"
          onClose={closeExpiredNotification}
        />
      )}
    </>
  );
};

export default Notification;
