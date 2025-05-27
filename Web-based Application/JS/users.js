document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initUserManagement();
});

// Global variables for pagination and state
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let isProcessing = false;

// Initialize user management page
function initUserManagement() {
    // Check admin session first
    // checkAdminSession()
    //     .then(() => {
            // Load first page of users
            loadUsers(currentPage);
            
            // Set up event listeners
            setupEventListeners();
        // })
        // .catch(error => {
        //     console.error('Session check failed:', error);
        //     redirectToLogin();
        // });
}

// Check if admin is logged in
function checkAdminSession() {
    return fetch('../PHP/adminAPI.php?action=check_session')
        .then(handleResponse)
        .then(data => {
            if (!data.logged_in) {
                throw new Error('Not logged in');
            }
            // Set admin name if available
            if (data.name) {
                document.getElementById('admin-name').textContent = data.name;
            }
            return data;
        });
}

// Set up all event listeners
function setupEventListeners() {
    // Buttons
    document.getElementById('add-user-btn').addEventListener('click', showAddUserModal);
    document.getElementById('search-user-btn').addEventListener('click', searchUsers);
    document.getElementById('prev-user-page').addEventListener('click', prevPage);
    document.getElementById('next-user-page').addEventListener('click', nextPage);
    
    // Search input
    document.getElementById('user-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchUsers();
        }
    });
    
    // Modal
    document.querySelector('#user-modal .close').addEventListener('click', closeUserModal);
    document.getElementById('user-form').addEventListener('submit', handleUserFormSubmit);
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('user-modal')) {
            closeUserModal();
        }
    });
}

// Helper function for authenticated requests
function fetchWithAuth(url, options = {}) {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) {
        window.location.href = "login.html";
        return Promise.reject("No API key found");
    }

    // Add API key to headers
    const headers = new Headers(options.headers || {});
    headers.append("X-API-KEY", apiKey);
    
    return fetch(url, {
        ...options,
        headers: headers
    }).then(response => {
        // Check for 404 first
        if (response.status === 404) {
            throw new Error("API endpoint not found");
        }
        // Then check for 401
        if (response.status === 401) {
            localStorage.removeItem("apiKey");
            window.location.href = "login.html";
            throw new Error("Unauthorized");
        }
        // Then verify content is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("Response not JSON");
        }
        return response.json();
    });
}

// Example usage in loadUsers():
function loadUsers(page, search = '') {
    let url = `../PHP/adminAPI.php?action=get_users&page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    fetchWithAuth(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderUsersTable(data.users);
                currentPage = data.page;
                totalPages = data.pages;
                updatePaginationInfo();
            } else {
                showError('Failed to load users: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error("API error:", error);
            showError("Failed to load users. Please log in again.");
        })
        .finally(() => {
            isProcessing = false;
            hideLoader();
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
            <td>${escapeHtml(user.FirstName)}</td>
            <td>${escapeHtml(user.LastName)}</td>
            <td>${escapeHtml(user.Email)}</td>
            <td>${user.Type}</td>
            <td>${formatDate(user.DateJoined)}</td>
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
            confirmDeleteUser(userId);
        });
    });
}

// Update pagination information
function updatePaginationInfo() {
    document.getElementById('user-page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Disable prev/next buttons when appropriate
    document.getElementById('prev-user-page').disabled = currentPage <= 1;
    document.getElementById('next-user-page').disabled = currentPage >= totalPages;
}

// Pagination functions
function prevPage() {
    if (currentPage > 1) {
        loadUsers(currentPage - 1, currentSearch);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        loadUsers(currentPage + 1, currentSearch);
    }
}

// Search users
function searchUsers() {
    const searchTerm = document.getElementById('user-search').value.trim();
    currentSearch = searchTerm;
    loadUsers(1, searchTerm);
}

// Show add user modal
function showAddUserModal() {
    const modal = document.getElementById('user-modal');
    document.getElementById('user-modal-title').textContent = 'Add New User';
    document.getElementById('user-id').value = '';
    document.getElementById('user-form').reset();
    document.getElementById('password').required = true;
    modal.style.display = 'block';
}

// Edit user - load user data into modal
function editUser(userId) {
    if (isProcessing) return;
    isProcessing = true;
    showLoader();
    
    fetch(`../PHP/adminAPI.php?action=get_user&id=${userId}`)
        .then(handleResponse)
        .then(data => {
            if (data.success) {
                const user = data.user;
                const modal = document.getElementById('user-modal');
                
                document.getElementById('user-modal-title').textContent = 'Edit User';
                document.getElementById('user-id').value = user.UserID;
                document.getElementById('first-name').value = escapeHtml(user.FirstName);
                document.getElementById('last-name').value = escapeHtml(user.LastName);
                document.getElementById('email').value = escapeHtml(user.Email);
                document.getElementById('type').value = user.Type;
                document.getElementById('password').value = '';
                document.getElementById('password').required = false;
                
                modal.style.display = 'block';
            } else {
                showError('Failed to load user: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error loading user:', error);
            showError('Failed to load user. Please try again.');
        })
        .finally(() => {
            isProcessing = false;
            hideLoader();
        });
}

// Confirm before deleting user
function confirmDeleteUser(userId) {
    if (isProcessing) return;
    
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.');
    if (!confirmed) return;
    
    isProcessing = true;
    showLoader();
    
    const formData = new FormData();
    formData.append('action', 'delete_user');
    formData.append('id', userId);
    
    fetch('../PHP/adminAPI.php', {
        method: 'POST',
        body: formData
    })
    .then(handleResponse)
    .then(data => {
        if (data.success) {
            showSuccess('User deleted successfully');
            // Reload current page
            loadUsers(currentPage, currentSearch);
        } else {
            showError('Failed to delete user: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error deleting user:', error);
        showError('Failed to delete user. Please try again.');
    })
    .finally(() => {
        isProcessing = false;
        hideLoader();
    });
}

// Close user modal
function closeUserModal() {
    document.getElementById('user-modal').style.display = 'none';
}

// Handle form submission
function handleUserFormSubmit(e) {
    e.preventDefault();
    
    if (isProcessing) return;
    isProcessing = true;
    showLoader();
    
    const userId = document.getElementById('user-id').value;
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const type = document.getElementById('type').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!firstName || !lastName || !email || !type) {
        showError('All fields except password are required');
        isProcessing = false;
        hideLoader();
        return;
    }
    
    // For new users, password is required
    if (!userId && !password) {
        showError('Password is required for new users');
        isProcessing = false;
        hideLoader();
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
    fetch('../PHP/adminAPI.php', {
        method: 'POST',
        body: formData
    })
    .then(handleResponse)
    .then(data => {
        if (data.success) {
            closeUserModal();
            showSuccess('User saved successfully');
            loadUsers(currentPage, currentSearch);
        } else {
            showError('Failed to save user: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error saving user:', error);
        showError('Failed to save user. Please try again.');
    })
    .finally(() => {
        isProcessing = false;
        hideLoader();
    });
}

// Helper function to handle fetch responses
function handleResponse(response) {
    if (!response.ok) {
        return response.json().then(err => {
            throw new Error(err.message || 'Network response was not ok');
        });
    }
    return response.json();
}

// Helper function to show success message
function showSuccess(message) {
    // You can replace this with a more sophisticated notification system
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Helper function to show error message
function showError(message) {
    // You can replace this with a more sophisticated notification system
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Helper function to show loader
function showLoader() {
    // You can implement a loader/spinner if needed
    document.body.style.cursor = 'wait';
}

// Helper function to hide loader
function hideLoader() {
    document.body.style.cursor = 'default';
}

// Helper function to redirect to login
function redirectToLogin() {
    window.location.href = '../HTML/login.html';
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}