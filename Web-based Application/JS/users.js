document.addEventListener('DOMContentLoaded', function() {
    // Check admin session first
    checkAdminSession().then(() => {
        // Initialize the page
        initUserManagement();
    }).catch(error => {
        console.error('Session check failed:', error);
        window.location.href = '../HTML/login.html'; // Redirect to login if not authenticated
    });
});

// Check if admin is logged in
function checkAdminSession() {
    return fetch('../API/adminAPI.php?action=check_session')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                throw new Error('Not logged in');
            }
            // Set admin name if available
            if (data.name) {
                document.getElementById('admin-name').textContent = data.name;
            }
        });
}

// Initialize user management page
function initUserManagement() {
    // Load first page of users
    loadUsers(1);
    
    // Set up event listeners
    document.getElementById('add-user-btn').addEventListener('click', showAddUserModal);
    document.getElementById('search-user-btn').addEventListener('click', searchUsers);
    document.getElementById('user-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
    document.getElementById('prev-user-page').addEventListener('click', prevUserPage);
    document.getElementById('next-user-page').addEventListener('click', nextUserPage);
    
    // Modal close button
    document.querySelector('#user-modal .close').addEventListener('click', closeUserModal);
    
    // Form submission
    document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('user-modal')) {
            closeUserModal();
        }
    });
}

// Global variables for pagination
let currentUserPage = 1;
let totalUserPages = 1;
let currentUserSearch = '';

// Load users from API
function loadUsers(page, search = '') {
    currentUserPage = page;
    currentUserSearch = search;
    
    let url = `../API/adminAPI.php?action=get_users&page=${page}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderUsersTable(data.users);
                totalUserPages = data.pages;
                updatePaginationInfo();
            } else {
                showError('Failed to load users: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error loading users:', error);
            showError('Failed to load users. Please try again.');
        });
}

// Render users in the table
function renderUsersTable(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="no-data">No users found</td>';
        tbody.appendChild(tr);
        return;
    }
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.UserID}</td>
            <td>${user.FirstName}</td>
            <td>${user.LastName}</td>
            <td>${user.Email}</td>
            <td>${user.Type}</td>
            <td>${new Date(user.DateJoined).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn-edit" data-id="${user.UserID}">Edit</button>
                <button class="btn-delete" data-id="${user.UserID}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            editUser(userId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            deleteUser(userId);
        });
    });
}

// Update pagination information
function updatePaginationInfo() {
    document.getElementById('user-page-info').textContent = `Page ${currentUserPage} of ${totalUserPages}`;
    
    // Disable prev/next buttons when appropriate
    document.getElementById('prev-user-page').disabled = currentUserPage <= 1;
    document.getElementById('next-user-page').disabled = currentUserPage >= totalUserPages;
}

// Pagination functions
function prevUserPage() {
    if (currentUserPage > 1) {
        loadUsers(currentUserPage - 1, currentUserSearch);
    }
}

function nextUserPage() {
    if (currentUserPage < totalUserPages) {
        loadUsers(currentUserPage + 1, currentUserSearch);
    }
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.trim();
    loadUsers(1, searchTerm);
}

// Show add user modal
function showAddUserModal() {
    const modal = document.getElementById('user-modal');
    document.getElementById('user-modal-title').textContent = 'Add New User';
    document.getElementById('user-id').value = '';
    document.getElementById('user-form').reset();
    modal.style.display = 'block';
}

// Show edit user modal
function editUser(userId) {
    fetch(`../API/adminAPI.php?action=get_user&id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                const modal = document.getElementById('user-modal');
                
                document.getElementById('user-modal-title').textContent = 'Edit User';
                document.getElementById('user-id').value = user.UserID;
                document.getElementById('first-name').value = user.FirstName;
                document.getElementById('last-name').value = user.LastName;
                document.getElementById('email').value = user.Email;
                document.getElementById('type').value = user.Type;
                document.getElementById('password').value = '';
                
                modal.style.display = 'block';
            } else {
                showError('Failed to load user: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error loading user:', error);
            showError('Failed to load user. Please try again.');
        });
}

// Close user modal
function closeUserModal() {
    document.getElementById('user-modal').style.display = 'none';
}

// Handle form submission
function handleUserFormSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('user-id').value;
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const type = document.getElementById('type').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!firstName || !lastName || !email || !type) {
        showError('All fields except password are required');
        return;
    }
    
    // For new users, password is required
    if (!userId && !password) {
        showError('Password is required for new users');
        return;
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('action', 'add_edit_user');
    if (userId) formData.append('id', userId);
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('type', type);
    if (password) formData.append('password', password);
    
    // Send to server
    fetch('../API/adminAPI.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeUserModal();
            loadUsers(currentUserPage, currentUserSearch);
            showSuccess('User saved successfully');
        } else {
            showError('Failed to save user: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error saving user:', error);
        showError('Failed to save user. Please try again.');
    });
}

// Delete user
function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'delete_user');
    formData.append('id', userId);
    
    fetch('../API/adminAPI.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadUsers(currentUserPage, currentUserSearch);
            showSuccess('User deleted successfully');
        } else {
            showError('Failed to delete user: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        showError('Failed to delete user. Please try again.');
    });
}

// Show success message
function showSuccess(message) {
    // You can implement a more sophisticated notification system
    alert('Success: ' + message);
}

// Show error message
function showError(message) {
    // You can implement a more sophisticated notification system
    alert('Error: ' + message);
}