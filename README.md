# CompareIt - Price Comparison Website

## Overview
CompareIt is a web-based price comparison platform that allows users to compare product prices across different retailers and manage wishlists. The application is built using HTML, CSS, JavaScript, and PHP with a phpMyAdmin database.

## Project Structure
```
├── HTML/               # HTML files for all pages
│   ├── adminProducts.html    # Admin product management
│   ├── adminStockists.html   # Admin retailer management
│   └── userManagement.html   # Admin user management
├── CSS/               # Stylesheets for all pages
├── JS/                # JavaScript files for client-side functionality
│   ├── adminProducts.js     # Admin product management
│   └── adminStockists.js    # Admin retailer management
├── PHP/               # PHP files for server-side operations
│   ├── api.php       # Main API endpoint for database operations
│   ├── adminAPI.php  # Admin-specific API endpoints
└── u23554607_priceCheck.sql  # Database schema and initial data
```

## Prerequisites
- Web server (Apache/Nginx) with PHP 7.4 or higher
- phpMyAdmin (for database management)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Setup Instructions

### 1. Database Setup
1. Access phpMyAdmin through your web browser (typically at `http://localhost/phpmyadmin`)
2. Create a new database named `u23554607_priceCheck`
3. Select the newly created database
4. Click on the "Import" tab
5. Click "Choose File" and select the `u23554607_priceCheck.sql` file
6. Click "Go" to import the database schema and initial data

### 2. Configuration
1. Navigate to the `PHP` directory
2. Open `Config.php` and update the database credentials:
   ```php
   define('DB_HOST', 'your_host');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'u23554607_priceCheck');
   ```

### 3. Web Server Setup
1. Place all project files in your web server's document root directory
2. Ensure the web server has read permissions for all files
3. Ensure the web server has write permissions for any directories that need to store user data

## Running the Application

### Local Development
1. Start your web server (XAMPP/WAMP/MAMP)
2. Ensure phpMyAdmin is running
3. Open your web browser and navigate to:
   ```
   http://localhost/your-project-directory/HTML/homepage.html
   ```

### On Wheatley Server
1. Upload all project files to your Wheatley server directory
2. Ensure file permissions are set correctly
3. Access the application through your Wheatley URL:
   ```
   https://wheatley.up.ac.za/~u23554607/your-project-directory/HTML/homepage.html
   ```

## Features
- User authentication (login/register)
- Product browsing and searching
- Price comparison across retailers
- Wishlist management
- Product reviews and ratings
- Admin panel with:
  - Product management (add, edit, delete products)
  - Retailer management (add, edit, delete retailers)
  - User management (view, manage user accounts)

## File Descriptions

### Key Files
- `HTML/homepage.html` - Landing page
- `HTML/products.html` - Product listing page
- `HTML/view.html` - Detailed product view
- `HTML/wishlist.html` - User wishlist
- `HTML/adminProducts.html` - Admin product management interface
- `HTML/adminStockists.html` - Admin retailer management interface
- `HTML/userManagement.html` - Admin user management interface
- `PHP/api.php` - Main API endpoints for user operations
- `PHP/adminAPI.php` - API endpoints for admin operations
- `JS/view.js` - Product view functionality
- `JS/products.js` - Product listing functionality
- `JS/wishlist.js` - Wishlist management
- `JS/adminProducts.js` - Admin product management
- `JS/adminStockists.js` - Admin retailer management
- `CSS/view.css` - Product view styles
- `CSS/products.css` - Product listing styles
- `CSS/admin.css` - Admin panel styles

## Troubleshooting

### Common Issues
1. **Styles Not Loading**
   - Verify file permissions
   - Check file paths in HTML files
   - Ensure CSS files are in the correct directory

2. **Database Connection Issues**
   - Verify database credentials in `Config.php`
   - Ensure phpMyAdmin is running
   - Check database user permissions in phpMyAdmin
   - Verify database exists in phpMyAdmin

3. **API Errors**
   - Check PHP error logs
   - Verify API endpoint URLs in JavaScript files
   - Ensure proper CORS headers are set
   - For admin features, verify admin privileges

4. **Admin Access Issues**
   - Verify admin user credentials
   - Check admin API endpoint permissions
   - Ensure proper session management
   - Verify database admin privileges

## Support
For technical support or questions, please contact the development team.
