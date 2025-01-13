import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import your ChatHistory and Loading components
import ChatbotHistory from "../../../../components/ChatboxHistoryDisplay";
import ChatbotLoading from "../../../../components/ChatboxLoading";

import { systemPrompt } from "./prompt";

import { useRecipeContext } from "../Contexts/RecipeContext";

import "./index.css";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname; // e.g., "/recipes/details"

  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  const [pendingAction, setPendingAction] = useState(null); // Store pending action

  // const { applyFilters } = useRecipeContext(); // Access applyFilters from context
  // const { fetchRecipes, applyFilters } = useRecipeContext();
  // const { tags, filters, applyFilters, fetchRecipes } = useRecipeContext();
  const { tags, categories, equipment, ingredients, recipes, filters, applyFilters, fetchRecipes } = useRecipeContext();

  // console.log("Categories:", categories); // Check if categories are being fetched properly
  // console.log("Equipment:", equipment);
  // console.log("Filters:", filters);

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

const handleModalResponse = (response) => {
  setIsModalOpen(false); // Close the modal
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
    // const prompt = `${systemPrompt}\n${context}\nUser: ${userInput}`;
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
        { type: "user", message: userInput },
        { type: "bot", message: interpretedText.replace("[GENERAL QUERY]", "").trim() },
      ]);
      return; // Exit early, no filters applied
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
        { type: "user", message: userInput },
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
        { type: "user", message: userInput },
        { type: "bot", message: "All filters cleared. Showing all recipes!" },
      ]);
      return;
    }

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
      { type: "user", message: userInput },
      {
        type: "bot",
        message: appliedFilters
          ? `Filters applied: ${appliedFilters}.`
          : interpretedText,
      },
    ]);
  } catch (error) {
    console.error("Error sending message:", error);
    setChatHistory((prev) => [
      ...prev,
      { type: "user", message: userInput },
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

  return (
    <div className="chatbot-container">
      <h1 className="title">Chatbot</h1>

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
          className="send-button"
          onClick={sendMessage}
          disabled={isLoading}
        >
          Send
        </button>
      </div>

      <button className="clear-button" onClick={clearChat}>
        Clear Chat
      </button>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <p>Would you like to navigate to the RecipeExplore page?</p>
              <button onClick={() => handleModalResponse("yes")}>Yes</button>
              <button onClick={() => handleModalResponse("no")}>No</button>
            </div>
          </div>
        )}
    </div>
  );
};

export default Chatbot