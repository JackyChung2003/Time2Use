import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch users from auth.users
      const { data: users, error: usersError } = await supabase
        .from('profile')
        .select('username, user');
  
      if (usersError) throw usersError;
  
      // Fetch roles from user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role_id');
  
      if (rolesError) throw rolesError;
  
      // Merge the data
      const usersWithRoles = users.map(user => {
        const userRole = roles.find(role => role.user_id === user.user); // Match by ID
        return {
          username: user.username,
          id: user.user,
          role: userRole
            ? userRole.role_id === 1
              ? 'Admin'
              : 'Client'
            : 'Unknown' // Default if no role is found
        };
      });
  
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users with roles:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) throw error;
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error.message);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    
    <div className="admin-users">
      <div className="admin-users-header">
        <h2>Manage Users</h2>
        <button 
          className="create-user-btn"
          onClick={() => navigate('/admin/users/create')}
        >
          Create User
        </button>
      </div>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>User ID</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.id}</td>
                <td>{user.role}</td>
                <td>
                  <div className="action-buttons">
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
