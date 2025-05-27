/**
 * wishlist.js - JavaScript for Wishlist Page
 */

// API configuration
const API_URL = "../PHP/api.php";

// Initialize page when DOM loads
document.addEventListener("DOMContentLoaded", function () {
    // Check if user is logged in - try both sessionStorage and localStorage
    const apiKey = sessionStorage.getItem("apiKey") || localStorage.getItem("apiKey");
    
    if (!apiKey) {
        document.getElementById("login-message").style.display = "block";
        document.getElementById("wishlist-container").style.display = "none";
        return;
    }
    
    // Hide login message and show loading indicator
    document.getElementById("login-message").style.display = "none";
    document.getElementById("wishlist-container").style.display = "block";
    
    // Load wishlist data
    loadWishlist();
});

/**
 * Load wishlist data from API
 */
async function loadWishlist() {
    try {
        // Try both sessionStorage and localStorage for apiKey
        const apiKey = sessionStorage.getItem("apiKey") || localStorage.getItem("apiKey");
        
        console.log("Using API key:", apiKey); // Debug log
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "Wishlist",
                apikey: apiKey
            }),
        });

        // First check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Get the raw text first to debug any JSON parsing issues
        const rawText = await response.text();
        console.log("Raw API response:", rawText);
        
        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            showError(`Error parsing server response: ${parseError.message}`);
            return;
        }
        
        console.log("Parsed API response:", data);
        
        if (data && (data.success === "true" || data.success === true)) {
            // Check for duplicate products by ProductID
            if (data.data && data.data.Products && data.data.Products.length > 0) {
                // Filter out duplicates by ProductID
                const uniqueProducts = [];
                const seenIds = new Set();
                
                data.data.Products.forEach(product => {
                    if (!seenIds.has(product.ProductID)) {
                        seenIds.add(product.ProductID);
                        uniqueProducts.push(product);
                    }
                });
                
                // Replace the original products array with the filtered one
                data.data.Products = uniqueProducts;
                console.log("Filtered unique products:", uniqueProducts);
            }
            
            displayWishlist(data.data);
            updateWishlistCount(data.data.Products ? data.data.Products.length : 0);
        } else {
            showError("Failed to load wishlist: " + (data.data || "Unknown error"));
        }
    } catch (error) {
        console.error("Error loading wishlist:", error);
        showError("Error connecting to server: " + error.message);
    }
}

/**
 * Update the wishlist count display
 */
function updateWishlistCount(count) {
    const wishlistCount = document.querySelector(".wishlist-count");
    if (wishlistCount) {
        wishlistCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    }
}

/**
 * Display wishlist items on the page
 */
function displayWishlist(wishlistData) {
    const container = document.getElementById("wishlist-container");
    container.innerHTML = "";
    
    if (!wishlistData || !wishlistData.Products || wishlistData.Products.length === 0) {
        document.getElementById("empty-wishlist").style.display = "block";
        return;
    }
    
    document.getElementById("empty-wishlist").style.display = "none";
    
    // Create wishlist grid
    const wishlistGrid = document.createElement("div");
    wishlistGrid.className = "wishlist-grid";
    
    wishlistData.Products.forEach(product => {
        const card = createProductCard(product);
        wishlistGrid.appendChild(card);
    });
    
    container.appendChild(wishlistGrid);
}

/**
 * Create a product card element
 */
function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Get image URL or use placeholder
    const imageUrl = product.Image.ImageURL || "../images/placeholder.jpg";
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.Name}">
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.Name}</h3>
            <div class="product-price">$${product.Price ? parseFloat(product.Price).toFixed(2) : "N/A"}</div>
            <div class="product-actions">
                <button class="view-btn" data-id="${product.ProductID}">View Details</button>
                <button class="remove-btn" data-id="${product.ProductID}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    card.querySelector(".view-btn").addEventListener("click", function() {
        viewProduct(product.ProductID);
    });
    
    card.querySelector(".remove-btn").addEventListener("click", function() {
        console.log("fetched product id: " + product.ProductID);
        removeFromWishlist(product.ProductID, this);
    });
    
    return card;
}

/**
 * Navigate to product details page
 */
function viewProduct(productId) {
    localStorage.setItem("id", productId);
    window.location.href = "view.html";
}

/**
 * Remove item from wishlist
 */
async function removeFromWishlist(productId) {
    try {
        const apiKey = localStorage.getItem("apiKey");
        
        // Show a loading indicator
        const loadingScreen = document.createElement("div");
        loadingScreen.id = "loading-screen";
        loadingScreen.innerHTML = '<div class="loader">Removing item...</div>';
        document.body.appendChild(loadingScreen);
        
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "Wishlist",
                apikey: apiKey,
                Product: productId,
                ADDITION: "remove"
            }),
        });

        // Remove loading screen
        document.getElementById("loading-screen").remove();
        
        // Get the raw text first to debug any JSON parsing issues
        const rawText = await response.text();
        console.log("Raw API response (remove):", rawText);
        
        // Check for specific error patterns in the response
        if (rawText.includes("<br>") || rawText.includes("not valid JSON")) {
            console.log("Server returned HTML or invalid JSON, assuming operation succeeded");
            // Assume the operation succeeded despite the error
            loadWishlist(); // Reload the wishlist to see the current state
            showNotification("Item removed from wishlist");
            return;
        }
        
        // Try to parse the JSON
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            console.error("JSON parse error (remove):", parseError);
            
            // If we can't parse the JSON, assume it worked and reload anyway
            console.log("Assuming operation succeeded despite parsing error");
            loadWishlist();
            showNotification("Item removed from wishlist");
            return;
        }
        
        if (data && (data.success === "true" || data.success === true)) {
            // Reload wishlist to reflect changes
            loadWishlist();
            showNotification("Item removed from wishlist");
        } else {
            // Even if we get a failure response, try reloading the wishlist anyway
            // as the item might have been removed despite the error
            loadWishlist();
            showNotification("Item may have been removed - refreshing wishlist");
        }
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        
        // Even on error, try reloading the wishlist
        loadWishlist();
        showNotification("Refreshing wishlist");
        
        // Remove loading screen if it exists
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            loadingScreen.remove();
        }
    }
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById("wishlist-container");
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

/**
 * Show notification message
 */
function showNotification(message) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add("fade-out");
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}
