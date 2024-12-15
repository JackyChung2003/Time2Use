import axios from 'axios';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta2';
const MODEL_NAME = 'models/chat-bison-001'; // Example model name (replace if different)

export const getChatResponse = async (messages) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Update the env variable

    if (!apiKey) {
        console.error('Generative Language API key is missing. Ensure it is set in the .env file.');
        throw new Error('API key is missing');
    }

    // Convert messages to the format required by Gemini API
    const formattedMessages = messages.map((msg) => ({
        author: msg.role === 'user' ? 'user' : 'bot',
        content: msg.content,
    }));

    try {
        const response = await axios.post(
            `${BASE_URL}/${MODEL_NAME}:generateMessage`, // Update endpoint
            {
                prompt: {
                    messages: formattedMessages, // Gemini requires a `messages` array
                },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                params: {
                    key: apiKey, // Pass API key as query parameter
                },
            }
        );

        if (response.data?.candidates?.[0]?.content) {
            return response.data.candidates[0].content; // Return the response content
        } else {
            console.error('Invalid API response format:', response.data);
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        if (error.response) {
            console.error('API Error Response:', error.response.data);
            throw new Error(
                `API Error: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}`
            );
        } else {
            console.error('Network/Unknown Error:', error.message);
            throw error;
        }
    }
};
