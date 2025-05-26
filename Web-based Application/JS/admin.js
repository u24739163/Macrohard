// Common admin functions
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is logged in
    checkAdminSession();
    
    // Load admin name if element exists
    if (document.getElementById('admin-name')) {
        loadAdminInfo();
    }
    
    // Load dashboard stats if on dashboard
    if (document.getElementById('total-users')) {
        loadDashboardStats();
    }
});

function checkAdminSession() {
    fetch('../API/adminAPI.php?action=check_session')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = '../login.php';
            }
        })
        .catch(error => {
            console.error('Error checking session:', error);
        });
}

function loadAdminInfo() {
    // This would normally come from session, but we'll simulate it
    const adminName = document.getElementById('admin-name');
    if (adminName) {
        adminName.textContent = 'Admin'; // This would be replaced with actual admin name from session
    }
}

function loadDashboardStats() {
    fetch('../API/adminAPI.php?action=get_dashboard_stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('total-users').textContent = data.stats.userCount;
                document.getElementById('total-products').textContent = data.stats.productCount;
                document.getElementById('total-stockists').textContent = data.stats.stockistCount;
                document.getElementById('total-reviews').textContent = data.stats.reviewCount;
            }
        })
        .catch(error => {
            console.error('Error loading dashboard stats:', error);
        });
}

// Logout function
document.querySelectorAll('.logout').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        fetch('../API/adminAPI.php?action=logout')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '../login.php';
                }
            })
            .catch(error => {
                console.error('Error during logout:', error);
            });
    });
});

// Helper function for API calls
function makeApiCall(action, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    
    if (data) {
        const params = new URLSearchParams();
        for (const key in data) {
            params.append(key, data[key]);
        }
        options.body = params;
    }
    
    return fetch(`../API/adminAPI.php?action=${action}`, options)
        .then(response => response.json());
}