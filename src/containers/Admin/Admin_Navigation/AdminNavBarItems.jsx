import { FaTachometerAlt, FaUser, FaCog } from "react-icons/fa";

const adminNavBarItems = [
    {
        title: "Admin Dashboard",
        link: "/admin/dashboard",
        icon: <FaTachometerAlt />,
    },
    {
        title: "Manage Users",
        link: "/admin/users",
        icon: <FaUser />,
    },
    {
        title: "Settings",
        link: "/admin/settings",
        icon: <FaCog />,
    },
];

export default adminNavBarItems;
