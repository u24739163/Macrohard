<?php
/**
 * view.php - Product View Page (Frontend)
 * This is YOUR part - it displays the product details page
 */

// Start session and include database configuration
session_start();
require_once 'Config.php';

// Get product ID from URL parameter
$product_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Database connection
try {
    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Check connection
    if ($mysqli->connect_error) {
        throw new Exception("Connection failed: " . $mysqli->connect_error);
    }
    
    // Fetch product details
    $stmt = $mysqli->prepare("SELECT * FROM products WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $mysqli->error);
    }
    
    $stmt->bind_param("i", $product_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $product = $result->fetch_assoc();
    $stmt->close();
    
    if ($product) {
        // Fetch product prices from different retailers
        $stmt = $mysqli->prepare("SELECT * FROM product_prices WHERE product_id = ? ORDER BY price ASC");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $mysqli->error);
        }
        
        $stmt->bind_param("i", $product_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $prices = [];
        while ($row = $result->fetch_assoc()) {
            $prices[] = $row;
        }
        $stmt->close();
        
        // Fetch product reviews
        $stmt = $mysqli->prepare("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $mysqli->error);
        }
        
        $stmt->bind_param("i", $product_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $reviews = [];
        while ($row = $result->fetch_assoc()) {
            $reviews[] = $row;
        }
        $stmt->close();
        
        // Calculate average rating
        $avg_rating = 0;
        if (count($reviews) > 0) {
            $total_rating = array_sum(array_column($reviews, 'rating'));
            $avg_rating = round($total_rating / count($reviews), 1);
        }
    }
    
    // Close the connection
    $mysqli->close();
    
} catch(Exception $e) {
    // Handle database errors
    error_log("Database Error: " . $e->getMessage());
    $error_message = "An error occurred while fetching product details.";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($product['name'] ?? 'Product Details'); ?> - CompareIt</title>
    <link rel="stylesheet" href="view.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">
                <a href="homepage.php">CompareIt</a>
            </div>
            <nav>
                <ul>
                    <li><a href="homepage.php">Home</a></li>
                    <li><a href="products.php">Products</a></li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <li><a href="logout.php">Logout</a></li>
                        <li><a href="wishlist.php">Wishlist</a></li>
                    <?php else: ?>
                        <li><a href="login.php">Login</a></li>
                        <li><a href="register.php">Register</a></li>
                    <?php endif; ?>
                    <li><a href="about.php">About</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="container">
        <?php if (isset($error_message)): ?>
            <div class="error-message">
                <?php echo htmlspecialchars($error_message); ?>
            </div>
        <?php elseif ($product): ?>
            <div class="breadcrumb">
                <a href="homepage.php">Home</a> > 
                <a href="products.php?category=<?php echo urlencode($product['category']); ?>"><?php echo htmlspecialchars($product['category']); ?></a> > 
                <span><?php echo htmlspecialchars($product['name']); ?></span>
            </div>

            <div class="main-product-layout">
                <div class="left-section">
                    <section class="product-details">
                        <div class="product-gallery">
                            <img src="<?php echo htmlspecialchars($product['main_image']); ?>" 
                                 alt="<?php echo htmlspecialchars($product['name']); ?>" 
                                 id="main-product-image" 
                                 class="main-image">
                            <div class="thumbnails" id="image-thumbnails">
                                <?php
                                $images = json_decode($product['additional_images'] ?? '[]', true);
                                foreach ($images as $image): ?>
                                    <img src="<?php echo htmlspecialchars($image); ?>" 
                                         alt="Product thumbnail" 
                                         class="thumbnail">
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <div class="product-info">
                            <h1><?php echo htmlspecialchars($product['name']); ?></h1>
                            
                            <div class="product-rating">
                                <div class="stars">
                                    <?php
                                    $full_stars = floor($avg_rating);
                                    $half_star = $avg_rating - $full_stars >= 0.5;
                                    
                                    for ($i = 0; $i < $full_stars; $i++) {
                                        echo '<i class="fas fa-star"></i>';
                                    }
                                    if ($half_star) {
                                        echo '<i class="fas fa-star-half-alt"></i>';
                                    }
                                    for ($i = $full_stars + ($half_star ? 1 : 0); $i < 5; $i++) {
                                        echo '<i class="far fa-star"></i>';
                                    }
                                    ?>
                                </div>
                                <span>(<?php echo count($reviews); ?> reviews)</span>
                            </div>
                            
                            <div class="product-brand">
                                Brand: <a href="brand.php?id=<?php echo $product['brand_id']; ?>"><?php echo htmlspecialchars($product['brand']); ?></a>
                            </div>
                            
                            <?php if (!empty($prices)): ?>
                                <div class="price-range">
                                    Price Range: 
                                    <span>R<?php echo number_format(min(array_column($prices, 'price')), 2); ?></span> - 
                                    <span>R<?php echo number_format(max(array_column($prices, 'price')), 2); ?></span>
                                </div>
                                
                                <div class="best-price">
                                    <div class="best-price-label">Best Price:</div>
                                    <div class="best-price-value">R<?php echo number_format($prices[0]['price'], 2); ?></div>
                                    <div class="best-price-retailer">at <?php echo htmlspecialchars($prices[0]['retailer']); ?></div>
                                    <a href="<?php echo htmlspecialchars($prices[0]['url']); ?>" 
                                       class="btn primary-btn" 
                                       target="_blank">Buy Now</a>
                                </div>
                            <?php endif; ?>
                            
                            <?php if (isset($_SESSION['user_id'])): ?>
                                <button id="add-to-wishlist" 
                                        class="btn secondary-btn" 
                                        data-product-id="<?php echo $product_id; ?>">
                                    <i class="fas fa-heart"></i> Add to Wishlist
                                </button>
                            <?php endif; ?>
                        </div>
                    </section>

                    <section class="product-tabs">
                        <div class="tabs-container">
                            <div class="tabs-header">
                                <button class="tab-button active" data-tab="overview">Overview</button>
                                <button class="tab-button" data-tab="specifications">Specifications</button>
                                <button class="tab-button" data-tab="reviews">Reviews</button>
                            </div>

                            <div class="tabs-content">
                                <div class="tab-content active" id="overview-tab">
                                    <h2>Product Description</h2>
                                    <div class="product-description">
                                        <?php echo nl2br(htmlspecialchars($product['description'])); ?>
                                    </div>
                                </div>

                                <div class="tab-content" id="specifications-tab">
                                    <h2>Technical Specifications</h2>
                                    <div class="specs-container">
                                        <?php
                                        $specs = json_decode($product['specifications'] ?? '{}', true);
                                        foreach ($specs as $category => $items): ?>
                                            <div class="specs-group">
                                                <h3><?php echo htmlspecialchars($category); ?></h3>
                                                <ul class="specs-list">
                                                    <?php foreach ($items as $label => $value): ?>
                                                        <li>
                                                            <span class="specs-label"><?php echo htmlspecialchars($label); ?>:</span>
                                                            <?php echo htmlspecialchars($value); ?>
                                                        </li>
                                                    <?php endforeach; ?>
                                                </ul>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>

                                <div class="tab-content" id="reviews-tab">
                                    <h2>Customer Reviews</h2>
                                    
                                    <div class="review-summary">
                                        <div class="average-rating">
                                            <div class="rating-number"><?php echo number_format($avg_rating, 1); ?></div>
                                            <div class="rating-stars">
                                                <?php
                                                for ($i = 0; $i < floor($avg_rating); $i++) {
                                                    echo '<i class="fas fa-star"></i>';
                                                }
                                                if ($avg_rating - floor($avg_rating) >= 0.5) {
                                                    echo '<i class="fas fa-star-half-alt"></i>';
                                                }
                                                ?>
                                            </div>
                                            <div><?php echo count($reviews); ?> reviews</div>
                                        </div>
                                        
                                        <div class="rating-distribution">
                                            <?php
                                            $rating_counts = array_count_values(array_column($reviews, 'rating'));
                                            for ($i = 5; $i >= 1; $i--) {
                                                $count = $rating_counts[$i] ?? 0;
                                                $percentage = count($reviews) > 0 ? ($count / count($reviews)) * 100 : 0;
                                                ?>
                                                <div class="rating-bar">
                                                    <div class="rating-label"><?php echo $i; ?> Star</div>
                                                    <div class="progress">
                                                        <div class="progress-bar" style="width: <?php echo $percentage; ?>%"></div>
                                                    </div>
                                                    <div class="rating-percentage"><?php echo round($percentage); ?>%</div>
                                                </div>
                                            <?php } ?>
                                        </div>
                                    </div>

                                    <?php if (isset($_SESSION['user_id'])): ?>
                                        <div class="write-review">
                                            <h3>Write a Review</h3>
                                            <form id="review-form">
                                                <input type="hidden" name="product_id" value="<?php echo $product_id; ?>">
                                                <div class="rating-input">
                                                    <?php for ($i = 5; $i >= 1; $i--): ?>
                                                        <input type="radio" name="rating" value="<?php echo $i; ?>" id="star<?php echo $i; ?>" required>
                                                        <label for="star<?php echo $i; ?>"><i class="fas fa-star"></i></label>
                                                    <?php endfor; ?>
                                                </div>
                                                <!-- Remove title field if it exists -->
                                                <textarea name="comment" placeholder="Write your review here..." required></textarea>
                                                <select name="retailer" required>
                                                    <option value="">Select Retailer</option>
                                                    <?php foreach ($prices as $price): ?>
                                                        <option value="<?php echo $price['retailer_id']; ?>"><?php echo htmlspecialchars($price['retailer']); ?></option>
                                                    <?php endforeach; ?>
                                                </select>
                                                <button type="submit" class="btn primary-btn">Submit Review</button>
                                            </form>
                                        </div>
                                    <?php endif; ?>

                                    <div class="reviews-list">
                                        <?php foreach ($reviews as $review): ?>
                                            <div class="review-item">
                                                <div class="review-header">
                                                    <div class="reviewer-name"><?php echo htmlspecialchars($review['user_name']); ?></div>
                                                    <div class="review-date"><?php echo date('F j, Y', strtotime($review['created_at'])); ?></div>
                                                </div>
                                                <div class="review-rating">
                                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                                        <i class="fas fa-star<?php echo $i <= $review['rating'] ? '' : '-o'; ?>"></i>
                                                    <?php endfor; ?>
                                                </div>
                                                <div class="review-content">
                                                    <?php echo nl2br(htmlspecialchars($review['review_text'])); ?>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="right-section">
                    <div class="price-comparison-sidebar">
                        <div class="sidebar-header">
                            <h2><i class="fas fa-tags"></i> Compare Prices</h2>
                            <p class="sidebar-subtitle">Find the best deals from trusted retailers</p>
                        </div>
                        
                        <div class="retailers-list">
                            <?php foreach ($prices as $index => $price): ?>
                            <div class="retailer-card <?php echo $index === 0 ? 'best-deal' : ''; ?>">
                                <?php if ($index === 0): ?>
                                    <div class="best-deal-badge">Best Deal</div>
                                <?php endif; ?>
                                
                                <div class="retailer-header">
                                    <img src="<?php echo htmlspecialchars($price['logo_url']); ?>" 
                                         alt="<?php echo htmlspecialchars($price['retailer']); ?>" 
                                         class="retailer-logo">
                                </div>
                                
                                <div class="retailer-price">
                                    <span class="price">R<?php echo number_format($price['price'], 2); ?></span>
                                    <span class="shipping">
                                        <?php echo $price['shipping_cost'] > 0 
                                            ? 'R' . number_format($price['shipping_cost'], 2) . ' Shipping' 
                                            : 'Free Shipping'; ?>
                                    </span>
                                </div>
                                
                                <div class="retailer-availability <?php echo $price['availability'] === 'in_stock' ? 'in-stock' : 'out-of-stock'; ?>">
                                    <i class="fas fa-<?php echo $price['availability'] === 'in_stock' ? 'check' : 'times'; ?>-circle"></i>
                                    <?php echo $price['availability'] === 'in_stock' ? 'In Stock' : 'Out of Stock'; ?>
                                </div>
                                
                                <div class="retailer-actions">
                                    <a href="<?php echo htmlspecialchars($price['url']); ?>" 
                                       class="btn primary-btn retailer-btn" target="_blank">View Deal</a>
                                    <button class="btn-icon wishlist-retailer" 
                                            data-retailer-id="<?php echo $price['id']; ?>" 
                                            title="Add to Wishlist">
                                        <i class="far fa-heart"></i>
                                    </button>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <div class="price-alert">
                            <h3><i class="fas fa-bell"></i> Price Alert</h3>
                            <p>Get notified when the price drops below:</p>
                            <div class="price-alert-input">
                                <input type="number" placeholder="R<?php echo number_format($product['pricing']['min_price'] * 0.9, 0); ?>" 
                                       class="alert-price-input">
                                <button class="btn secondary-btn">Set Alert</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="error-message">
                Product not found.
            </div>
        <?php endif; ?>
    </main>

    <footer>
        <!-- Your footer here -->
    </footer>

    <script>
        // Pass PHP data to JavaScript
        const productData = <?php echo json_encode($product); ?>;
        const productId = <?php echo $product_id; ?>;
    </script>
    <script src="view.js"></script>
</body>
</html>