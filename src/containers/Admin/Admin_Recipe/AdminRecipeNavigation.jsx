// import { Routes, Route, Navigate } from "react-router-dom";

// // Import all components
// import AdminRecipeDashboard from "./Dashboard";
// import Recipes from "./Recipes";
// import ViewRecipes from "./Recipes/View";
// import CreateRecipe from "./Recipes/Create";
// import Categories from "./Categories";
// import CreateCategory from "./Categories/Create";
// import Tags from "./Tags";
// import CreateTag from "./Tags/Create";
// import Equipment from "./Equipment";
// import CreateEquipment from "./Equipment/Create";
// import MealTypes from "./MealTypes";
// import CreateMealType from "./MealTypes/Create";

// const AdminRecipeNavigation = () => {
//     return (
//         <div style={{ position: "relative" }}>
//             <Routes>
//                 {/* Default route within Admin Recipe */}
//                 <Route path="/" element={<Navigate to="dashboard" />} />

//                 {/* Admin Recipe Dashboard */}
//                 <Route path="dashboard" element={<AdminRecipeDashboard />} />

//                 {/* Recipes */}
//                 <Route path="recipes" element={<Recipes />} />
//                 <Route path="recipes/view" element={<ViewRecipes />} />
//                 <Route path="recipes/create" element={<CreateRecipe />} />

//                 {/* Categories */}
//                 <Route path="categories" element={<Categories />} />
//                 <Route path="categories/create" element={<CreateCategory />} />

//                 {/* Tags */}
//                 <Route path="tags" element={<Tags />} />
//                 <Route path="tags/create" element={<CreateTag />} />

//                 {/* Equipment */}
//                 <Route path="equipment" element={<Equipment />} />
//                 <Route path="equipment/create" element={<CreateEquipment />} />

//                 {/* Meal Types */}
//                 <Route path="meal-types" element={<MealTypes />} />
//                 <Route path="meal-types/create" element={<CreateMealType />} />

//                 {/* Fallback */}
//                 <Route path="*" element={<Navigate to="dashboard" />} />
//             </Routes>
//         </div>
//     );
// };

// export default AdminRecipeNavigation;

import { Routes, Route, Navigate } from "react-router-dom";

// Import all components based on your folder structure
// import AdminRecipeDashboard from "../Admin_Recipe/Dashboard";
import AdminRecipeDashboard from ".";

import Recipes from "../Admin_Recipe/Recipes";
import CreateRecipe from "../Admin_Recipe/Recipes/Create";
import EditRecipe from "../Admin_Recipe/Recipes/Edit";
import RecipeDetail from "./Recipes/View";

import Categories from "../Admin_Recipe/Categories";
import CreateCategory from "../Admin_Recipe/Categories/Create";
import EditCategory from "../Admin_Recipe/Categories/Edit";

import Tags from "../Admin_Recipe/Tags";
import CreateTag from "../Admin_Recipe/Tags/Create";
import EditTag from "../Admin_Recipe/Tags/Edit";

import Equipment from "../Admin_Recipe/Equipment";
import CreateEquipment from "../Admin_Recipe/Equipment/Create";
import EditEquipment from "../Admin_Recipe/Equipment/Edit";

// import MealTypes from "../Admin_Recipe/MealTypes";
// import CreateMealType from "../Admin_Recipe/MealTypes/Create";

const AdminRecipeNavigation = () => {
    return (
        <div style={{ position: "relative" }}>
            <Routes>
                {/* Default route within Admin Recipe */}
                {/* <Route path="/" element={<Navigate to="dashboard" />} /> */}
                {/* <Route path="/" element={<AdminRecipeDashboard />} /> */}
                <Route path="/" element={<Navigate to="dashboard" />} />

                {/* Admin Recipe Dashboard */}
                <Route path="dashboard" element={<AdminRecipeDashboard />} />

                {/* Recipes */}
                <Route path="recipes" element={<Recipes />} />
                <Route path="recipes/create" element={<CreateRecipe />} />
                <Route path="recipes/view/:id" element={<RecipeDetail />} /> 
                <Route path="recipes/edit/:id" element={<EditRecipe  />} />

                {/* Categories */}
                <Route path="categories" element={<Categories />} />
                <Route path="categories/create" element={<CreateCategory />} />
                <Route path="categories/edit/:id" element={<EditCategory />} />

                {/* Tags */}
                <Route path="tags" element={<Tags />} />
                <Route path="tags/create" element={<CreateTag />} />
                <Route path="tags/edit/:id" element={<EditTag />} />

                {/* Equipment */}
                <Route path="equipment" element={<Equipment />} />
                <Route path="equipment/create" element={<CreateEquipment />} />
                <Route path="equipment/edit/:id" element={<EditEquipment />} />

                {/* Meal Types */}
                {/* <Route path="meal-types" element={<MealTypes />} />
                <Route path="meal-types/create" element={<CreateMealType />} /> */}

                {/* Fallback */}
                <Route path="*" element={<Navigate to="dashboard" />} />
            </Routes>
        </div>
    );
};

export default AdminRecipeNavigation;
