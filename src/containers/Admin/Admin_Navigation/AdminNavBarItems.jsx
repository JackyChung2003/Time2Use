import { 
    FaTachometerAlt, 
    FaUser, 
    FaCog, 
    FaClipboardList, 
    FaUtensils, 
    FaTags, 
    FaListAlt, 
    FaPlusCircle, 
    FaTools,
    FaThList,
} from "react-icons/fa";

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
    {
        title: "Recipe Management",
        link: "/admin/recipe-management", // Main page for Recipe Management
        icon: <FaUtensils />,
        dropdown: true, // Indicates dropdown
        items: [
            // Recipes Section
            {
                title: "Recipes",
                dropdown: true,
                items: [
                    {
                        title: "View All Recipes",
                        link: "/admin/recipe-management/recipes",
                        icon: <FaListAlt />,
                    },
                    {
                        title: "Add New Recipe",
                        link: "/admin/recipe-management/recipes/create",
                        icon: <FaPlusCircle />,
                    },
                ],
            },
            // Categories Section
            {
                title: "Categories",
                dropdown: true,
                items: [
                    {
                        title: "View Categories",
                        link: "/admin/recipe-management/categories",
                        icon: <FaThList />,
                    },
                    {
                        title: "Add New Category",
                        link: "/admin/recipe-management/categories/create",
                        icon: <FaPlusCircle />,
                    },
                ],
            },
            // Tags Section
            {
                title: "Tags",
                dropdown: true,
                items: [
                    {
                        title: "View Tags",
                        link: "/admin/recipe-management/tags",
                        icon: <FaTags />,
                    },
                    {
                        title: "Add New Tag",
                        link: "/admin/recipe-management/tags/create",
                        icon: <FaPlusCircle />,
                    },
                ],
            },
            // Equipment Section
            {
                title: "Equipment",
                dropdown: true,
                items: [
                    {
                        title: "View Equipment",
                        link: "/admin/recipe-management/equipment",
                        icon: <FaTools />,
                    },
                    {
                        title: "Add New Equipment",
                        link: "/admin/recipe-management/equipment/create",
                        icon: <FaPlusCircle />,
                    },
                ],
            },
            // Meal Types Section
            // {
            //     title: "Meal Types",
            //     dropdown: true,
            //     items: [
            //         {
            //             title: "View Meal Types",
            //             link: "/admin/recipe-management/meal-types",
            //             icon: <FaThList />,
            //         },
            //         {
            //             title: "Add New Meal Type",
            //             link: "/admin/recipe-management/meal-types/create",
            //             icon: <FaPlusCircle />,
            //         },
            //     ],
            // },
        ],
    },
];

export default adminNavBarItems;
