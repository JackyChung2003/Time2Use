import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import { format } from "date-fns";
import supabase from "../../../../config/supabaseClient";

import BackButton from "../../../../components/Button/BackButton";
import "./index.css";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";


import { useRecipeContext } from "../Contexts/RecipeContext";

const RecipeCalendar = () => {
  const [value, setValue] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyMealStatuses, setDailyMealStatuses] = useState([]);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const location = useLocation(); // Get location and state

  const { userData } = useRecipeContext();

  // console.log("userData", userData);

  // Extract recipe information from navigation state
  const { recipeId, recipeName, servingPacks } = location.state || {}; // Destructure state if available

  // Fetch data from Supabase and preprocess it
  const fetchData = async () => {
    // const { data, error } = await supabase.from("meal_plan").select("*");
    const { data, error } = await supabase
      .from("meal_plan")
      .select("*")
      .eq("user_id", userData.id); // Filter by user_id
    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    // Preprocess data
    const groupedByDate = {};
    data.forEach((row) => {
      const { planned_date, meal_type_id, status_id } = row;

      if (!groupedByDate[planned_date]) {
        groupedByDate[planned_date] = {
          breakfast: null,
          lunch: null,
          dinner: null,
          others: null,
        };
      }

      const mealTypeMap = { 1: "breakfast", 2: "lunch", 3: "dinner", 4: "others" };
      const mealType = mealTypeMap[meal_type_id];
      groupedByDate[planned_date][mealType] = status_id;
    });

    // Aggregate statuses for each day
    const processedData = Object.entries(groupedByDate).map(([date, meals]) => {
      const statuses = Object.values(meals);
      const noPlan = statuses.filter((status) => status === null).length;
      const complete = statuses.filter((status) => status === 2).length;
      const planning = statuses.filter((status) => status === 1).length;
      
      // Adjust totalMeals based on the presence of "Others"
      const totalMeals = meals.others !== null ? 4 : 3;

      // Determine if "Others" is present
      const hasOthersMeal = meals.others !== null;

      // Log details for debugging
      console.log(`Date: ${date}`);
      console.log("Meals:", meals);
      console.log(`No Plan: ${noPlan}, Complete: ${complete}, Planning: ${planning}, Total Meals: ${totalMeals}`);


      return {
        date,
        noPlan,
        complete,
        planning,
        totalMeals, // Dynamic totalMeals based on "Others"
        hasOthersMeal, // New field to indicate "Others" presence
      };
    });

    console.log("Processed data:", processedData);

    setDailyMealStatuses(processedData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
          // Add 'page' class to the body and set background color for the whole page
          document.body.classList.add('page');
  
          // Clean up when the component is unmounted
          return () => {
              document.body.classList.remove('page');
          };
      }, []);

  const handleLongPressStart = (date) => {
    timerRef.current = setTimeout(() => {
      setSelectedDate(date.toDateString());
      setShowModal(true);
    }, 700);
  };

  const handleLongPressEnd = () => {
    clearTimeout(timerRef.current);
  };

  // const handleClick = (date) => {
  //   const formattedDate = format(date, "yyyy-MM-dd");
  //   navigate(`/recipes/calendar/${formattedDate}`);
  // };

  const handleClick = (date) => { 
    const formattedDate = format(date, "yyyy-MM-dd");
    navigate(`/recipes/calendar/${formattedDate}`, {
      state: { recipeId, recipeName, servingPacks }, // Pass state along with navigation
    });
  };

  const getTileClassName = ({ date }) => {
    const today = new Date();
    const formattedDate = format(date, "yyyy-MM-dd");
  
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return "today-date";
  
    const dayData = dailyMealStatuses.find((day) => day.date === formattedDate);
  
    // Check if the date is in the past and has 0/0 progress
    if (dayData && dayData.totalMeals === 3 && dayData.noPlan === 3 && date < today) {
      return "no-plan-past-date"; // Special class for 0/0 past dates
    }
  
    // if (dayData) {
    //   if (dayData.noPlan === 0 && dayData.complete === 3) {
    //     return "complete-date";
    //   } else if (dayData.complete > 0) {
    //     return "partial-complete-date";
    //   }
    // }

    // if (dayData) {
    //   if (dayData.noPlan === 0) {
    //     if (dayData.totalMeals === 4 && dayData.complete === 4) {
    //       return "complete-date others-complete"; // Apply special class for 4/4
    //     } else if (dayData.complete === 3) {
    //       return "complete-date"; // Apply normal complete class for 3/3
    //     }
    //   } else if (dayData.complete > 0) {
    //     return "partial-complete-date";
    //   }
    // }
    // console.log("dayData", dayData)
    // if (dayData) {
    //   if (dayData.noPlan === 0) {
    //     if (dayData.totalMeals === 4 && dayData.complete === 4) {
    //       return "complete-date others-complete"; // Apply special class for 4/4
    //     }
    //     // } else if (dayData.totalMeals === 3 && dayData.complete === 3 && dayData.hasOthersMeal === false) {
    //     //   return "complete-date"; // Apply normal complete class for 3/3 without "Others"
    //     // }
    //   } else if (dayData.complete > 0) {
    //     return "partial-complete-date";
    //   }
    // }

    // Handle future dates
    if (date > today) {
      if (dayData && dayData.planning > 0) {
        return "future-date-planned"; // Future date with a plan
      }
      return "future-date"; // Future date with no plan
    }

    if (dayData) {
      if (dayData.complete === 3 && dayData.hasOthersMeal === false) {
        return "complete-date"; // Apply normal complete class for 3/3 without "Others"
      }
    
      if (dayData.noPlan === 0) {
        if (dayData.totalMeals === 4 && dayData.complete === 4) {
          return "complete-date others-complete"; // Apply special class for 4/4
        }
      } else if (dayData.complete > 0) {
        return "partial-complete-date";
      }
    }
    
    
  
    return date > today ? "coming-date" : "past-date";
  };
  
  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <BackButton />
        <div className="date-display">
          {/* <p>{date}</p> */}
          {recipeId && recipeName && (
          <div className="recipe-calender-details">
            {/* <h2>Recipe to Schedule:</h2> */}
            <p><strong>Recipe to Schedule:</strong> {recipeName} ({servingPacks} pax)</p>
            {/* <p><strong>Recipe ID:</strong> {recipeId}</p> */}
          </div>
        )}
        </div>
        
      </header>
      <h1>Calendar</h1>
      {/* <BackButton /> */}

      <Calendar
  onChange={(date) => setValue(date)}
  value={value}
  tileClassName={getTileClassName}
  locale="en-US"
  onClickDay={(date) => handleClick(date)}
  tileContent={({ date }) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const dayData = dailyMealStatuses.find((day) => day.date === formattedDate);

    if (dayData) {
      // const totalPlanned = dayData.totalMeals - dayData.noPlan;
      const totalPlanned = dayData.totalMeals - (dayData.hasOthersMeal ? dayData.noPlan : dayData.noPlan - 1);
      const completed = dayData.complete;

      // Handle different cases
      if (totalPlanned === 0) {
        // No meals planned
        return (
          <div className="tile-content no-plan-past-date">
            {/* <span>(0/0)</span> */}
          </div>
        );
      }

      // {console.log("HEREEEEEE", dayData)}
      return (
        <div className="tile-content">
          {/* Show progress as x/y */}
          <span>
            ({completed}/{totalPlanned})
          </span>
        </div>
      );
    }

    // No data for this day
    return (
      <div className="tile-content">
        {/* <span>(0/0)</span> */}
      </div>
    );
  }}
/>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Details for {selectedDate}</h2>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeCalendar; 