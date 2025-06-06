const API_LINK = "../PHP/api.php";
document.addEventListener("DOMContentLoaded", function () {
  const productGrid = document.querySelector(".product-grid");
  const resultsCount = document.querySelector(".results-count");
  const categoryFilter = document.getElementById("category");
  const brandFilter = document.getElementById("brand");
  const priceFilter = document.getElementById("price");
  const sortOptions = document.querySelector(".sort-options select");
  const searchInput = document.querySelector(".search-bar input");
  const searchButton = document.querySelector(".search-bar button");
  if (localStorage.getItem("apiKey") !== null) {
    updateAuthButton();
    fetchWishlist();
  }
  function updateAuthButton() {
    const loginLink = document.getElementById("login-link");
    const apiKey = localStorage.getItem("apiKey");

    if (apiKey) {
      loginLink.textContent = "Logout";
      loginLink.href = "#";
      loginLink.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("apiKey");
        window.location.href = "homepage.html";
      });
    } else {
      loginLink.textContent = "Login";
      loginLink.href = "login.html";
      loginLink.replaceWith(loginLink.cloneNode(true));
    }
  }
  let products = [];
  let filteredProducts = [];
  let brands = [];
  let categories = [];
  let wishlistProducts = [];

  // Function to fetch brands from API
  function fetchBrands() {
    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", API_LINK, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Accept", "application/json");

    xhttp.onload = function () {
      if (xhttp.status >= 200 && xhttp.status < 300) {
        try {
          const response = JSON.parse(xhttp.responseText);
          if (response.success === "Success") {
            brands = response.data;
            populateBrandFilter();
          }
        } catch (e) {
          console.error("Error parsing brands response:", e);
        }
      }
    };

    const requestData = {
      type: "Brands",
    };

    xhttp.send(JSON.stringify(requestData));
  }

  // Function to fetch categories from API
  function fetchCategories() {
    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", API_LINK, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Accept", "application/json");

    xhttp.onload = function () {
      if (xhttp.status >= 200 && xhttp.status < 300) {
        try {
          const response = JSON.parse(xhttp.responseText);
          if (response.success === "Success") {
            // Filter out subcategories (those with ParentCategoryID)
            categories = response.data.filter((cat) => !cat.ParentCategoryID);
            populateCategoryFilter();
          }
        } catch (e) {
          console.error("Error parsing categories response:", e);
        }
      }
    };

    const requestData = {
      type: "Cat",
    };

    xhttp.send(JSON.stringify(requestData));
  }

  function fetchWishlist() {
    const apiKey = localStorage.getItem("apiKey");
    if (!apiKey) return; // Skip if user not logged in

    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", API_LINK, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.setRequestHeader("Accept", "application/json");

    xhttp.onload = function () {
      if (xhttp.status >= 200 && xhttp.status < 300) {
        try {
          const response = JSON.parse(xhttp.responseText);
          if (response.success === true) {
            wishlistProducts = response.data.Products || [];
            // Update the wishlist status for any existing products
            updateWishlistStatus();
          }
        } catch (e) {
          console.error("Error parsing wishlist response:", e);
        }
      }
    };

    const requestData = {
      type: "Wishlist",
      apikey: apiKey,
    };

    xhttp.send(JSON.stringify(requestData));
  }

  function updateWishlistStatus() {
    document.querySelectorAll(".wishlist-btn").forEach((button) => {
      const productId = parseInt(button.dataset.id);
      const isInWishlist = wishlistProducts.some(
        (p) => p.ProductID === productId
      );
      button.classList.toggle("active", isInWishlist);
    });
  }
  // Function to populate brand filter dropdown
  function populateBrandFilter() {
    brandFilter.innerHTML = '<option value="">All Brands</option>';
    brands.forEach((brand) => {
      const option = document.createElement("option");
      option.value = brand.BrandID;
      option.textContent = brand.Name;
      brandFilter.appendChild(option);
    });
  }

  // Function to populate category filter dropdown
  function populateCategoryFilter() {
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.CategoryID;
      option.textContent = category.Name;
      categoryFilter.appendChild(option);
    });
  }

  // Function to create a product card element
  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";

    const isInWishlist = wishlistProducts.some(
      (p) => p.ProductID === product.ID
    );

    // Generate star rating HTML
    const rating = product.Stars || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = "";
    starsHTML += "★".repeat(fullStars);
    if (hasHalfStar) starsHTML += "☆";
    starsHTML += "☆".repeat(emptyStars);

    card.innerHTML = `
        <div class="product-image">
          <img src="${product.Image.ImageURL || product.Image.Caption}" alt="${
      product.Name
    }">
        </div>
        <div class="product-info">
          <div class="product-title">${product.Name}</div>
          <div class="product-price1">$${product.Price.toFixed(2)}</div>
          <div class="product-rating">
            <div class="stars">${starsHTML}</div>
            <div class="rating-count">(${product.NumReviews || 0})</div>
          </div>
          <div class="product-merchant">${
            product.Retailers
              ? product.Retailers.join(", ")
              : "Multiple merchants"
          }</div>
          <div class="product-actions">
            <a class="view-deal">View Deal</a>
            <button class="wishlist-btn ${
              isInWishlist ? "active" : ""
            }" data-id="${product.ID}">♡</button>
          </div>
        </div>
    `;

    // Add click event for view deal button
    card.querySelector(".view-deal").addEventListener("click", function (e) {
      e.preventDefault();
      viewProductDetails(product.ID);
    });

    // Add click event for wishlist button
    card.querySelector(".wishlist-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      toggleWishlist(product.ID, this);
    });

    // Make the entire card clickable (optional)
    card.addEventListener("click", function () {
      viewProductDetails(product.ID);
    });

    return card;
  }

  // Function to fetch products from API
  function fetchProducts(searchTerm = "") {
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

          if (response.success === "Success") {
            products = response.data.Products || [];
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
      type: "GetProducts",
      Category: categoryFilter.value || undefined,
      Brands: brandFilter.value || undefined,
      Search: searchTerm || undefined,
    };

    // Remove undefined properties
    Object.keys(requestData).forEach(
      (key) => requestData[key] === undefined && delete requestData[key]
    );

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
      fetchWishlist();
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
      if (category && product.CategoryID !== category) return false;

      // Brand filter
      if (brand && product.BrandID !== brand) return false;

      // Price filter
      if (price) {
        const [min, max] = price.split("-").map(Number);
        if (price.endsWith("+")) {
          if (product.Price < min) return false;
        } else {
          if (product.Price < min || product.Price > max) return false;
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
        filteredProducts.sort((a, b) => a.Price - b.Price);
        break;
      case "Price: High to Low":
        filteredProducts.sort((a, b) => b.Price - a.Price);
        break;
      case "Customer Ratings":
        filteredProducts.sort((a, b) => (b.Stars || 0) - (a.Stars || 0));
        break;
      case "Newest Arrivals":
        filteredProducts.sort(
          (a, b) => new Date(b.DateAdded) - new Date(a.DateAdded)
        );
        break;
      default:
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
    products = defaultProducts;
    filteredProducts = [...products];
    renderProducts();
    updateResultsCount();
  }

  // Event listeners for filters and sorting
  categoryFilter.addEventListener("change", function () {
    fetchProducts();
  });

  brandFilter.addEventListener("change", function () {
    fetchProducts();
  });

  priceFilter.addEventListener("change", filterProducts);

  sortOptions.addEventListener("change", function () {
    sortProducts();
    renderProducts();
  });

  // Search functionality
  searchButton.addEventListener("click", function () {
    fetchProducts(searchInput.value.trim());
  });

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      fetchProducts(searchInput.value.trim());
    }
  });

  // Initialize the page
  fetchBrands();
  fetchCategories();
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
