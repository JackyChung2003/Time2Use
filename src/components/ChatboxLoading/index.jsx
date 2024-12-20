import PropTypes from 'prop-types';
import './index.css';
const ChatbotLoading = ({ isLoading }) => {
  if (!isLoading) return null;
  return <div className="loading">Loading...</div>;
}

ChatbotLoading.propTypes = {
  isLoading: PropTypes.bool.isRequired,
};

export default ChatbotLoading;
