// import { useState, useEffect } from "react";
// import supabase from "../../../../config/supabaseClient";

// const MealTypes = () => {
//     const [mealTypes, setMealTypes] = useState([]);
//     const [filteredMealTypes, setFilteredMealTypes] = useState([]); // For filtered data
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [searchTerm, setSearchTerm] = useState(""); // For search functionality
//     const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" }); // For sorting

//     // Fetch meal types from Supabase
//     const fetchMealTypes = async () => {
//         setLoading(true);
//         setError(null); // Reset error state before fetching
//         try {
//             const { data, error } = await supabase
//                 .from("meal_type") // Ensure this matches your Supabase table name
//                 .select("*")
//                 .order("id", { ascending: true }); // Fetch meal types sorted by ID

//             if (error) throw error;

//             setMealTypes(data);
//             setFilteredMealTypes(data); // Initialize filtered data
//         } catch (err) {
//             setError("Failed to fetch meal types.");
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Handle search functionality
//     const handleSearch = (e) => {
//         const term = e.target.value.toLowerCase();
//         setSearchTerm(term);

//         if (term) {
//             const filtered = mealTypes.filter((mealType) =>
//                 mealType.name.toLowerCase().includes(term)
//             );
//             setFilteredMealTypes(filtered);
//         } else {
//             setFilteredMealTypes(mealTypes); // Reset to full list if no search term
//         }
//     };

//     // Handle sorting functionality
//     const handleSort = (key) => {
//         let direction = "asc";
//         if (sortConfig.key === key && sortConfig.direction === "asc") {
//             direction = "desc";
//         }
//         setSortConfig({ key, direction });

//         const sortedMealTypes = [...filteredMealTypes].sort((a, b) => {
//             if (a[key] < b[key]) {
//                 return direction === "asc" ? -1 : 1;
//             }
//             if (a[key] > b[key]) {
//                 return direction === "asc" ? 1 : -1;
//             }
//             return 0;
//         });
//         setFilteredMealTypes(sortedMealTypes);
//     };

//     // Fetch data on component mount
//     useEffect(() => {
//         fetchMealTypes();
//     }, []);

//     return (
//         <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
//             <h1 style={{ color: "#333" }}>Manage Meal Types</h1>
//             <p style={{ color: "#555" }}>View, create, and edit meal types.</p>

//             {/* Search and Refresh */}
//             <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
//                 <input
//                     type="text"
//                     placeholder="Search meal types..."
//                     value={searchTerm}
//                     onChange={handleSearch}
//                     style={{
//                         padding: "10px",
//                         borderRadius: "4px",
//                         border: "1px solid #ccc",
//                         width: "100%",
//                         maxWidth: "400px",
//                     }}
//                 />
//                 <button
//                     onClick={fetchMealTypes}
//                     style={{
//                         padding: "10px 20px",
//                         borderRadius: "4px",
//                         border: "none",
//                         backgroundColor: "#4CAF50",
//                         color: "white",
//                         cursor: "pointer",
//                     }}
//                 >
//                     Refresh
//                 </button>
//             </div>

//             {/* Show loading state */}
//             {loading && <p>Loading meal types...</p>}

//             {/* Show error state */}
//             {error && <p style={{ color: "red" }}>{error}</p>}

//             {/* Display meal types */}
//             {!loading && !error && filteredMealTypes.length > 0 ? (
//                 <table
//                     style={{
//                         width: "100%",
//                         borderCollapse: "collapse",
//                         boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
//                     }}
//                 >
//                     <thead>
//                         <tr style={{ backgroundColor: "#f4f4f4" }}>
//                             <th
//                                 onClick={() => handleSort("id")}
//                                 style={{
//                                     border: "1px solid #ccc",
//                                     padding: "10px",
//                                     textAlign: "left",
//                                     cursor: "pointer",
//                                 }}
//                             >
//                                 ID {sortConfig.key === "id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                             </th>
//                             <th
//                                 onClick={() => handleSort("name")}
//                                 style={{
//                                     border: "1px solid #ccc",
//                                     padding: "10px",
//                                     textAlign: "left",
//                                     cursor: "pointer",
//                                 }}
//                             >
//                                 Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
//                             </th>
//                             <th style={{ border: "1px solid #ccc", padding: "10px", textAlign: "center" }}>
//                                 Actions
//                             </th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {filteredMealTypes.map((mealType) => (
//                             <tr key={mealType.id}>
//                                 <td style={{ border: "1px solid #ccc", padding: "10px" }}>{mealType.id}</td>
//                                 <td style={{ border: "1px solid #ccc", padding: "10px" }}>{mealType.name}</td>
//                                 <td
//                                     style={{
//                                         border: "1px solid #ccc",
//                                         padding: "10px",
//                                         textAlign: "center",
//                                     }}
//                                 >
//                                     <button
//                                         onClick={() => console.log(`Edit ${mealType.id}`)}
//                                         style={{
//                                             marginRight: "10px",
//                                             padding: "8px 12px",
//                                             cursor: "pointer",
//                                             backgroundColor: "#2196F3",
//                                             color: "white",
//                                             border: "none",
//                                             borderRadius: "4px",
//                                         }}
//                                     >
//                                         Edit
//                                     </button>
//                                     <button
//                                         onClick={() => console.log(`Delete ${mealType.id}`)}
//                                         style={{
//                                             padding: "8px 12px",
//                                             cursor: "pointer",
//                                             backgroundColor: "#f44336",
//                                             color: "white",
//                                             border: "none",
//                                             borderRadius: "4px",
//                                         }}
//                                     >
//                                         Delete
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             ) : (
//                 !loading && <p>No meal types found.</p>
//             )}
//         </div>
//     );
// };

// export default MealTypes;
