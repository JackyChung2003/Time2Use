import { FaTachometerAlt, FaClipboardList, FaQrcode, FaBookOpen, FaUser } from "react-icons/fa";

const navBarItems = [
  {
    title: "Dashboard",
    link: "/dashboard",
    icon: <FaTachometerAlt />, // Dashboard icon
  },
  {
    title: "Inventory",
    link: "/inventory",
    icon: <FaClipboardList />, // Clipboard/List icon
  },
  {
    title: "Scan QR",
    link: "/scan",
    icon: <FaQrcode />, // QR code icon
  },
  {
    title: "Recipe",
    link: "/recipe",
    icon: <FaBookOpen />, // Open book icon
  },
  {
    title: "Profile",
    link: "/user",
    icon: <FaUser />, // User icon
  },
];

export default navBarItems;
