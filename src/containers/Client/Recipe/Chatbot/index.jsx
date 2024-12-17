import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Import your ChatHistory and Loading components
import ChatbotHistory from "../../../../components/ChatboxHistoryDisplay";
import ChatbotLoading from "../../../../components/ChatboxLoading";

import { systemPrompt } from "./prompt";

import { useRecipeContext } from "../Contexts/RecipeContext";

// Style with Tailwind CSS or other custom styles
import "./index.css";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { applyFilters } = useRecipeContext(); // Access applyFilters from context

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

const sendMessage = async () => {
    if (userInput.trim() === "") return;

    setIsLoading(true);
    try {
      // Build the context string to send history msg to the model
      const context = chatHistory
      .map((msg) => `${msg.type === "user" ? "User:" : "Bot:"} ${msg.message}`)
      .join("\n"); // Join messages with line breaks for better readability

      // Append the system prompt and user input
      const prompt = `${systemPrompt}\n${context}\nUser: ${userInput}`;

      console.log("Sending prompt to API:", prompt);

      // Send the concatenated string to the Gemini model
      const result = await model.generateContent(prompt);

      // const result = await model.generateContent(systemPrompt + userInput);

        // const response = await result.response;
      // const responseText = response.text();
      const response = result.response.text();

        // setChatHistory((prev) => [
        //     ...prev,
        //     { type: "user", message: userInput },
        //     { type: "bot", message: response.text() },
        // ]);
        // console.log("Response:", response.text());
        // Parse response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch {
        parsedResponse = null;
      }

      // If intent is "filter", apply filters dynamically
      if (parsedResponse?.intent === "filter") {
        
        const { category, cookTime, tags, equipment } = parsedResponse.filters;

        setIsLoading(true); // Set loading while filters apply
        // Apply filters to context
        applyFilters({
          category: category || null,
          cookTime: cookTime || null,
          tags: tags || [],
          equipment: equipment || [],
        });

        setIsLoading(false);

        setChatHistory((prev) => [
          ...prev,
          { type: "user", message: userInput },
          { type: "bot", message: "Filters applied based on your request!" },
        ]);
        
      } else {
        // If not a filter, add a normal chatbot response
        setChatHistory((prev) => [
          ...prev,
          { type: "user", message: userInput },
          { type: "bot", message: response },
        ]);
      }
    } catch (error) {
        console.error("Error sending message:", error);
        if (error.response) {
            console.error("Error details:", error.response.data);
        }
        alert("An error occurred. Please check your API key or try again.");
    } finally {
        setUserInput("");
        setIsLoading(false);
    }
};


  // Clear chat history
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
