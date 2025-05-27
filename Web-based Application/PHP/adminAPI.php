<?php
header('Content-Type: application/json');
session_set_cookie_params(0);
session_start();

include 'Config.php';

// Get API key from headers (frontend should send it)
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? null;

// Check API key for all requests except login
if (!isset($_GET['action']) || $_GET['action'] !== 'login') {
    if (!$apiKey) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'API key missing']);
        exit;
    }

    // Validate API key against database
    $stmt = $conn->prepare("SELECT UserID, Email, FirstName, LastName, Type FROM User WHERE Apikey = ?");
    $stmt->bind_param("s", $apiKey);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid API key']);
        exit;
    }

    $user = $result->fetch_assoc();
    if ($user['Type'] !== 'Admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
}


$conn->set_charset('utf8');

// Check if it's a preflight request (for CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get input data based on method
$input = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    $input = [];
}

// Merge all possible input sources
$data = array_merge($_GET, $_POST, $input);

// Check admin authentication for all requests except login
if (!isset($data['action']) || $data['action'] !== 'login') {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
}

// Get action
$action = $data['action'] ?? '';

// Route the request
switch ($action) {
    // Authentication
    case 'login':
        handleLogin($conn, $data);
        break;
    case 'check_session':
        checkSession();
        break;
    case 'logout':
        handleLogout();
        break;
        
    // User management
    case 'get_users':
        getUsers($conn, $data);
        break;
    case 'get_user':
        getUser($conn, $data);
        break;
    case 'add_edit_user':
        addEditUser($conn, $data);
        break;
    case 'delete_user':
        deleteUser($conn, $data);
        break;
        
    // Product management
    case 'get_products':
        getProducts($conn, $data);
        break;
    case 'get_product':
        getProduct($conn, $data);
        break;
    case 'add_edit_product':
        addEditProduct($conn, $data);
        break;
    case 'delete_product':
        deleteProduct($conn, $data);
        break;
    case 'get_categories':
        getCategories($conn);
        break;
    case 'get_brands':
        getBrands($conn);
        break;
        
    // Stockist management
    case 'get_stockists':
        getStockists($conn, $data);
        break;
    case 'get_stockist':
        getStockist($conn, $data);
        break;
    case 'add_edit_stockist':
        addEditStockist($conn, $data);
        break;
    case 'delete_stockist':
        deleteStockist($conn, $data);
        break;
        
    // Dashboard stats
    case 'get_dashboard_stats':
        getDashboardStats($conn);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function handleLogin($conn, $data) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        return;
    }
    
    // Query the database for admin user
    $stmt = $conn->prepare("SELECT * FROM User WHERE Email = ? AND Type = 'Admin'");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        
        // Verify the password with the stored salt
        $hashedPassword = hash('sha512', $password . $user['Salt']);
        $storedPassword = $user['PasswordHash'];
        
        if ($hashedPassword === $storedPassword) {
            // Authentication successful
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_id'] = $user['UserID'];
            $_SESSION['admin_email'] = $user['Email'];
            $_SESSION['admin_name'] = $user['FirstName'] . ' ' . $user['LastName'];

            error_log(print_r($_SESSION, true)); // Log session variables
            
            echo json_encode([
                'success' => true, 
                'message' => 'Login successful',
                'name' => $_SESSION['admin_name']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    }
}

function checkSession() {
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in']) {
        echo json_encode([
            'logged_in' => true,
            'name' => $_SESSION['admin_name'] ?? 'Admin'
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
}

function handleLogout() {
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

function getUsers($conn, $data) {
    $page = isset($data['page']) ? max(1, (int)$data['page']) : 1;
    $limit = 10;
    $offset = ($page - 1) * $limit;
    $search = $data['search'] ?? '';
    
    $query = "SELECT UserID, FirstName, LastName, Email, Type, DateJoined FROM User";
    $countQuery = "SELECT COUNT(*) as total FROM User";
    $params = [];
    $types = '';
    
    if ($search) {
        $searchTerm = "%$search%";
        $query .= " WHERE (FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ?)";
        $countQuery .= " WHERE (FirstName LIKE ? OR LastName LIKE ? OR Email LIKE ?)";
        $params = array_fill(0, 3, $searchTerm);
        $types = 'sss';
    }
    
    $query .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    
    // Get users
    $stmt = $conn->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $users = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get total count
    $countStmt = $conn->prepare($countQuery);
    if ($search) {
        $countStmt->bind_param($types, ...array_fill(0, 3, $searchTerm));
    }
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $total = $countResult->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'users' => $users,
        'total' => $total,
        'pages' => ceil($total / $limit),
        'page' => $page
    ]);
}

function getUser($conn, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        return;
    }
    
    $stmt = $conn->prepare("SELECT UserID, FirstName, LastName, Email, Type FROM User WHERE UserID = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if ($user) {
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }
}

function addEditUser($conn, $data) {
    $id = $data['id'] ?? null;
    $firstName = trim($data['firstName'] ?? '');
    $lastName = trim($data['lastName'] ?? '');
    $email = trim($data['email'] ?? '');
    $type = $data['type'] ?? '';
    $password = $data['password'] ?? null;
    
    // Validate
    if (empty($firstName) || empty($lastName) || empty($email) || empty($type)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        return;
    }
    
    if ($id) {
        // Update existing user
        if ($password) {
            $salt = bin2hex(random_bytes(10));
            $hashed = hash('sha512', $password . $salt);
            $stmt = $conn->prepare("UPDATE User SET FirstName=?, LastName=?, Email=?, Type=?, PasswordHash=?, Salt=? WHERE UserID=?");
            $stmt->bind_param("ssssssi", $firstName, $lastName, $email, $type, $hashed, $salt, $id);
        } else {
            $stmt = $conn->prepare("UPDATE User SET FirstName=?, LastName=?, Email=?, Type=? WHERE UserID=?");
            $stmt->bind_param("ssssi", $firstName, $lastName, $email, $type, $id);
        }
    } else {
        // Add new user
        if (empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Password is required for new users']);
            return;
        }
        
        // Check if email already exists
        $checkStmt = $conn->prepare("SELECT UserID FROM User WHERE Email = ?");
        $checkStmt->bind_param("s", $email);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            return;
        }
        
        $salt = bin2hex(random_bytes(10));
        $hashed = hash('sha512', $password . $salt);
        $apiKey = bin2hex(random_bytes(16));
        $stmt = $conn->prepare("INSERT INTO User (FirstName, LastName, Email, PasswordHash, Type, Salt, Apikey, ThemeID) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
        $stmt->bind_param("sssssss", $firstName, $lastName, $email, $hashed, $type, $salt, $apiKey);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User saved successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function deleteUser($conn, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID is required']);
        return;
    }
    
    // Prevent deleting yourself
    if ($id == ($_SESSION['admin_id'] ?? 0)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'You cannot delete your own account']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM User WHERE UserID = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function getProducts($conn, $data) {
    $page = isset($data['page']) ? max(1, (int)$data['page']) : 1;
    $limit = 10;
    $offset = ($page - 1) * $limit;
    $search = $data['search'] ?? '';
    
    $query = "SELECT p.ProductID, p.Name, p.Description, b.Name as BrandName, c.Name as CategoryName 
              FROM Product p
              JOIN Brand b ON p.BrandID = b.BrandID
              JOIN Category c ON p.CategoryID = c.CategoryID";
    $countQuery = "SELECT COUNT(*) as total FROM Product p";
    $params = [];
    $types = '';
    
    if ($search) {
        $searchTerm = "%$search%";
        $query .= " WHERE p.Name LIKE ? OR p.Description LIKE ? OR b.Name LIKE ?";
        $countQuery .= " WHERE p.Name LIKE ? OR p.Description LIKE ? OR b.Name LIKE ?";
        $params = array_fill(0, 3, $searchTerm);
        $types = 'sss';
    }
    
    $query .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    
    // Get products
    $stmt = $conn->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $products = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get total count
    $countStmt = $conn->prepare($countQuery);
    if ($search) {
        $countStmt->bind_param($types, ...array_fill(0, 3, $searchTerm));
    }
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $total = $countResult->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'products' => $products,
        'total' => $total,
        'pages' => ceil($total / $limit),
        'page' => $page
    ]);
}

function getProduct($conn, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID is required']);
        return;
    }
    
    $stmt = $conn->prepare("SELECT p.*, b.Name as BrandName, c.Name as CategoryName 
                           FROM Product p
                           JOIN Brand b ON p.BrandID = b.BrandID
                           JOIN Category c ON p.CategoryID = c.CategoryID
                           WHERE p.ProductID = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $product = $result->fetch_assoc();
    
    if ($product) {
        // Get images for this product
        $imageStmt = $conn->prepare("SELECT ImageID, ImageURL, Caption FROM Image WHERE ProductID = ?");
        $imageStmt->bind_param("i", $id);
        $imageStmt->execute();
        $imageResult = $imageStmt->get_result();
        $images = $imageResult->fetch_all(MYSQLI_ASSOC);
        
        $product['images'] = $images;
        echo json_encode(['success' => true, 'product' => $product]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Product not found']);
    }
}

function addEditProduct($conn, $data) {
    $id = $data['id'] ?? null;
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    $specifications = trim($data['specifications'] ?? '');
    $brandId = (int)($data['brandId'] ?? 0);
    $categoryId = (int)($data['categoryId'] ?? 0);
    
    // Validate
    if (empty($name) || empty($description) || $brandId <= 0 || $categoryId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields except specifications are required']);
        return;
    }
    
    if ($id) {
        // Update existing product
        $stmt = $conn->prepare("UPDATE Product SET Name=?, Description=?, Specifications=?, BrandID=?, CategoryID=? WHERE ProductID=?");
        $stmt->bind_param("ssssii", $name, $description, $specifications, $brandId, $categoryId, $id);
    } else {
        // Add new product
        $stmt = $conn->prepare("INSERT INTO Product (Name, Description, Specifications, BrandID, CategoryID) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssii", $name, $description, $specifications, $brandId, $categoryId);
    }
    
    if ($stmt->execute()) {
        $productId = $id ? $id : $stmt->insert_id;
        
        // Handle image uploads if any
        if (!empty($_FILES['images'])) {
            // This is a simplified example - you'd need to implement proper file upload handling
            foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
                if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                    $imageName = basename($_FILES['images']['name'][$key]);
                    $targetPath = "../uploads/" . $imageName;
                    
                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $insertStmt = $conn->prepare("INSERT INTO Image (ImageURL, ProductID) VALUES (?, ?)");
                        $insertStmt->bind_param("si", $targetPath, $productId);
                        $insertStmt->execute();
                    }
                }
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Product saved successfully', 'productId' => $productId]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function deleteProduct($conn, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Product ID is required']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM Product WHERE ProductID = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function getCategories($conn) {
    $result = $conn->query("SELECT CategoryID, Name FROM Category ORDER BY Name");
    $categories = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'categories' => $categories]);
}

function getBrands($conn) {
    $result = $conn->query("SELECT BrandID, Name FROM Brand ORDER BY Name");
    $brands = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'brands' => $brands]);
}

function getStockists($conn, $data) {
    $page = isset($data['page']) ? max(1, (int)$data['page']) : 1;
    $limit = 10;
    $offset = ($page - 1) * $limit;
    $search = $data['search'] ?? '';
    
    $query = "SELECT RetailerID, Name, Website, LogoURL FROM Retailer";
    $countQuery = "SELECT COUNT(*) as total FROM Retailer";
    $params = [];
    $types = '';
    
    if ($search) {
        $searchTerm = "%$search%";
        $query .= " WHERE Name LIKE ? OR Website LIKE ?";
        $countQuery .= " WHERE Name LIKE ? OR Website LIKE ?";
        $params = array_fill(0, 2, $searchTerm);
        $types = 'ss';
    }
    
    $query .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';
    
    // Get stockists
    $stmt = $conn->prepare($query);
    if ($params) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $stockists = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get total count
    $countStmt = $conn->prepare($countQuery);
    if ($search) {
        $countStmt->bind_param($types, ...array_fill(0, 2, $searchTerm));
    }
    $countStmt->execute();
    $countResult = $countStmt->get_result();
    $total = $countResult->fetch_assoc()['total'];
    
    echo json_encode([
        'success' => true,
        'stockists' => $stockists,
        'total' => $total,
        'pages' => ceil($total / $limit),
        'page' => $page
    ]);
}

function getStockist($conn, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Stockist ID is required']);
        return;
    }
    
    $stmt = $conn->prepare("SELECT * FROM Retailer WHERE RetailerID = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $stockist = $result->fetch_assoc();
    
    if ($stockist) {
        echo json_encode(['success' => true, 'stockist' => $stockist]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Stockist not found']);
    }
}

function addEditStockist($conn, $data) {
    $id = $data['id'] ?? null;
    $name = trim($data['name'] ?? '');
    $website = trim($data['website'] ?? '');
    $logoUrl = trim($data['logoUrl'] ?? '');
    
    // Validate
    if (empty($name) || empty($website)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Name and website are required']);
        return;
    }
    
    if (!filter_var($website, FILTER_VALIDATE_URL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid website URL']);
        return;
    }
    
    if ($id) {
        // Update existing stockist
        $stmt = $conn->prepare("UPDATE Retailer SET Name=?, Website=?, LogoURL=? WHERE RetailerID=?");
        $stmt->bind_param("sssi", $name, $website, $logoUrl, $id);
    } else {
        // Add new stockist
        $stmt = $conn->prepare("INSERT INTO Retailer (Name, Website, LogoURL) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $name, $website, $logoUrl);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Stockist saved successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function deleteStockist($conn, $data) {
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Stockist ID is required']);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM Retailer WHERE RetailerID = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Stockist deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
    }
}

function getDashboardStats($conn) {
    // Get user count
    $userResult = $conn->query("SELECT COUNT(*) as userCount FROM User");
    $userCount = $userResult->fetch_assoc()['userCount'];
    
    // Get product count
    $productResult = $conn->query("SELECT COUNT(*) as productCount FROM Product");
    $productCount = $productResult->fetch_assoc()['productCount'];
    
    // Get stockist count
    $stockistResult = $conn->query("SELECT COUNT(*) as stockistCount FROM Retailer");
    $stockistCount = $stockistResult->fetch_assoc()['stockistCount'];
    
    // Get review count
    $reviewResult = $conn->query("SELECT COUNT(*) as reviewCount FROM Review");
    $reviewCount = $reviewResult->fetch_assoc()['reviewCount'];
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'userCount' => $userCount,
            'productCount' => $productCount,
            'stockistCount' => $stockistCount,
            'reviewCount' => $reviewCount
        ]
    ]);
}