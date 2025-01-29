import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import './App.css';

Modal.setAppElement('#root');

function App() {
  const [users, setUsers] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', department: '' });
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [totalPages, setTotalPages] = useState(0); // Total number of pages
  
  const usersPerPage = 10; // Number of users to fetch per page

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up the event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch users when online
  useEffect(() => {
    if (isOffline) {
      setError("You are offline. Some actions may not work.");
      return;
    }

    axios.get(`https://jsonplaceholder.typicode.com/users?_page=${currentPage}&_limit=${usersPerPage}`)
      .then(response => {
        const userData = response.data.map(user => ({
          id: user.id,
          firstName: user.name.split(' ')[0] || '',
          lastName: user.name.split(' ')[1] || '',
          email: user.email,
          department: 'IT'
        }));
        setUsers(userData);
        // Calculate total number of pages (assuming the API supports the total count)
        const totalCount = response.headers['x-total-count'];
        setTotalPages(Math.ceil(totalCount / usersPerPage));
        setError(null);
      })
      .catch(() => {
        setError("Failed to load users. Please try again later.");
      });
  }, [isOffline, currentPage]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = () => {
    if (isOffline) {
      alert("You are offline. Cannot add a new user.");
      return;
    }
    setModalIsOpen(true);
    setEditMode(false);
    setFormData({ firstName: '', lastName: '', email: '', department: '' });
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const addUser = () => {
    if (isOffline) {
      alert("You are offline. Cannot add a new user.");
      return;
    }
  
    // Generate a unique ID (greater than any existing one)
    const newId = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
  
    const newUser = { id: newId, ...formData };
  
    axios.post('https://jsonplaceholder.typicode.com/users', newUser)
      .then(response => {
        setUsers([...users, { ...response.data, id: newId }]); // Ensure unique ID
        closeModal();
      })
      .catch(() => {
        setError("Failed to add user. Please try again.");
      });
  };
  

  const handleEdit = (user) => {
    if (isOffline) {
      alert("You are offline. Cannot edit users.");
      return;
    }

    setEditMode(true);
    setEditUserId(user.id);
    setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, department: user.department });
    setModalIsOpen(true);
  };

  const updateUser = () => {
    if (isOffline) {
      alert("You are offline. Cannot update users.");
      return;
    }

    const updatedUser = { ...formData, id: editUserId };

    axios.put(`https://jsonplaceholder.typicode.com/users/${editUserId}`, updatedUser)
      .then(response => {
        setUsers(users.map(user => (user.id === editUserId ? response.data : user)));
        setEditMode(false);
        closeModal();
      })
      .catch(() => {
        setError("Failed to update user. Please try again.");
      });
  };

  const deleteUser = (id) => {
    if (isOffline) {
      alert("You are offline. Cannot delete users.");
      return;
    }

    axios.delete(`https://jsonplaceholder.typicode.com/users/${id}`)
      .then(() => {
        setUsers(users.filter(user => user.id !== id));
      })
      .catch(() => {
        setError("Failed to delete user. Please try again.");
      });
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container">
      <h1>User Management Dashboard</h1>

      {isOffline && <p className="offline-warning">⚠️ You are offline. Some actions may not work.</p>}
      {error && <p className="error">{error}</p>}

      <button className="add-user-btn" onClick={openModal}>+ Add User</button>

      <h2>User List</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.firstName}</td>
              <td>{user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.department}</td>
              <td>
                <button className="edit" onClick={() => handleEdit(user)}>Edit</button>
                <button className="delete" onClick={() => deleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span>{currentPage} of {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {/* Modal for Adding/Editing Users */}
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal">
        <h2>{editMode ? 'Edit User' : 'Add User'}</h2>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleInputChange}
          required
        />
        <div className="modal-buttons">
          <button className="save" onClick={editMode ? updateUser : addUser}>
            {editMode ? 'Update' : 'Add'}
          </button>
          <button className="cancel" onClick={closeModal}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
