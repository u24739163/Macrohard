const API_LINK = "https://wheatley.cs.up.ac.za/u24739163/api.php";
document.addEventListener("DOMContentLoaded", function () {
  const productGrid = document.querySelector(".product-grid");
  const resultsCount = document.querySelector(".results-count");
  const categoryFilter = document.getElementById("category");
  const brandFilter = document.getElementById("brand");
  const priceFilter = document.getElementById("price");
  const sortOptions = document.querySelector(".sort-options select");

  let products = [];
  let filteredProducts = [];

  // Function to create a product card element
  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    // Check if product is in wishlist (you would need to implement this check)
    const isInWishlist = false; // This should be replaced with actual wishlist check
    // Generate star rating HTML
    const rating = product.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = "";
    // Full stars
    starsHTML += "★".repeat(fullStars);
    // Half star if needed
    if (hasHalfStar) starsHTML += "☆";
    // Empty stars
    starsHTML += "☆".repeat(emptyStars);

    card.innerHTML = `
        <div class="product-image">
          <img src="${
            product.image || "https://via.placeholder.com/200x150?text=Product"
          }" alt="${product.name}">
        </div>
        <div class="product-info">
          <div class="product-title">${product.name}</div>
          <div class="product-price1">$${product.price.toFixed(2)}</div>
          <div class="product-rating">
            <div class="stars">${starsHTML}</div>
            <div class="rating-count">(${product.reviewCount || 0})</div>
          </div>
          <div class="product-merchant">${
            product.merchants
              ? product.merchants.join(", ")
              : "Multiple merchants"
          }</div>
          <div class="product-actions">
            <a class="view-deal">View Deal</a>
            <button class="wishlist-btn ${
              isInWishlist ? "active" : ""
            }" data-id="${product.id}">♡</button>
          </div>
        </div>
    `;

    // Add click event for view deal button
    card.querySelector(".view-deal").addEventListener("click", function (e) {
      e.preventDefault();
      viewProductDetails(product.id);
    });

    // Add click event for wishlist button
    card.querySelector(".wishlist-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      toggleWishlist(product.id, this);
    });

    // Make the entire card clickable (optional)
    card.addEventListener("click", function () {
      viewProductDetails(product.id);
    });

    return card;
  }

  // Function to fetch products from API
  function fetchProducts() {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-screen";
    loadingDiv.innerHTML = '<div class="loader">Loading products...</div>';
    document.body.appendChild(loadingDiv);

    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", API_LINK, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Accept", "application/json");

    xhttp.onload = function () {
      document.getElementById("loading-screen").remove();

      if (xhttp.status >= 200 && xhttp.status < 300) {
        try {
          const response = JSON.parse(xhttp.responseText);

          if (response.status === "success") {
            products = response.data.products || [];
            filteredProducts = [...products];
            renderProducts();
            updateResultsCount();
          } else {
            console.error("Failed to fetch products:", response.message);
            showDefaultProducts();
          }
        } catch (e) {
          console.error("Error parsing response:", e);
          showDefaultProducts();
        }
      } else {
        console.error("API request failed with status:", xhttp.status);
        showDefaultProducts();
      }
    };

    xhttp.onerror = function () {
      document.getElementById("loading-screen").remove();
      console.error("Network error occurred");
      showDefaultProducts();
    };

    const requestData = {
      action: "get_products",

    };

    xhttp.send(JSON.stringify(requestData));
  }

  // Function to view product details
  function viewProductDetails(productId) {
    // Navigate to product details page or show modal
    localStorage.setItem("id", productId);
    window.location.href = "view.html";
  }

  // Function to toggle wishlist status
  function toggleWishlist(productId, button) {
    const isInWishlist = button.classList.contains("active");

    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", API_LINK, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Accept", "application/json");

    xhttp.onload = function () {
      if (xhttp.status >= 200 && xhttp.status < 300) {
        try {
          const response = JSON.parse(xhttp.responseText);
          if (response.success === true) {
            // Toggle the active class based on the action
            if (isInWishlist) {
              button.classList.remove("active");
            } else {
              button.classList.add("active");
            }
          } else {
            showNotification("Please Login to add to Wishlist", "error");
          }
        } catch (e) {
          showNotification("Please Login to add to Wishlist", "error");
        }
      } else {
        showNotification("Please Login to add to Wishlist", "error");
      }
    };

    const requestData = {
      type: "Wishlist",
      apikey: localStorage.getItem("apiKey") || "",
      ADDITION: isInWishlist ? "remove" : "add",
      Product: productId,
    };

    xhttp.send(JSON.stringify(requestData));
  }

  // Function to filter products
  function filterProducts() {
    const category = categoryFilter.value;
    const brand = brandFilter.value;
    const price = priceFilter.value;

    filteredProducts = products.filter((product) => {
      // Category filter
      if (category && product.category !== category) return false;

      // Brand filter
      if (brand && product.brand !== brand) return false;

      // Price filter
      if (price) {
        const [min, max] = price.split("-").map(Number);
        if (price.endsWith("+")) {
          if (product.price < min) return false;
        } else {
          if (product.price < min || product.price > max) return false;
        }
      }

      return true;
    });

    // Apply current sort
    sortProducts();
    renderProducts();
    updateResultsCount();
  }

  // Function to sort products
  function sortProducts() {
    const sortOption = sortOptions.value;

    switch (sortOption) {
      case "Price: Low to High":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "Customer Ratings":
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "Newest Arrivals":
        filteredProducts.sort(
          (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)
        );
        break;
      default:
        // Default/Best Match sorting (could be relevance or default order)
        break;
    }
  }

  // Function to render products
  function renderProducts() {
    productGrid.innerHTML = "";
    filteredProducts.forEach((product) => {
      const card = createProductCard(product);
      productGrid.appendChild(card);
    });
  }

  // Function to update results count
  function updateResultsCount() {
    resultsCount.textContent = `${filteredProducts.length} products found`;
  }

  // Fallback function to show default products if API fails
  function showDefaultProducts() {
    const defaultProducts = [
      {
        id: 1,
        name: "Premium Smartphone 128GB - Black",
        price: 599.99,
        image: "https://via.placeholder.com/200x150?text=Smartphone",
        merchants: ["Amazon", "Best Buy", "Walmart"],
        category: "electronics",
        brand: "apple",
        rating: 4.5,
        reviewCount: 128,
        dateAdded: "2023-01-15",
      },
      {
        id: 2,
        name: "Wireless Noise-Cancelling Headphones",
        price: 199.99,
        image: "https://via.placeholder.com/200x150?text=Headphones",
        merchants: ["Best Buy", "Target"],
        category: "electronics",
        brand: "sony",
        rating: 4.2,
        reviewCount: 50,
        dateAdded: "2023-02-20",
      },
      {
        id: 3,
        name: "Fitness Smartwatch with Heart Rate Monitor",
        price: 129.99,
        image: "https://via.placeholder.com/200x150?text=Smartwatch",
        merchants: ["Amazon", "Walmart"],
        category: "electronics",
        brand: "samsung",
        rating: 4.0,
        reviewCount: 2,
        dateAdded: "2023-03-10",
      },
      {
        id: 4,
        name: "10-inch Tablet 64GB - Space Gray",
        price: 329.99,
        image: "https://via.placeholder.com/200x150?text=Tablet",
        merchants: ["Best Buy", "Target"],
        category: "electronics",
        brand: "apple",
        rating: 4.3,
        reviewCount: 11,
        dateAdded: "2023-01-25",
      },
      {
        id: 5,
        name: "Portable Bluetooth Speaker - Waterproof",
        price: 79.99,
        image: "https://via.placeholder.com/200x150?text=Speaker",
        merchants: ["Amazon", "Walmart"],
        category: "electronics",
        brand: "sony",
        rating: 3.9,
        reviewCount: 28,
        dateAdded: "2023-04-05",
      },
      {
        id: 6,
        name: "27-inch 4K Monitor - IPS Panel",
        price: 349.99,
        image: "https://via.placeholder.com/200x150?text=Monitor",
        merchants: ["Best Buy", "Amazon"],
        category: "electronics",
        brand: "samsung",
        rating: 4.1,
        reviewCount: 43,
        dateAdded: "2023-03-15",
      },
    ];

    products = defaultProducts;
    filteredProducts = [...products];
    renderProducts();
    updateResultsCount();
  }

  // Event listeners for filters and sorting
  categoryFilter.addEventListener("change", filterProducts);
  brandFilter.addEventListener("change", filterProducts);
  priceFilter.addEventListener("change", filterProducts);
  sortOptions.addEventListener("change", function () {
    sortProducts();
    renderProducts();
  });

  // Initialize the products display
  fetchProducts();
});

// Notification system
function showNotification(message, type = "success") {
  console.log("Loadinf notif");
  if (!document.querySelector(".notification-container")) {
    const container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  const container = document.querySelector(".notification-container");
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  const messageSpan = document.createElement("span");
  messageSpan.textContent = message;

  const closeButton = document.createElement("button");
  closeButton.className = "notification-close";
  closeButton.innerHTML = "&times;";
  closeButton.addEventListener("click", () => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  });

  notification.appendChild(messageSpan);
  notification.appendChild(closeButton);
  container.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}
