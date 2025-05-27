# CompareIt - Price Comparison Website

## Overview
CompareIt is a web-based price comparison platform that allows users to compare product prices across different retailers and manage wishlists. The application is built using HTML, CSS, JavaScript, and PHP with a phpMyAdmin database.

## Project Structure
```
WAP/                   # Main application directory
├── CSS/               # Stylesheets for all pages
├── HTML/              # HTML files for all pages
│   ├── adminProducts.html    # Admin product management
│   ├── adminStockists.html   # Admin retailer management
│   ├── userManagement.html   # Admin user management
│   └── homepage.html         # Landing page
├── JS/                # JavaScript files for client-side functionality
│   ├── adminProducts.js     # Admin product management
│   └── adminStockists.js    # Admin retailer management
├── PHP/               # PHP files for server-side operations
│   ├── api.php       # Main API endpoint for database operations
│   ├── adminAPI.php  # Admin-specific API endpoints
│   └── Config.php    # Database configuration
├── note.txt           # Project notes
└── u23554607_priceCheck.sql  # Database schema and initial data (if present)
```

## Prerequisites
- Web server (Apache/Nginx) with PHP 7.4 or higher
- phpMyAdmin (for database management)
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Access to Wheatley server (for UP students)

## Setup Instructions

### 1. Database Setup
1. Access phpMyAdmin through your web browser:
   - Local: `http://localhost/phpmyadmin`
   - Wheatley: `https://wheatley.cs.up.ac.za/phpmyadmin`
2. Create a new database named `u23554607_priceCheck`
3. Select the newly created database
4. Click on the "Import" tab
5. Click "Choose File" and select the `u23554607_priceCheck.sql` file
6. Click "Go" to import the database schema and initial data

### 2. Configuration
1. Navigate to the `WAP/PHP` directory
2. Open `Config.php` and update the database credentials:
   ```php
   define('DB_HOST', 'your_host');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'u23554607_priceCheck');
   ```

### 3. File Upload to Wheatley Server
1. Use FileZilla or similar FTP client to connect to the Wheatley server
2. Upload the entire `WAP` folder to your server directory: `/COS216/COS 221/WAP/`
3. Ensure file permissions are set correctly (typically 755 for directories, 644 for files)
4. Verify all folders (CSS, HTML, JS, PHP) are properly uploaded

## Running the Application

### On Wheatley Server
1. Ensure all files are uploaded to the correct directory structure on Wheatley
2. Access the application through your Wheatley URL:
   ```
   https://wheatley.cs.up.ac.za/~u23554607/COS216/COS%20221/WAP/HTML/homepage.html
   ```
   Note: The space in "COS 221" is encoded as "%20" in the URL

### Local Development (Optional)
1. Start your web server (XAMPP/WAMP/MAMP)
2. Place the `WAP` folder in your web server's document root
3. Ensure phpMyAdmin is running
4. Open your web browser and navigate to:
   ```
   http://localhost/WAP/HTML/homepage.html
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
- `WAP/HTML/homepage.html` - Landing page
- `WAP/HTML/products.html` - Product listing page
- `WAP/HTML/view.html` - Detailed product view
- `WAP/HTML/wishlist.html` - User wishlist
- `WAP/HTML/adminProducts.html` - Admin product management interface
- `WAP/HTML/adminStockists.html` - Admin retailer management interface
- `WAP/HTML/userManagement.html` - Admin user management interface
- `WAP/PHP/api.php` - Main API endpoints for user operations
- `WAP/PHP/adminAPI.php` - API endpoints for admin operations
- `WAP/PHP/Config.php` - Database configuration file
- `WAP/JS/view.js` - Product view functionality
- `WAP/JS/products.js` - Product listing functionality
- `WAP/JS/wishlist.js` - Wishlist management
- `WAP/JS/adminProducts.js` - Admin product management
- `WAP/JS/adminStockists.js` - Admin retailer management
- `WAP/CSS/view.css` - Product view styles
- `WAP/CSS/products.css` - Product listing styles
- `WAP/CSS/admin.css` - Admin panel styles

## Accessing Your Application

### Primary URL Structure
Your application is hosted at:
```
https://wheatley.cs.up.ac.za/~u23554607/COS216/COS%20221/WAP/
```

### Common Pages
- **Homepage**: `/WAP/HTML/homepage.html`
- **Products**: `/WAP/HTML/products.html`  
- **Admin Panel**: `/WAP/HTML/adminProducts.html`
- **User Management**: `/WAP/HTML/userManagement.html`

## Troubleshooting

### Common Issues
1. **404 Errors on Wheatley**
   - Verify the correct path structure: `/COS216/COS 221/WAP/`
   - Check that all files are uploaded to the correct directories
   - Ensure file permissions are set correctly (755 for directories, 644 for files)

2. **Styles Not Loading**
   - Verify CSS files are in the `WAP/CSS/` directory
   - Check file paths in HTML files are relative to the WAP directory
   - Ensure file permissions allow reading

3. **Database Connection Issues**
   - Verify database credentials in `WAP/PHP/Config.php`
   - Ensure phpMyAdmin is accessible on Wheatley
   - Check database user permissions in phpMyAdmin
   - Verify database exists and is properly imported

4. **JavaScript Functionality Issues**
   - Check browser console for JavaScript errors
   - Verify JS files are in the `WAP/JS/` directory
   - Ensure API endpoint URLs in JavaScript files match your server paths
   - Check CORS headers are properly configured

5. **Admin Access Issues**
   - Verify admin user credentials in the database
   - Check admin API endpoint permissions
   - Ensure proper session management
   - Verify database admin privileges

### File Path Issues
Remember that your project structure includes spaces in folder names (`COS 221`), which need to be handled properly:
- In file paths, ensure proper encoding
- When referencing files, use relative paths from the WAP directory

## Support
For technical support or questions related to this project, please contact the development team or refer to your course materials.
