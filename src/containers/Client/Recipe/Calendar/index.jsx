import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // For navigation
import Calendar from 'react-calendar';
import { format } from 'date-fns';


import BackButton from '../../../../components/Button/BackButton';

// import 'react-calendar/dist/Calendar.css'; // Default React-Calendar styles
import './index.css'; // Custom styles

const RecipeCalendar = () => {
    const [value, setValue] = useState(new Date()); // State for selected date
    const [showModal, setShowModal] = useState(false); // State to manage modal visibility
    const [selectedDate, setSelectedDate] = useState(null); // State for long-pressed date
    const navigate = useNavigate(); // React Router hook for navigation
    const timerRef = useRef(null); // Ref to store the long-press timer

    const hardcodedDetails = {
        breakfast: '2 dishes',
        lunch: '3 dishes',
        dinner: '2 dishes',
        others: '1 dish',
    };

    // Function to handle long press start
    const handleLongPressStart = (date) => {
        timerRef.current = setTimeout(() => {
            setSelectedDate(date.toDateString());
            setShowModal(true); // Show modal after long press
        }, 700); // 700ms long press duration
        console.log('Long press started');
    };

    // Function to handle long press end
    const handleLongPressEnd = () => {
        clearTimeout(timerRef.current); // Clear timer if press is released early
        console.log('Long press ended');
    };

    // Function to handle click
    const handleClick = (date) => {
        const formattedDate = format(date, 'yyyy-MM-dd'); // Ensures correct local date
        navigate(`/recipes/calendar/${formattedDate}`); // Navigate to details page
    };

    // Function to determine the class name for each calendar tile
    const getTileClassName = ({ date }) => {
        const today = new Date(); // Current date
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return 'today-date'; // Class for today
        } else if (date > today) {
            return 'coming-date'; // Class for upcoming dates
        }
        return 'past-date'; // Class for past dates
    };

    return (
        <div className="calendar-container">
            <h1>Calendar</h1>
            <BackButton />
            <Calendar
                onChange={(date) => setValue(date)} // Updates selected date
                value={value} // Current selected date
                tileClassName={getTileClassName} // Apply class names to tiles
                locale="en-US" // Set the language to English
                onClickDay={(date) => handleClick(date)} // Handle click on date
                tileContent={({ date }) => (
                    <div
                        onTouchStart={() => handleLongPressStart(date)} // Mobile long press start
                        onTouchEnd={handleLongPressEnd} // Mobile long press end
                        onMouseDown={() => handleLongPressStart(date)} // Desktop long press start
                        onMouseUp={handleLongPressEnd} // Desktop long press end
                    />
                )}
            />

            {/* Modal for Long Press */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Details for {selectedDate}</h2>
                        <p>Breakfast: {hardcodedDetails.breakfast}</p>
                        <p>Lunch: {hardcodedDetails.lunch}</p>
                        <p>Dinner: {hardcodedDetails.dinner}</p>
                        <p>Others: {hardcodedDetails.others}</p>
                        <button onClick={() => setShowModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecipeCalendar;
