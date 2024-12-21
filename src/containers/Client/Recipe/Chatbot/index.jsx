import { useState } from "react";
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

  // const { applyFilters } = useRecipeContext(); // Access applyFilters from context
  // const { fetchRecipes, applyFilters } = useRecipeContext();
  // const { tags, filters, applyFilters, fetchRecipes } = useRecipeContext();
  const { tags, categories, equipment, ingredients,  filters, applyFilters, fetchRecipes } = useRecipeContext();

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

  // const sendMessage = async () => {
  //   if (userInput.trim() === "") return;

  //   setIsLoading(true);
  //   try {
  //     if (userInput.toLowerCase().includes("apply")) {
  //       const tagMatch = userInput.match(/apply\s+(\w+)/i);
  //       const tagName = tagMatch ? tagMatch[1].toLowerCase() : null;

  //       if (tagName) {
  //         const matchingTag = tags.find((tag) => tag.name.toLowerCase() === tagName);

  //         if (matchingTag) {
  //           applyFilters({
  //             tags: [...filters.tags, matchingTag.name], // Use tag name
  //           });

  //           await fetchRecipes();
  //           setChatHistory((prev) => [
  //             ...prev,
  //             { type: "user", message: userInput },
  //             { type: "bot", message: `Filters applied: Showing recipes tagged with '${matchingTag.name}'.` },
  //           ]);
  //         } else {
  //           setChatHistory((prev) => [
  //             ...prev,
  //             { type: "user", message: userInput },
  //             { type: "bot", message: `Tag '${tagName}' not found. Please try again.` },
  //           ]);
  //         }
  //       }
  //     } else if (userInput.toLowerCase().includes("clear")) {
  //       applyFilters({ tags: [] });
  //       await fetchRecipes();
  //       setChatHistory((prev) => [
  //         ...prev,
  //         { type: "user", message: userInput },
  //         { type: "bot", message: "Filters cleared. Showing all recipes!" },
  //       ]);
  //     }
  //   } catch (error) {
  //     console.error("Error in sendMessage:", error);
  //   } finally {
  //     setUserInput("");
  //     setIsLoading(false);
  //   }
  // };

  // const sendMessage = async () => {
  //   if (userInput.trim() === "") return;
  
  //   // setIsLoading(true);
  //   try {
  //     // Check and log tags availability
  //     console.log("Available tags:", tags);
  
  //     if (!tags || tags.length === 0) {
  //       console.error("Tags are not available or empty.");
  //       setChatHistory((prev) => [
  //         ...prev,
  //         { type: "user", message: userInput },
  //         { type: "bot", message: "I cannot process filters right now because no tags are available." },
  //       ]);
  //       return;
  //     }
  
  //     const normalizedInput = userInput.toLowerCase();
  //     // const matchingTag = tagKeywords.find((keyword) => normalizedInput.includes(keyword));
      
  //     // Find the matching tag based on user input
  //     const matchingTag = tags.find((tag) =>
  //       normalizedInput.includes(tag.name.toLowerCase())
  //     );

  //      // Match categories
  //     const matchingCategory = categories.find((cat) =>
  //       normalizedInput.includes(cat.name.toLowerCase())
  //     );

  //      // Match equipment
  //     const matchingEquipment = equipment.find((equip) =>
  //       normalizedInput.includes(equip.name.toLowerCase())
  //     );

  //     // Match cooking time (e.g., "under 30 minutes")
  //     const cookTimeMatch = normalizedInput.match(/under (\d+)\s*minutes/);
  //     const matchingCookTime = cookTimeMatch ? parseInt(cookTimeMatch[1]) : null;

  //     const matchingIngredients = ingredients.filter((ingredient) =>
  //       normalizedInput.includes(ingredient.name.toLowerCase())
  //     );
  
  //     // if (matchingTag) {
  //     // if (matchingCategory || matchingTag || matchingEquipment || matchingCookTime) {
  //       if (
  //         matchingCategory ||
  //         matchingTag ||
  //         matchingEquipment ||
  //         matchingCookTime ||
  //         matchingIngredients.length > 0
  //       ) {
  //       // const validTags = tags.filter(
  //       //   (tag) => tag && tag.name && tag.name.toLowerCase() === matchingTag.toLowerCase()
  //       // );
  
  //       // if (validTags.length > 0) {
  //       //   applyFilters({
  //       //     tags: [...filters.tags, ...validTags.map((tag) => tag.name)],
  //       //   });
  
  //       //   await fetchRecipes();
  //       //   setChatHistory((prev) => [
  //       //     ...prev,
  //       //     { type: "user", message: userInput },
  //       //     { type: "bot", message: `Filters applied: Showing recipes with tags: ${validTags
  //       //       .map((tag) => tag.name)
  //       //       .join(", ")}.` },
  //       //   ]);
  //       // } else {
  //       //   console.error("No matching tags found.");
  //       //   setChatHistory((prev) => [
  //       //     ...prev,
  //       //     { type: "user", message: userInput },
  //       //     { type: "bot", message: `I couldn’t find any recipes matching the tag '${matchingTag}'.` },
  //       //   ]);
  //       // }
  //       applyFilters({
  //         // tags: [...filters.tags, matchingTag.name],
  //         tags: matchingTag ? [...filters.tags, matchingTag.name] : filters.tags,
  //         categories: matchingCategory
  //           ? [...filters.categories, matchingCategory.name]
  //           : filters.categories,
  //         equipment: matchingEquipment
  //           ? [...filters.equipment, matchingEquipment.name]
  //           : filters.equipment,
  //         cookTime: matchingCookTime || filters.cookTime,
  //         ingredients: matchingIngredients.length > 0
  //           ? [...filters.ingredients, ...matchingIngredients.map((ing) => ing.name)]
  //           : filters.ingredients,
  //       });
  
  //       await fetchRecipes();

  //       const appliedFilters = [
  //         matchingCategory && `Category: ${matchingCategory.name}`,
  //         matchingTag && `Tag: ${matchingTag.name}`,
  //         matchingEquipment && `Equipment: ${matchingEquipment.name}`,
  //         matchingCookTime && `Cooking Time: Under ${matchingCookTime} minutes`,
  //         matchingIngredients.length > 0 &&
  //         `Ingredients: ${matchingIngredients.map((ing) => ing.name).join(", ")}`,
  //       ]
  //         .filter(Boolean)
  //         .join(", ");

  //       setChatHistory((prev) => [
  //         ...prev,
  //         { type: "user", message: userInput },
  //         // { type: "bot", message: `Filters applied: Showing recipes with tag '${matchingTag.name}'.` },
  //         { type: "bot", message: `Filters applied: ${appliedFilters}.` },
  //       ]);
  //     } else if (normalizedInput.includes("clear")) {
  //       // applyFilters({ tags: [] });
  //       applyFilters({
  //         categories: [],
  //         tags: [],
  //         equipment: [],
  //         cookTime: null,
  //         ingredients: [],
  //       });
  //       await fetchRecipes();
  //       setChatHistory((prev) => [
  //         ...prev,
  //         { type: "user", message: userInput },
  //         { type: "bot", message: "Filters cleared. Showing all recipes!" },
  //       ]);
  //     } else {
  //       setChatHistory((prev) => [
  //         ...prev,
  //         { type: "user", message: userInput },
  //         { type: "bot", message: "I didn’t understand that. Try asking for specific recipes, like 'I want spicy food' or 'clear filters'." },
  //       ]);
  //     }
  //   } catch (error) {
  //     console.error("Error in sendMessage:", error);
  //     alert("An error occurred. Please try again.");
  //   } finally {
  //     setUserInput("");
  //     setIsLoading(false);
  //   }
  // };

  // const sendMessage = async () => {
  //   if (userInput.trim() === "") return;

  //   setIsLoading(true);
  //   try {
  //     // Build the context string to send history messages to the model
  //     const context = chatHistory
  //       .map((msg) => `${msg.type === "user" ? "User:" : "Bot:"} ${msg.message}`)
  //       .join("\n");

  //     // Append the system prompt and user input
  //     const prompt = `${systemPrompt}\n${context}\nUser: ${userInput}`;
  //     console.log("Sending prompt to API:", prompt);

  //     // Send the concatenated string to the Gemini model
  //     const result = await model.generateContent(prompt);
  //     const response = await result.response;

  //     const interpretedText = response.text();
  //     console.log("Gemini Response:", interpretedText);

  //     // Parse the interpreted text to extract filtering criteria
  //     const intent = interpretedText.toLowerCase();
  //     const matchingTag = tags.find((tag) => intent.includes(tag.name.toLowerCase()));
  //     const matchingCategory = categories.find((cat) => intent.includes(cat.name.toLowerCase()));
  //     const matchingEquipment = equipment.find((equip) => intent.includes(equip.name.toLowerCase()));
  //     const cookTimeMatch = intent.match(/under (\d+)\s*minutes/);
  //     const matchingCookTime = cookTimeMatch ? parseInt(cookTimeMatch[1]) : null;
  //     const matchingIngredients = ingredients.filter((ingredient) =>
  //       intent.includes(ingredient.name.toLowerCase())
  //     );

  //     // Apply filters dynamically
  //     applyFilters({
  //       tags: matchingTag ? [...filters.tags, matchingTag.name] : filters.tags,
  //       categories: matchingCategory ? [...filters.categories, matchingCategory.name] : filters.categories,
  //       equipment: matchingEquipment ? [...filters.equipment, matchingEquipment.name] : filters.equipment,
  //       cookTime: matchingCookTime || filters.cookTime,
  //       ingredients: matchingIngredients.length > 0
  //         ? [...filters.ingredients, ...matchingIngredients.map((ing) => ing.name)]
  //         : filters.ingredients,
  //     });

  //     await fetchRecipes();

  //     const appliedFilters = [
  //       matchingCategory && `Category: ${matchingCategory.name}`,
  //       matchingTag && `Tag: ${matchingTag.name}`,
  //       matchingEquipment && `Equipment: ${matchingEquipment.name}`,
  //       matchingCookTime && `Cooking Time: Under ${matchingCookTime} minutes`,
  //       matchingIngredients.length > 0 &&
  //         `Ingredients: ${matchingIngredients.map((ing) => ing.name).join(", ")}`,
  //     ]
  //       .filter(Boolean)
  //       .join(", ");

  //     setChatHistory((prev) => [
  //       ...prev,
  //       { type: "user", message: userInput },
  //       { type: "bot", message: appliedFilters ? `Filters applied: ${appliedFilters}.` : response.text() },
  //     ]);
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     if (error.response) {
  //       console.error("Error details:", error.response.data);
  //     }
  //     setChatHistory((prev) => [
  //       ...prev,
  //       { type: "user", message: userInput },
  //       { type: "bot", message: "An error occurred. Please try again." },
  //     ]);
  //   } finally {
  //     setUserInput("");
  //     setIsLoading(false);
  //   }
  // };

  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    setIsLoading(true);
    try {
        // Build the context string to send history messages to the model
        const context = chatHistory
            .map((msg) => `${msg.type === "user" ? "User:" : "Bot:"} ${msg.message}`)
            .join("\n");

        // Append the system prompt and user input
        const prompt = `${systemPrompt}\n${context}\nUser: ${userInput}`;
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
