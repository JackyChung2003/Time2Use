// import { useEffect, useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import supabase from './config/supabaseClient'

// function App() {
//   const [count, setCount] = useState(0)
//   console.log(supabase)

//   const login = async() => {
//     await supabase.auth.signInWithOAuth({
//       provider: 'github',
//     })
//   }

//   useEffect(() => {
//     const session = supabase.auth.session()
//     console.log(session)
//   }
//   )
//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//       <button onClick={login}>Login with Github</button>
//     </>
//   )
// }

// export default App

// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './components/Login';
import Login from './containers/Authentication/Login/index';
import Signup from './containers/Authentication/Registration';

import supabase from './config/supabaseClient';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './containers/Dashboard';

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Default Route Logic */}
                <Route
                    path="/"
                    element={
                        supabase.auth.getUser() ? (
                            <Navigate to="/dashboard" />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                
                {/* Fallback for unmatched routes */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
};

export default App;
