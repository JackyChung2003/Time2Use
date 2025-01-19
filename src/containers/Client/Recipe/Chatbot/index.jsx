import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import your ChatHistory and Loading components
import ChatbotHistory from "../../../../components/ChatboxHistoryDisplay";
import ChatbotLoading from "../../../../components/ChatboxLoading";

import { systemPrompt } from "./prompt";

import { useRecipeContext } from "../Contexts/RecipeContext";
import ChatIcon from "../../../../assets/icons/chatbot-icon.svg";
import "./index.css";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef(null); // Ref for the bottom of the chat
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname; // e.g., "/recipes/details"

  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [pendingAction, setPendingAction] = useState(null); // Store pending action
  const [isOverlayOpen, setIsOverlayOpen] = useState(false); // Chat overlay visibility state

  const { tags, categories, equipment, ingredients, recipes, filters, applyFilters, fetchRecipes } = useRecipeContext();

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API key is missing! Please check your .env file.");
}

  // Initialize your Gemini API
  const genAI = new GoogleGenerativeAI(apiKey); // Replace with your API key
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Handle user input
  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  // Scroll to the bottom when chatHistory updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

const handleModalResponse = (response) => {
  setIsModalOpen(false); // Close the modal

  // Add user's response to chat history
  setChatHistory((prev) => [
    ...prev,
    { type: "user", message: response === "yes" ? "Yes" : "No" }, // User's reply
  ]);

  if (response === "yes" && pendingAction === "NAVIGATE_TO_RECIPE_EXPLORE") {
    navigate("/recipes/explore"); // Navigate to the page
    setChatHistory((prev) => [
      ...prev,
      { type: "bot", message: "Navigated to RecipeExplore. What would you like me to help with?" },
    ]);
  } else {
    setChatHistory((prev) => [
      ...prev,
      { type: "bot", message: "No worries! Let me know if there's anything else you'd like me to help with." },
    ]);
  }

  setPendingAction(null); // Clear the pending action
};



const sendMessage = async () => {
  if (userInput.trim() === "") return;

  // setIsLoading(true);
   // Immediately add the user's message to the chat history
   setChatHistory((prev) => [
    ...prev,
    { type: "user", message: userInput },
  ]);

  // Clear the user input for better UX
  setUserInput("");

  setIsLoading(true);

  try {
    // Build the conversation context
    const context = chatHistory
      .map((msg) => `${msg.type === "user" ? "User:" : "Bot:"} ${msg.message}`)
      .join("\n");

      // Append available options to the prompt
    const availableOptions = `
    Available Tags: ${tags.map((tag) => tag.name).join(", ")}
    Available Categories: ${categories.map((cat) => cat.name).join(", ")}
    Available Ingredients: ${ingredients.map((ing) => ing.name).join(", ")}
    Available Recipes: ${recipes.map((recipe) => recipe.name).join(", ")}
        `;

    // Build the prompt for the model
    const prompt = `${systemPrompt}\n${availableOptions}\n${context}\nUser: ${userInput}`;
    console.log("Sending prompt to API:", prompt);

    // Send the prompt to the Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;

    const interpretedText = response.text();
    console.log("Gemini Response:", interpretedText);

     // Check if the response contains `[GENERAL QUERY]`
     if (interpretedText.includes("[GENERAL QUERY]")) {
      setChatHistory((prev) => [
        ...prev,
        // { type: "user", message: userInput },
        { type: "bot", message: interpretedText.replace("[GENERAL QUERY]", "").trim() },
      ]);
      return; // Exit early, no filters applied
    }

    // Check if action requires navigation to /recipes/explore
    const intentRequiresExplore = interpretedText.toLowerCase().includes("apply") ||
      interpretedText.toLowerCase().includes("filter");

    if (intentRequiresExplore && currentPath !== "/recipes/explore") {
      // Open modal to prompt navigation
      setIsModalOpen(true);
      setPendingAction("NAVIGATE_TO_RECIPE_EXPLORE");
      setChatHistory((prev) => [
        ...prev,
        // { type: "user", message: userInput },
        { 
          type: "bot", 
          message: "It looks like you're not on the RecipeExplore page. Would you like to navigate there to apply filters? (Yes/No)" 
        },
      ]);
      return; // Exit early, no filters applied yet
    }

    // Check for "apply all filters" intent
    if (
      interpretedText.toLowerCase().includes("apply all filters") ||
      userInput.toLowerCase().includes("apply all filters")
    ) {
      applyFilters({
        tags: tags.map((tag) => tag.name),
        categories: categories.map((cat) => cat.name),
        equipment: equipment.map((equip) => equip.name),
        cookTime: null,
      });

      await fetchRecipes();
      setChatHistory((prev) => [
        ...prev,
        // { type: "user", message: userInput },
        { type: "bot", message: "All filters have been applied. Showing recipes!" },
      ]);
      return;
    }

    // Check for "clear filters" intent
    if (
      interpretedText.toLowerCase().includes("clear filters") ||
      userInput.toLowerCase().includes("clear")
    ) {
      applyFilters({
        tags: [],
        categories: [],
        equipment: [],
        cookTime: null,
        ingredients: [],
      });

      await fetchRecipes();
      setChatHistory((prev) => [
        ...prev,
        // { type: "user", message: userInput },
        { type: "bot", message: "All filters cleared. Showing all recipes!" },
      ]);
      return;
    }

    if(intentRequiresExplore){
      // Parse the response for specific filtering criteria
      const intent = interpretedText.toLowerCase();
      const matchingTag = tags.find((tag) => intent.includes(tag.name.toLowerCase()));
      const matchingCategory = categories.find((cat) =>
        intent.includes(cat.name.toLowerCase())
      );
      const matchingEquipment = equipment.find((equip) =>
        intent.includes(equip.name.toLowerCase())
      );
      const cookTimeMatch = intent.match(/under (\d+)\s*minutes/);
      const matchingCookTime = cookTimeMatch ? parseInt(cookTimeMatch[1]) : null;
      const matchingIngredients = ingredients.filter((ingredient) =>
        intent.includes(ingredient.name.toLowerCase())
      );

      // Apply filters dynamically
      applyFilters({
        tags: matchingTag ? [...filters.tags, matchingTag.name] : filters.tags,
        categories: matchingCategory
          ? [...filters.categories, matchingCategory.name]
          : filters.categories,
        equipment: matchingEquipment
          ? [...filters.equipment, matchingEquipment.name]
          : filters.equipment,
        cookTime: matchingCookTime || filters.cookTime,
        ingredients:
          matchingIngredients.length > 0
            ? [...filters.ingredients, ...matchingIngredients.map((ing) => ing.name)]
            : filters.ingredients,
      });

      await fetchRecipes();

      // Prepare a summary of applied filters
      const appliedFilters = [
        matchingTag && `Tag: ${matchingTag.name}`,
        matchingCategory && `Category: ${matchingCategory.name}`,
        matchingEquipment && `Equipment: ${matchingEquipment.name}`,
        matchingCookTime && `Cooking Time: Under ${matchingCookTime} minutes`,
        matchingIngredients.length > 0 &&
          `Ingredients: ${matchingIngredients.map((ing) => ing.name).join(", ")}`,
      ]
        .filter(Boolean)
        .join(", ");

      // Update chat history
      setChatHistory((prev) => [
        ...prev,
        // { type: "user", message: userInput },
        {
          type: "bot",
          message: appliedFilters
            ? `Filters applied: ${appliedFilters}.`
            : interpretedText,
        },
      ]);
    }else{
      setChatHistory((prev) => [
        ...prev,
        // { type: "user", message: userInput },
        { type: "bot", message: interpretedText },
      ]);
    }
    
  } catch (error) {
    console.error("Error sending message:", error);
    setChatHistory((prev) => [
      ...prev,
      // { type: "user", message: userInput },
      { type: "bot", message: "An error occurred. Please try again." },
    ]);
  } finally {
    setUserInput("");
    setIsLoading(false);
  }
};


  
  const clearChat = () => {
    setChatHistory([]);
  };

  // const toggleOverlay = () => setIsOverlayOpen(!isOverlayOpen)
  const toggleOverlay = () => {
    setIsOverlayOpen((prev) => {
      const isOpening = !prev;
      document.body.classList.toggle("overlay-open", isOpening);
      return isOpening;
    });
  };
  
  // const handleClickOutside = (e) => {
  //   if (e.target.classList.contains("chat-overlay")) {
  //     setIsOverlayOpen(false);
  //   }
  // };

  const handleClickOutside = (e) => {
    if (e.target.classList.contains("chat-overlay")) {
      setIsOverlayOpen(false);
    }
  };
  
  // Attach both click and pointerdown events to handle touches and drags
  useEffect(() => {
    const handlePointerDownOutside = (e) => {
      if (isOverlayOpen && e.target.classList.contains("chat-overlay")) {
        setIsOverlayOpen(false);
      }
    };
  
    window.addEventListener("pointerdown", handlePointerDownOutside);
  
    return () => {
      window.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [isOverlayOpen]);

  // return (
  //   <div className="chatbot-container">
  //     <h1 className="title">Chatbot</h1>

  //     <div className="chat-box">
  //       <ChatbotHistory chatHistory={chatHistory} />
  //       <ChatbotLoading isLoading={isLoading} />
  //     </div>

  //     <div className="input-section">
  //       <input
  //         type="text"
  //         className="input-box"
  //         placeholder="Type your message..."
  //         value={userInput}
  //         onChange={handleUserInput}
  //       />
  //       <button
  //         className="send-button"
  //         onClick={sendMessage}
  //         disabled={isLoading}
  //       >
  //         Send
  //       </button>
  //     </div>

  //     <button className="clear-button" onClick={clearChat}>
  //       Clear Chat
  //     </button>

  //       {isModalOpen && (
  //         <div className="modal-overlay">
  //           <div className="modal">
  //             <p>Would you like to navigate to the RecipeExplore page?</p>
  //             <button onClick={() => handleModalResponse("yes")}>Yes</button>
  //             <button onClick={() => handleModalResponse("no")}>No</button>
  //           </div>
  //         </div>
  //       )}
  //   </div>
  // );
  return (
    <div className="chatbot-container">
    <div className="chat-icon" onClick={toggleOverlay}>
      {/* <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"></svg> */}
      <img src={ChatIcon} alt="Chatbot" />
    </div>

    {isOverlayOpen && (
      <div className="chat-overlay" onClick={handleClickOutside}>
        <div className="chat-content">
          <div className="chat-header">
            <h1 className="title">Chatbot</h1>
            <button className="clear-chat-button" onClick={clearChat}>
              {/* Clear Chat */}
              <svg className="trash-can-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M6 7H5M6 7H8M18 7H19M18 7H16M10 11V16M14 11V16M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7M8 7H16" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
            <button className="close-chatbot-button" onClick={toggleOverlay}>
              ✖
            </button>
          </div>
          <div className="chat-box">
            <ChatbotHistory chatHistory={chatHistory} />
            <ChatbotLoading isLoading={isLoading} />
          </div>
          <div className="input-section">
            <input
              type="text"
              className="input-box"
              placeholder="Type your message..."
              value={userInput}
              onChange={handleUserInput}
            />
            <button
              className="send-msg-button"
              onClick={sendMessage}
              disabled={isLoading}
            >
              <svg viewBox="0 0 512 512" className="paperplane">
                <path
                  d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}
     {isModalOpen && (
          <div className="navigation-modal-overlay">
            <div className="navigaton-modal">
              <p>Would you like to navigate to the RecipeExplore page?</p>
              <div className="left-right-space-evenly-section">
                <button 
                  className="yes-no-button"
                  onClick={() => handleModalResponse("yes")}
                >Yes</button>
                <button 
                  className="yes-no-button"
                  onClick={() => handleModalResponse("no")}
                >No</button>
              </div>
            </div>
          </div>
        )}
  </div>
);
};

export default Chatbot