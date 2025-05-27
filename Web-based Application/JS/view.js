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
          shipping_cost: null,
          availability: "In Stock",
          retailer_id: retailer.RID,
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
    } else {
      console.error("Error loading product:", data);
      alert("Error loading product details");
    //    window.location.href = "products.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error connecting to server");
    //  window.location.href = "products.html";
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

  card.innerHTML = `
        ${isBestDeal ? '<div class="best-deal-badge">Best Deal</div>' : ""}
        <div class="retailer-header">
            <img src="${priceData.logo_url || "placeholder-logo.png"}" alt="${
    priceData.retailer_name
  }" class="retailer-logo">
        </div>
        <div class="retailer-price">
            <span class="price">R${priceData.price.toFixed(2)}</span>
            <span class="shipping">${
              priceData.shipping_cost
                ? `R${priceData.shipping_cost} Shipping`
                : "Free Shipping"
            }</span>
        </div>
        <div class="retailer-availability ${
          priceData.availability === "In Stock" ? "in-stock" : "out-of-stock"
        }">
            <i class="fas fa-${
              priceData.availability === "In Stock" ? "check" : "times"
            }-circle"></i>
            ${priceData.availability}
        </div>
        <div class="retailer-actions">
            <a href="${
              priceData.product_url
            }" class="btn primary-btn retailer-btn" target="_blank">View Deal</a>
            <button class="btn-icon wishlist-retailer" data-retailer-id="${
              priceData.retailer_id
            }" title="Add to Wishlist">
                <i class="far fa-heart"></i>
            </button>
        </div>
    `;

  return card;
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
  if (!reviews || reviews.length === 0) return;

  // Calculate statistics
  const totalReviews = reviews.length;
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  // Update statistics
  document.getElementById("avg-rating").textContent = avgRating.toFixed(1);
  document.getElementById(
    "total-reviews"
  ).textContent = `${totalReviews} reviews`;
  document.getElementById(
    "review-count"
  ).textContent = `(${totalReviews} reviews)`;

  // Update stars
  updateStarRating("avg-rating-stars", avgRating);
  updateStarRating("product-stars", avgRating);

  // Calculate distribution
  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((review) => {
    distribution[review.rating - 1]++;
  });

  // Update distribution bars
  for (let i = 5; i >= 1; i--) {
    const percentage = (distribution[i - 1] / totalReviews) * 100;
    const bar = document.querySelector(`[data-rating="${i}"] .progress-bar`);
    const percentText = document.querySelector(
      `[data-rating="${i}"] .rating-percentage`
    );

    if (bar) bar.style.width = `${percentage}%`;
    if (percentText) percentText.textContent = `${Math.round(percentage)}%`;
  }

  // Display recent reviews
  const reviewList = document.getElementById("review-list");
  reviewList.innerHTML = "";

  reviews.slice(0, 10).forEach((review) => {
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
    const apiKey = sessionStorage.getItem("apiKey");

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

  const apiKey = sessionStorage.getItem("apiKey");
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

    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) {
      alert("Please login to submit a review");
      window.location.href = "login.html?redirect=view.html?id=" + productId;
      return;
    }

    // Get form data
    const rating = parseFloat(reviewForm.querySelector('input[name="rating"]:checked')?.value || 0);
    const comment = reviewForm.querySelector('textarea[name="comment"]')?.value.trim();
    const retailerId = reviewForm.querySelector('select[name="retailer"]')?.value || null;

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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "AddReview",
          apikey: apiKey,
          Product: productId,
          Rating: rating,
          Comment: comment,
          retailer: retailerId || null
        }),
      });

      const data = await response.json();

      if (data.success === "Success") {
        // Show success message
        showNotification("Review submitted successfully!");

        // Reset form
        reviewForm.reset();
        ratingLabels.forEach(l => l.querySelector("i").className = "far fa-star");

        // Reload product details to show new review
        loadProductDetails();
      } else {
        alert("Error: " + (data.data || "Failed to submit review"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error connecting to server");
    }
  });
}
