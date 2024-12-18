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
  const { tags, filters, applyFilters, fetchRecipes } = useRecipeContext();

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
//     if (userInput.trim() === "") return;

//     setIsLoading(true);
//     try {
//       // Build the context string to send history msg to the model
//       const context = chatHistory
//       .map((msg) => `${msg.type === "user" ? "User:" : "Bot:"} ${msg.message}`)
//       .join("\n"); // Join messages with line breaks for better readability

//       // Append the system prompt and user input
//       const prompt = `${systemPrompt}\n${context}\nUser: ${userInput}`;

//       // console.log("Sending prompt to API:", prompt);

//       // Send the concatenated string to the Gemini model
//       const result = await model.generateContent(prompt);
//       const response = result.response.text();

//       // console.log("Raw Response:", response);
//       let parsedResponse;
//       try {
//         // Clean up the response to remove Markdown block syntax
//         const cleanedResponse = response
//           .replace(/```json/g, "") // Remove ```json
//           .replace(/```/g, "");    // Remove closing ```
      
//         // console.log("Cleaned Response:", cleanedResponse);
      
//         // Parse the cleaned response
//         parsedResponse = JSON.parse(cleanedResponse);
//       } catch (error) {
//         console.error("Failed to parse JSON:", error);
//         parsedResponse = null;
//       }
      
//       // console.log("Parsed Response:", parsedResponse);

//       // If intent is "filter", apply filters dynamically
//       if (parsedResponse?.intent === "filter") {
        
//         // const { category, cookTime, tags, equipment } = parsedResponse.filters;
//         const { category, tags, equipment, cookTime, ingredients } = parsedResponse.filters;

//         // console.log("Parsed Filters from API:", parsedResponse.filters);

//         applyFilters({
//           categories: category ? [category] : [],
//           tags: tags || [],
//           equipment: equipment || [],
//           cookTime: cookTime || null,
//           ingredients: ingredients || [],
//       });

//       await fetchRecipes(); // Ensure recipes are updated

//         // setIsLoading(false);

//         setChatHistory((prev) => [
//           ...prev,
//           { type: "user", message: userInput },
//           { type: "bot", message: "Filters applied based on your request!" },
//         ]);
        
//       } else {
//         // console.log("API Response Text:", response);
//         // If not a filter, add a normal chatbot response
//         setChatHistory((prev) => [
//           ...prev,
//           { type: "user", message: userInput },
//           { type: "bot", message: response },
//         ]);
//       }
//     } catch (error) {
//         console.error("Error sending message:", error);
//         if (error.response) {
//             console.error("Error details:", error.response.data);
//         }
//         alert("An error occurred. Please check your API key or try again.");
//     } finally {
//         setUserInput("");
//         setIsLoading(false);
//     }
// };

const sendMessage = async () => {
  if (userInput.trim() === "") return;

  setIsLoading(true);
  try {
    if (userInput.toLowerCase().includes("apply")) {
      const tagMatch = userInput.match(/apply\s+(\w+)/i);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : null;

      if (tagName) {
        const matchingTag = tags.find((tag) => tag.name.toLowerCase() === tagName);

        if (matchingTag) {
          applyFilters({
            tags: [...filters.tags, matchingTag.name], // Use tag name
          });

          await fetchRecipes();
          setChatHistory((prev) => [
            ...prev,
            { type: "user", message: userInput },
            { type: "bot", message: `Filters applied: Showing recipes tagged with '${matchingTag.name}'.` },
          ]);
        } else {
          setChatHistory((prev) => [
            ...prev,
            { type: "user", message: userInput },
            { type: "bot", message: `Tag '${tagName}' not found. Please try again.` },
          ]);
        }
      }
    } else if (userInput.toLowerCase().includes("clear")) {
      applyFilters({ tags: [] });
      await fetchRecipes();
      setChatHistory((prev) => [
        ...prev,
        { type: "user", message: userInput },
        { type: "bot", message: "Filters cleared. Showing all recipes!" },
      ]);
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
  } finally {
    setUserInput("");
    setIsLoading(false);
  }
};

  // Clear chat history
  
//   const sendMessage = async () => {
//     if (userInput.trim() === "") return;

//     setIsLoading(true);
//     try {
//         console.log("User Input:", userInput);

//         // Check if the user input is for applying or clearing filters
//         if (userInput.toLowerCase().includes("apply")) {
//             // Apply dummy filters
//             applyFilters({
//                 categories: [],
//                 tags: ["spicy"],
//                 equipment: [],
//                 cookTime: null,
//                 ingredients: [],
//             });
            

//             console.log("Filters applied!");
//             await fetchRecipes(); // Fetch recipes with the applied filters

//             // Update chat history
//             setChatHistory((prev) => [
//                 ...prev,
//                 { type: "user", message: userInput },
//                 { type: "bot", message: "Filters applied: Desserts, quick & easy, oven, under 30 mins, with chocolate & sugar!" },
//             ]);
//         } else if (userInput.toLowerCase().includes("clear")) {
//             // Clear all filters
//             applyFilters({
//                 categories: [],
//                 tags: [],
//                 equipment: [],
//                 cookTime: null,
//                 ingredients: [],
//             });

//             console.log("Filters cleared!");
//             await fetchRecipes(); // Fetch all recipes after clearing filters

//             // Update chat history
//             setChatHistory((prev) => [
//                 ...prev,
//                 { type: "user", message: userInput },
//                 { type: "bot", message: "Filters cleared. Showing all recipes!" },
//             ]);
//         } else {
//             // Default response for other messages
//             setChatHistory((prev) => [
//                 ...prev,
//                 { type: "user", message: userInput },
//                 { type: "bot", message: "I didn’t understand. Try 'apply' or 'clear'!" },
//             ]);
//         }
//     } catch (error) {
//         console.error("Error in sendMessage:", error);
//         alert("An error occurred. Please try again.");
//     } finally {
//         setUserInput("");
//         setIsLoading(false);
//     }
// };


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
