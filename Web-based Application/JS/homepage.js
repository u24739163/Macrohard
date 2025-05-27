const API_LINK = "../PHP/api.php";
document.addEventListener("DOMContentLoaded", function () {
  const productsGrid = document.querySelector(".products-grid");
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
  // Function to create a product card element
  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
            <img src="${
              product.image
            }" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="price">$${product.price.toFixed(2)}</div>
            <div class="merchant">${product.merchants.join(", ")}</div>
        `;

    card.addEventListener("click", function () {
      window.location.href = `products.html?product=${encodeURIComponent(
        product.name
      )}`;
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
            productsGrid.innerHTML = "";
            const productsToShow = response.data.products.slice(0, 5);
            productsToShow.forEach((product) => {
              const card = createProductCard(product);
              productsGrid.appendChild(card);
            });
          } else {
            console.error("Failed to fetch products:", response.message);
          }
        } catch (e) {
          console.error("Error parsing response:", e);
        }
      } else {
        console.error("API request failed with status:", xhttp.status);
      }
    };

    xhttp.onerror = function () {
      document.getElementById("loading-screen").remove();
      console.error("Network error occurred");
    };

    xhttp.send();
  }

  // Initialize the products display
  fetchProducts();
});

