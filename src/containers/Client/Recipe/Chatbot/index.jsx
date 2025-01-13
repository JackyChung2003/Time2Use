import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const currentPath = location.pathname; // e.g., "/recipes/details"


  // const { applyFilters } = useRecipeContext(); // Access applyFilters from context
  // const { fetchRecipes, applyFilters } = useRecipeContext();
  // const { tags, filters, applyFilters, fetchRecipes } = useRecipeContext();
  const { recipes, tags, categories, equipment, ingredients,  filters, applyFilters, fetchRecipes } = useRecipeContext();

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

  // Format data for the chatbot
  const formattedTags = tags.map((tag) => tag.name).join(", ");
  const formattedCategories = categories.map((cat) => cat.name).join(", ");
  const formattedEquipment = equipment.map((equip) => equip.name).join(", ");
  const formattedIngredients = ingredients.map((ing) => ing.name).join(", ");

  // Log the current page context whenever it changes
  useEffect(() => {
    console.log("Current Path (Page Context):", currentPath);
  }, [currentPath]);

  // Log RecipeContext data to ensure it's being fetched correctly
  useEffect(() => {
    console.log("Recipes:", recipes);
    console.log("Tags:", tags);
    console.log("Categories:", categories);
    console.log("Equipment:", equipment);
    console.log("Ingredients:", ingredients);
    console.log("Filters:", filters);
  }, [recipes, tags, categories, equipment, ingredients, filters]);

  // Handle user input
  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    setIsLoading(true);
    try {
        // Build the context string to send history messages to the model
        const context = chatHistory
            .map((msg) => `${msg.type === "user" ? "User:" : "Bot:"} ${msg.message}`)
            .join("\n");

        // Append the system prompt and user input
        const pageContext = `You are currently on the page: ${currentPath}.`;
        const availableOptions = `
          Available Tags: ${formattedTags}
          Available Categories: ${formattedCategories}
          Available Equipment: ${formattedEquipment}
          Available Ingredients: ${formattedIngredients}
        `;
        // const prompt = `${systemPrompt}\n${context}\nUser: ${userInput}`;
        // const prompt = `${systemPrompt}\n${pageContext}\n${context}\nUser: ${userInput}`;
        const prompt = `${systemPrompt}\n${availableOptions}\n${pageContext}\n${context}\nUser: ${userInput}`;
      
        console.log("Sending prompt to API:", prompt);

        // Send the concatenated string to the Gemini model
        const result = await model.generateContent(prompt);
        const response = await result.response;

        const interpretedText = response.text();
        console.log("Gemini Response:", interpretedText);

        // Check for "Apply All Filters" intent
        if (
          interpretedText.toLowerCase().includes("apply all filters") ||
          interpretedText.toLowerCase().includes("All filters have been applied") ||
          userInput.toLowerCase().includes("apply all filters")
      ) {
          // Apply all available filters
          applyFilters({
              tags: tags.map((tag) => tag.name),
              categories: categories.map((cat) => cat.name),
              equipment: equipment.map((equip) => equip.name),
              cookTime: null, // Leave cookTime unset for "apply all"
          });

          await fetchRecipes(); // Fetch recipes with all filters applied

          setChatHistory((prev) => [
              ...prev,
              { type: "user", message: userInput },
              { type: "bot", message: "All available filters have been applied. Showing recipes!" },
          ]);
          return; // Exit early after applying all filters
      }

        // Check for "clear filters" intent
        if (interpretedText.toLowerCase().includes("clear filters") || 
            interpretedText.toLowerCase().includes("cleared") ||
            userInput.toLowerCase().includes("clear")) {
            // Reset all filters
            applyFilters({
                categories: [],
                tags: [],
                equipment: [],
                cookTime: null,
                ingredients: [],
            });

            await fetchRecipes(); // Refresh recipes with no filters

            setChatHistory((prev) => [
                ...prev,
                { type: "user", message: userInput },
                { type: "bot", message: "All filters cleared. Showing all recipes!" },
            ]);
            return; // Exit early as filters are cleared
        }

        // Parse the interpreted text to extract filtering criteria
        const intent = interpretedText.toLowerCase();
        const matchingTag = tags.find((tag) => intent.includes(tag.name.toLowerCase()));
        const matchingCategory = categories.find((cat) => intent.includes(cat.name.toLowerCase()));
        const matchingEquipment = equipment.find((equip) => intent.includes(equip.name.toLowerCase()));
        const cookTimeMatch = intent.match(/under (\d+)\s*minutes/);
        const matchingCookTime = cookTimeMatch ? parseInt(cookTimeMatch[1]) : null;
        const matchingIngredients = ingredients.filter((ingredient) =>
            intent.includes(ingredient.name.toLowerCase())
        );

        // Apply filters dynamically
        applyFilters({
            tags: matchingTag ? [...filters.tags, matchingTag.name] : filters.tags,
            categories: matchingCategory ? [...filters.categories, matchingCategory.name] : filters.categories,
            equipment: matchingEquipment ? [...filters.equipment, matchingEquipment.name] : filters.equipment,
            cookTime: matchingCookTime || filters.cookTime,
            ingredients: matchingIngredients.length > 0
                ? [...filters.ingredients, ...matchingIngredients.map((ing) => ing.name)]
                : filters.ingredients,
        });

        await fetchRecipes(); // Fetch recipes with updated filters

        const appliedFilters = [
            matchingCategory && `Category: ${matchingCategory.name}`,
            matchingTag && `Tag: ${matchingTag.name}`,
            matchingEquipment && `Equipment: ${matchingEquipment.name}`,
            matchingCookTime && `Cooking Time: Under ${matchingCookTime} minutes`,
            matchingIngredients.length > 0 &&
            `Ingredients: ${matchingIngredients.map((ing) => ing.name).join(", ")}`,
        ]
            .filter(Boolean)
            .join(", ");

        setChatHistory((prev) => [
            ...prev,
            { type: "user", message: userInput },
            { type: "bot", message: appliedFilters ? `Filters applied: ${appliedFilters}.` : response.text() },
        ]);
    } catch (error) {
        console.error("Error sending message:", error);
        if (error.response) {
            console.error("Error details:", error.response.data);
        }
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
    </div>
  );
};

export default Chatbot;
