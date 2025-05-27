const API_LINK = "../PHP/api.php";
document.addEventListener("DOMContentLoaded", function () {
  const productsGrid = document.querySelector(".products-grid");

  // Function to create a product card element
  function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
            <img src="${
              product.image ||
              "https://via.placeholder.com/200x150?text=Product"
            }" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="price">$${product.price.toFixed(2)}</div>
            <div class="merchant">${product.merchants.join(", ")}</div>
        `;

    // Make the entire card clickable (optional)
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
            // Clear existing products
            productsGrid.innerHTML = "";

            // Add new product cards (limit to 5)
            const productsToShow = response.data.products.slice(0, 5);
            productsToShow.forEach((product) => {
              const card = createProductCard(product);
              productsGrid.appendChild(card);
            });
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

    xhttp.send();
  }

  // Fallback function to show default products if API fails
  function showDefaultProducts() {
    const defaultProducts = [
      {
        name: "Wireless Bluetooth Headphones",
        price: 59.99,
        image: "https://via.placeholder.com/200x150?text=Product+1",
        merchants: ["Amazon", "Best Buy", "Walmart"],
      },
      {
        name: "Smartphone XYZ Model",
        price: 499.99,
        image: "https://via.placeholder.com/200x150?text=Product+2",
        merchants: ["Amazon", "Target"],
      },
      {
        name: "4K Ultra HD Smart TV",
        price: 349.99,
        image: "https://via.placeholder.com/200x150?text=Product+3",
        merchants: ["Best Buy", "Walmart"],
      },
      {
        name: "Wireless Charging Pad",
        price: 19.99,
        image: "https://via.placeholder.com/200x150?text=Product+4",
        merchants: ["Amazon", "Target", "Walmart"],
      },
      {
        name: "Fitness Tracker Watch",
        price: 79.99,
        image: "https://via.placeholder.com/200x150?text=Product+5",
        merchants: ["Amazon", "Best Buy"],
      },
      {
        name: "Wireless Bluetooth Headphones",
        price: 59.99,
        image: "https://via.placeholder.com/200x150?text=Product+1",
        merchants: ["Amazon", "Best Buy", "Walmart"],
      },
      {
        name: "Smartphone XYZ Model",
        price: 499.99,
        image: "https://via.placeholder.com/200x150?text=Product+2",
        merchants: ["Amazon", "Target"],
      },
      {
        name: "4K Ultra HD Smart TV",
        price: 349.99,
        image: "https://via.placeholder.com/200x150?text=Product+3",
        merchants: ["Best Buy", "Walmart"],
      },
      {
        name: "Wireless Charging Pad",
        price: 19.99,
        image: "https://via.placeholder.com/200x150?text=Product+4",
        merchants: ["Amazon", "Target", "Walmart"],
      },
      {
        name: "Fitness Tracker Watch",
        price: 79.99,
        image: "https://via.placeholder.com/200x150?text=Product+5",
        merchants: ["Amazon", "Best Buy"],
      },
      {
        name: "Wireless Bluetooth Headphones",
        price: 59.99,
        image: "https://via.placeholder.com/200x150?text=Product+1",
        merchants: ["Amazon", "Best Buy", "Walmart"],
      },
      {
        name: "Smartphone XYZ Model",
        price: 499.99,
        image: "https://via.placeholder.com/200x150?text=Product+2",
        merchants: ["Amazon", "Target"],
      },
      {
        name: "4K Ultra HD Smart TV",
        price: 349.99,
        image: "https://via.placeholder.com/200x150?text=Product+3",
        merchants: ["Best Buy", "Walmart"],
      },
      {
        name: "Wireless Charging Pad",
        price: 19.99,
        image: "https://via.placeholder.com/200x150?text=Product+4",
        merchants: ["Amazon", "Target", "Walmart"],
      },
      {
        name: "Fitness Tracker Watch",
        price: 79.99,
        image: "https://via.placeholder.com/200x150?text=Product+5",
        merchants: ["Amazon", "Best Buy"],
      },
    ];

    productsGrid.innerHTML = "";
    defaultProducts.forEach((product) => {
      const card = createProductCard(product);
      productsGrid.appendChild(card);
    });
  }

  // Initialize the products display
  fetchProducts();
});
