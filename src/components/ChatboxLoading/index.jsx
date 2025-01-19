import PropTypes from 'prop-types';
import './index.css';
import TypingLoader from '../Loader/TypingLoader';

const ChatbotLoading = ({ isLoading }) => {
  if (!isLoading) return null;
  return  <TypingLoader />;
}

ChatbotLoading.propTypes = {
  isLoading: PropTypes.bool.isRequired,
};

export default ChatbotLoading;
