import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from 'remark-gfm'
import "./index.css";

const ChatbotHistory = ({ chatHistory }) => {
  const historyRef = useRef(null);

  // Scroll to the bottom whenever chatHistory changes
  useEffect(() => {
    historyRef.current?.scrollTo({
      top: historyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

  return (
    // <div className="chat-history">
    <div className="chat-history" ref={historyRef}>
      {chatHistory.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.type === "user" ? "user" : "bot"}`}
        >
          {/* <strong>{msg.type === "user" ? "You" : "Bot"}:</strong> {msg.message} */}
          {/* <ReactMarkdown className="line-formating" remarkPlugins={[remarkGfm]} >{msg.message}</ReactMarkdown> */}

          <ReactMarkdown
            className="markdown-output"
            remarkPlugins={[remarkGfm]} // Includes better Markdown features
          >
            {msg.message}
          </ReactMarkdown>

          {/* <ReactMarkdown remarkPlugins={[remarkBreaks]}>{msg.message}</ReactMarkdown> */}
        </div>
      ))}
    </div>
  );
};
ChatbotHistory.propTypes = {
  chatHistory: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default ChatbotHistory;
