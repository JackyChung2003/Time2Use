import { FaTachometerAlt, FaUser, FaCog, FaClipboardList } from "react-icons/fa";

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
    {
        title: "Reports",
        icon: <FaClipboardList />,
        dropdown: true, // Indicates dropdown
        items: [
            {
                title: "Monthly Reports",
                link: "/admin/reports/monthly",
            },
            {
                title: "Annual Reports",
                link: "/admin/reports/annual",
            },
            {
                title: "Custom Reports",
                link: "/admin/reports/custom",
            },
        ],
    },
];

export default adminNavBarItems;
