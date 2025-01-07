import { useNavigate } from 'react-router-dom';
import './index.css'; // Import your global CSS

const BackButton = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1); // Navigate to the last page in the browser's history
    };

    return (
        <button onClick={handleBack} className="back-button">
            ← Back
        </button>
    );
};

export default BackButton;
