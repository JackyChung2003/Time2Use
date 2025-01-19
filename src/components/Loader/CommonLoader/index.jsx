import "./index.css";

const CommonLoader = () => {
  return (
    <div className="loader-container">
      <div className="loader">
        <span className="hour"></span>
        <span className="min"></span>
        <span className="circle"></span>
      </div>
    </div>
  );
};

export default CommonLoader;
