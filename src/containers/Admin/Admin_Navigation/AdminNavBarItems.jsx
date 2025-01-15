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
        title: "Manage Inventory",
        link: "/admin/inventories",
        icon: <FaUser />,
    },
    {
        title: "Manage Ingredient",
        icon: <FaUser />,
        dropdown: true, // Indicates dropdown
        items: [
            {
                title: "Ingredients Category",
                dropdown: true,
                items: [
                    {
                        title: "View All Category",
                        link: "/admin/ingredientscat/",
                        icon: <FaListAlt />,
                    },
                ],
            },
            {
                title: "Ingredients",
                dropdown: true,
                items: [
                    {
                        title: "View All Ingredient",
                        link: "/admin/ingredients",
                        icon: <FaListAlt />,
                    },
                ],
            }
        ]
    },
    {
        title: "Manage Expiry Date",
        link: "/admin/expirydate",
        icon: <FaUser />,
    },
    {
        title: "Manage Unit",
        link: "/admin/units",
        icon: <FaUser />,
    },
    {
        title: "Manage Unit Inv",
        link: "/admin/unitinv",
        icon: <FaUser />,
    },
    {
        title: "Settings",
        link: "/admin/settings",
        icon: <FaCog />,
    },
    {
        title: "Recipes",
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
        ],
    },
];

export default adminNavBarItems;
