/**
 * view.js - JavaScript for Product View Page
 */

// Get product ID from localStorage instead of URL
const productId = localStorage.getItem("id");

// API configuration
const API_URL = "../PHP/api.php"; // API endpoint. Main one

// Initialize page when `DOM` loads
document.addEventListener("DOMContentLoaded", function () {
  if (!productId) {
    console.error("No product ID found in localStorage");
    window.location.href = "products.html";
    return;
  }

  // Load product data
  loadProductDetails();

  // Initialize interactive features
  initializeTabs();
  initializeGallery();
  initializeWishlist();
  initializeReviewForm();
});

/**
 * Load product details from API
 */
async function loadProductDetails() {
  try {
    console.log("Loading product details for ID:", productId);

    const requestData = {
      type: "View",
      ID: productId,
    };
    console.log("Sending request:", requestData);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    console.log("Received response:", data);

    if (data.success === "true") {
      console.log("Transforming API data...");
      const transformedData = {
        name: data.data.Name,
        description: data.data.Description,
        brand: data.data.Brand,
        category: data.data.Category,
        specifications: JSON.parse(data.data.Specifications),
        images: data.data.Images.map((img) => ({
          image_url: img.ImageURL,
          caption: img.Caption,
        })),
        prices: data.data.Retailers.map((retailer) => ({
          retailer_name: retailer.Retailer,
          price: retailer.Price,
          product_url: retailer.link,
          logo_url: retailer.logo,
          retailer_id: retailer.RID,
          Rating: retailer.Rating // Add rating from API response
        })),
        reviews: data.data.Reviewers
          ? data.data.Reviewers.map((review) => ({
              rating: parseFloat(review.STARS),
              user_name: review.FirstName,
              date_posted: review.Review_Date,
              title: "", // Default empty title since it's not in the response
              content: review.Comment,
            }))
          : [],
      };
      console.log("Transformed data:", transformedData);

      displayProductData(transformedData);
      
      // Only clear the ID after successful data load
      localStorage.removeItem("id");
    } else {
      console.error("Error loading product:", data);
      alert("Error loading product details");
    //   window.location.href = "products.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error connecting to server");
    // window.location.href = "products.html";
  }
}

/**
 * Display product data on the page
 */
function displayProductData(product) {
  // Update product title
  document.getElementById("product-title").textContent = product.name;
  document.getElementById("product-name").textContent = product.name;

  // Update main image
  const mainImage = document.getElementById("main-product-image");
  if (product.images && product.images.length > 0) {
    const primaryImage =
      product.images.find((img) => img.is_primary) || product.images[0];
    mainImage.src = primaryImage.image_url;

    // Update thumbnails
    displayThumbnails(product.images);
  }

  // Update brand
  document.getElementById("brand-link").textContent = product.brand_name;

  // Update category
  document.getElementById("category-link").textContent = product.category_name;

  // Update prices
  displayPrices(product.prices);

  // Update description
  document.getElementById("product-description-content").innerHTML =
    product.description;

  // Update specifications
  displaySpecifications(product.specifications);

  // Update reviews
  displayReviews(product.reviews);

  // Update reviews - check if reviews exist in the response
  if (product.reviews && product.reviews.length > 0) {
    displayReviews(product.reviews);
  } else {
    // If no reviews in initial load, fetch them separately
    fetchProductReviews();
  }
}

/**
 * Display image thumbnails
 */
function displayThumbnails(images) {
  const thumbnailsContainer = document.getElementById("image-thumbnails");
  thumbnailsContainer.innerHTML = "";

  images.forEach((image) => {
    const thumb = document.createElement("img");
    thumb.src = image.image_url;
    thumb.alt = "Product thumbnail";
    thumb.className = "thumbnail";
    thumb.addEventListener("click", function () {
      document.getElementById("main-product-image").src = this.src;
    });
    thumbnailsContainer.appendChild(thumb);
  });
}

/**
 * Display price comparisons
 */
function displayPrices(prices) {
  if (!prices || prices.length === 0) return;

  // Sort by price
  prices.sort((a, b) => a.price - b.price);

  // Update price range
  const minPrice = prices[0].price;
  const maxPrice = prices[prices.length - 1].price;
  document.getElementById("min-price").textContent = `R${minPrice.toFixed(2)}`;
  document.getElementById("max-price").textContent = `R${maxPrice.toFixed(2)}`;

  // Update best price
  document.getElementById("best-price").textContent = `R${minPrice.toFixed(2)}`;
  document.getElementById(
    "best-retailer"
  ).textContent = `at ${prices[0].retailer_name}`;
  document.getElementById("buy-now-link").href = prices[0].product_url;

  // Update retailers list
  const retailersList = document.getElementById("retailers-list");
  retailersList.innerHTML = "";

  prices.forEach((price, index) => {
    const retailerCard = createRetailerCard(price, index === 0);
    retailersList.appendChild(retailerCard);
  });
}

/**
 * Create retailer card element
 */
function createRetailerCard(priceData, isBestDeal) {
  const card = document.createElement("div");
  card.className = `retailer-card ${isBestDeal ? "best-deal" : ""}`;

  // Generate stars HTML based on rating
  const rating = priceData.Rating || 0; // Default to 0 if no rating
  const starsHtml = generateRetailerStars(rating);

  card.innerHTML = `
        ${isBestDeal ? '<div class="best-deal-badge">Best Deal</div>' : ""}
        <div class="retailer-card-grid">
            <div class="retailer-left-column">
                ${rating ? `
                <div class="retailer-rating">
                    <div class="stars">${starsHtml}</div>
                    <span class="rating-value">${parseFloat(rating).toFixed(1)}</span>
                </div>` : ''}
                <div class="retailer-logo-container">
                    <img src="${priceData.logo_url || "placeholder-logo.png"}" alt="${
    priceData.retailer_name
  }" class="retailer-logo">
                </div>
            </div>
            <div class="retailer-info-container">
                <div class="retailer-price">
                    <span class="price">R${priceData.price.toFixed(2)}</span>
                </div>
                <button class="btn primary-btn view-deal-btn">View Deal</button>
            </div>
        </div>
    `;

  // Add click event to the View Deal button
  const viewDealBtn = card.querySelector('.view-deal-btn');
  viewDealBtn.addEventListener('click', () => {
    window.open(priceData.product_url, '_blank');
  });

  return card;
}

/**
 * Generate star HTML for retailer ratings
 */
function generateRetailerStars(rating) {
  if (!rating) return '';
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  let stars = '';
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '<i class="fas fa-star"></i>';
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  
  return stars;
}

/**
 * Display specifications
 */
function displaySpecifications(specifications) {
  const specsContainer = document.querySelector(".specs-container");
  if (!specifications || !specsContainer) return;

  specsContainer.innerHTML = "";

  // Group specifications by category
  const specGroups = {};

  // Based on the Specifications field in the Product table,
  // this might be a JSON string that needs parsing
  try {
    const specs =
      typeof specifications === "string"
        ? JSON.parse(specifications)
        : specifications;

    // Create specification groups
    Object.entries(specs).forEach(([category, items]) => {
      const group = document.createElement("div");
      group.className = "specs-group";

      const title = document.createElement("h3");
      title.textContent = category;
      group.appendChild(title);

      const list = document.createElement("ul");
      list.className = "specs-list";

      Object.entries(items).forEach(([label, value]) => {
        const item = document.createElement("li");
        item.innerHTML = `<span class="specs-label">${label}:</span> ${value}`;
        list.appendChild(item);
      });

      group.appendChild(list);
      specsContainer.appendChild(group);
    });
  } catch (e) {
    console.error("Error parsing specifications:", e);
  }
}

/**
 * Display reviews
 */
function displayReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    // Handle empty reviews
    document.getElementById("avg-rating").textContent = "0.0";
    document.getElementById("total-reviews").textContent = "0 reviews";
    document.getElementById("review-count").textContent = "(0 reviews)";
    updateStarRating("avg-rating-stars", 0);
    updateStarRating("product-stars", 0);
    
    // Reset distribution bars
    for (let i = 5; i >= 1; i--) {
      const barElement = document.querySelector(`.rating-bar:nth-child(${6-i})`);
      if (barElement) {
        const bar = barElement.querySelector('.progress-bar');
        const percentText = barElement.querySelector('.rating-percentage');
        if (bar) bar.style.width = '0%';
        if (percentText) percentText.textContent = '0%';
      }
    }
    
    // Clear review list
    const reviewList = document.getElementById("review-list");
    if (reviewList) reviewList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review this product!</p>';
    return;
  }

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  // Update statistics
  document.getElementById("avg-rating").textContent = avgRating.toFixed(1);
  document.getElementById("total-reviews").textContent = `${totalReviews} reviews`;
  document.getElementById("review-count").textContent = `(${totalReviews} reviews)`;

  // Update stars
  updateStarRating("avg-rating-stars", avgRating);
  updateStarRating("product-stars", avgRating);

  // Calculate distribution
  const distribution = [0, 0, 0, 0, 0]; // 1-star, 2-star, etc.
  reviews.forEach((review) => {
    const ratingIndex = Math.min(Math.max(Math.floor(review.rating), 1), 5) - 1;
    distribution[ratingIndex]++;
  });

  // Update distribution bars
  for (let i = 5; i >= 1; i--) {
    const percentage = (distribution[i - 1] / totalReviews) * 100;
    // Select the bar using nth-child since we don't have data-rating attributes
    const barElement = document.querySelector(`.rating-bar:nth-child(${6-i})`);
    if (barElement) {
      const bar = barElement.querySelector('.progress-bar');
      const percentText = barElement.querySelector('.rating-percentage');
      if (bar) bar.style.width = `${percentage}%`;
      if (percentText) percentText.textContent = `${Math.round(percentage)}%`;
    }
  }

  // Display recent reviews
  const reviewList = document.getElementById("review-list");
  reviewList.innerHTML = "";

  // Sort reviews by date (newest first)
  const sortedReviews = [...reviews].sort((a, b) => 
    new Date(b.date_posted) - new Date(a.date_posted)
  );

  sortedReviews.forEach((review) => {
    const reviewElement = createReviewElement(review);
    reviewList.appendChild(reviewElement);
  });
}

/**
 * Create review element
 */
function createReviewElement(review) {
  const div = document.createElement("div");
  div.className = "review-item";

  const date = new Date(review.date_posted);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  div.innerHTML = `
        <div class="review-header">
            <div class="reviewer-name">${review.user_name || "Anonymous"}</div>
            <div class="review-date">${formattedDate}</div>
        </div>
        <div class="review-rating">
            ${generateStars(review.rating)}
        </div>
        <div class="review-title">${review.title}</div>
        <div class="review-content">${review.content}</div>
    `;

  return div;
}

/**
 * Update star rating display
 */
function updateStarRating(elementId, rating) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("i");
    if (i <= rating) {
      star.className = "fas fa-star";
    } else if (i - 0.5 <= rating) {
      star.className = "fas fa-star-half-alt";
    } else {
      star.className = "far fa-star";
    }
    element.appendChild(star);
  }
}

/**
 * Generate star HTML
 */
function generateStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="fas fa-star"></i>';
    } else {
      stars += '<i class="far fa-star"></i>';
    }
  }
  return stars;
}


/**
 * Initialize tabs
 */
function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");

      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      this.classList.add("active");
      document.getElementById(tabId + "-tab").classList.add("active");
    });
  });
}

/**
 * Initialize image gallery
 */
function initializeGallery() {
  const thumbnails = document.querySelectorAll(".thumbnail");
  const mainImage = document.getElementById("main-product-image");

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", function () {
      mainImage.src = this.src;
      thumbnails.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

/**
 * Initialize wishlist functionality
 */
function initializeWishlist() {
  const wishlistBtn = document.getElementById("add-to-wishlist");
  if (!wishlistBtn) return;

  // Check if item is in wishlist on page load
  checkWishlistStatus();

  wishlistBtn.addEventListener("click", async function () {
    const apiKey = localStorage.getItem("apiKey");

    if (!apiKey) {
      alert("Please login to manage your wishlist");
      window.location.href = "login.php?redirect=view.php?id=" + productId;
      return;
    }

    const isInWishlist = this.classList.contains("added");
    const action = isInWishlist ? "remove" : "add";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "Wishlist",
          apikey: apiKey,
          Product: productId,
          ADDITION: action,
        }),
      });

      const data = await response.json();

      if (data.success === "success") {
        this.classList.toggle("added");
        this.innerHTML = this.classList.contains("added")
          ? '<i class="fas fa-heart"></i> Remove from Wishlist'
          : '<i class="far fa-heart"></i> Add to Wishlist';

        // Show feedback message
        const message = isInWishlist
          ? "Removed from wishlist"
          : "Added to wishlist";
        showNotification(message);
      } else {
        alert("Error: " + (data.data || "Failed to update wishlist"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error connecting to server");
    }
  });
}

/**
 * Check if the current product is in the user's wishlist
 */
async function checkWishlistStatus() {
  const wishlistBtn = document.getElementById("add-to-wishlist");
  if (!wishlistBtn) return;

  const apiKey = localStorage.getItem("apiKey");
  if (!apiKey) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "Wishlist",
        apikey: apiKey,
        Product: productId,
        ADDITION: "check",
      }),
    });

    const data = await response.json();

    if (data.success === "success" && data.data === true) {
      wishlistBtn.classList.add("added");
      wishlistBtn.innerHTML =
        '<i class="fas fa-heart"></i> Remove from Wishlist';
    }
  } catch (error) {
    console.error("Error checking wishlist status:", error);
  }
}

/**
 * Show a temporary notification message
 */
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add("show"), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Initialize review form
 */
function initializeReviewForm() {
  const reviewForm = document.getElementById("review-form");
  if (!reviewForm) return;

  // Populate retailer dropdown
  populateRetailerDropdown();

  // Initialize star rating interaction
  const ratingInputs = reviewForm.querySelectorAll('.rating-input input[type="radio"]');
  const ratingLabels = reviewForm.querySelectorAll(".rating-input label");

  ratingLabels.forEach((label, index) => {
    label.addEventListener("mouseover", () => {
      // Fill stars up to this one
      ratingLabels.forEach((l, i) => {
        l.querySelector("i").className = i <= index ? "fas fa-star" : "far fa-star";
      });
    });

    label.addEventListener("mouseout", () => {
      // Reset to selected rating
      const selectedRating = reviewForm.querySelector('input[name="rating"]:checked')?.value || 0;
      ratingLabels.forEach((l, i) => {
        l.querySelector("i").className = i < selectedRating ? "fas fa-star" : "far fa-star";
      });
    });
  });

  reviewForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const apiKey = loaclStorage.getItem("apiKey");
    console.log("API Key present:", !!apiKey); // Log if API key exists

    if (!apiKey) {
      alert("Please login to submit a review");
      window.location.href = "login.html?redirect=view.html?id=" + productId;
      return;
    }

    // Get form data
    const rating = parseFloat(reviewForm.querySelector('input[name="rating"]:checked')?.value || 0);
    const comment = reviewForm.querySelector('textarea[name="comment"]')?.value.trim();
    const retailerId = parseInt(reviewForm.querySelector('select[name="retailer"]')?.value || 0);

    // Validate form data
    if (!rating) {
      alert("Please select a rating");
      return;
    }
    if (!comment) {
      alert("Please enter your review");
      return;
    }

    try {
      // Use a consistent API key source (sessionStorage)
      const requestData = {
        type: "AddReview",
        apikey: apiKey,
        Product: parseInt(productId),
        Rating: rating,
        Comment: comment,
        retailer: retailerId || null
      };

      console.log("Sending review request:", requestData);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Review submission response:", data);

      if (data.success === "success") {
        // Show success message
        showNotification("Review submitted successfully!");
        
        // Reset form
        reviewForm.reset();
        ratingLabels.forEach(l => l.querySelector("i").className = "far fa-star");
        
        // Add the new review to the displayed reviews
        addNewReviewToDisplay(rating, comment);
        
        // Reload product details to get the updated reviews from server
        loadProductDetails();
      } else {
        alert("Error: " + (data.data || "Failed to submit review"));
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error connecting to server. Please try again later.");
    }
  });
}

/**
 * Populate the retailer dropdown in the review form
 */
function populateRetailerDropdown() {
  const retailerSelect = document.querySelector('select[name="retailer"]');
  if (!retailerSelect) return;
  
  // Clear existing options except the first one
  const defaultOption = retailerSelect.querySelector('option[value=""]');
  retailerSelect.innerHTML = '';
  if (defaultOption) retailerSelect.appendChild(defaultOption);
  
  // Get retailers from the page
  const retailerCards = document.querySelectorAll('.retailer-card');
  retailerCards.forEach(card => {
    const retailerName = card.querySelector('.retailer-logo')?.alt;
    const retailerId = card.dataset.retailerId;
    
    if (retailerName && retailerId) {
      const option = document.createElement('option');
      option.value = retailerId;
      option.textContent = retailerName;
      retailerSelect.appendChild(option);
    }
  });
}

/**
 * Temporarily add a new review to the display before reloading
 * This gives immediate feedback to the user
 */
function addNewReviewToDisplay(rating, comment) {
  const reviewList = document.getElementById("review-list");
  if (!reviewList) return;
  
  // Create a temporary review object
  const newReview = {
    rating: rating,
    user_name: "You", // Or get from session if available
    date_posted: new Date().toISOString(),
    title: "",
    content: comment
  };
  
  // Create and prepend the review element (show it at the top)
  const reviewElement = createReviewElement(newReview);
  reviewElement.classList.add('new-review');
  
  if (reviewList.firstChild) {
    reviewList.insertBefore(reviewElement, reviewList.firstChild);
  } else {
    reviewList.appendChild(reviewElement);
  }
  
  // Update the statistics temporarily
  updateReviewStatisticsWithNewReview(rating);
}

/**
 * Update review statistics when a new review is added
 */
function updateReviewStatisticsWithNewReview(newRating) {
  // Get current values
  const totalReviewsEl = document.getElementById("total-reviews");
  const avgRatingEl = document.getElementById("avg-rating");
  
  if (!totalReviewsEl || !avgRatingEl) return;
  
  // Parse current values
  const currentCount = parseInt(totalReviewsEl.textContent.split(' ')[0]) || 0;
  const currentAvg = parseFloat(avgRatingEl.textContent) || 0;
  
  // Calculate new values
  const newCount = currentCount + 1;
  const newAvg = ((currentAvg * currentCount) + newRating) / newCount;
  
  // Update the display
  totalReviewsEl.textContent = `${newCount} reviews`;
  document.getElementById("review-count").textContent = `(${newCount} reviews)`;
  avgRatingEl.textContent = newAvg.toFixed(1);
  
  // Update stars
  updateStarRating("avg-rating-stars", newAvg);
  updateStarRating("product-stars", newAvg);
  
  // Update distribution bars
  // This is more complex as we need the current distribution
  // Just reload the whole page after a short delay instead
}