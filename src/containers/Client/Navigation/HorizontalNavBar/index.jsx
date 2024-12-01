import { Link, NavLink } from "react-router-dom"; // Use NavLink instead of Link
// import { FaBars } from "react-icons/fa";
// import logoNameImage from "../../../assets/images/logo-name.png";
import logoPNGImage from "../../../../assets/images/Time2Use-logo.png";
import navBarItems from "../navBarItems";
import "./index.css";

const HorizontalNavbar = () => {
  return (
    <nav>
      <Link to="/" className="link">
        <img src={logoPNGImage} alt="Time2Use Logo" className="logo-icon" />
        {/* <img src={logoPNGImage} alt="Time2Use Name" className="logo-name" /> */}
        Time2Use
      </Link>
      <div className="menu-items">
        {navBarItems.map((item, index) => (
          <NavLink
            className={({ isActive }) => (isActive ? "link active" : "link")}
            to={item.link}
            key={index}
          >
            {item.title}
          </NavLink>
        ))}
      </div>
      <div className="login-button-mobile-hidden">
        <div className="icons">
          <a
            href="https://github.com/JackyChung2003/CAT304-G30"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="github-icon icon-tabler icon-tabler-brand-github"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="#000"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"></path>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default HorizontalNavbar;
