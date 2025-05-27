const API_LINK = "../PHP/api.php";
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailGroup = emailInput.closest(".form-group");
  const passwordGroup = passwordInput.closest(".form-group");

  // Handle register button click
  document
    .getElementById("register-button")
    .addEventListener("click", function () {
      window.location.href = "register.html";
    });

  // Handle form submission
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Remove all error states first
    emailGroup.classList.remove("error");
    passwordGroup.classList.remove("error");
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });

    // Get form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation flag
    let isValid = true;

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      emailGroup.classList.add("error");
      document.getElementById("emailError").textContent = "Email is required";
      document.getElementById("emailError").style.display = "block";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      emailGroup.classList.add("error");
      document.getElementById("emailError").textContent =
        "Please enter a valid email address";
      document.getElementById("emailError").style.display = "block";
      isValid = false;
    }

    // Password validation
    if (!password) {
      passwordGroup.classList.add("error");
      document.getElementById("passwordError").textContent =
        "Password is required";
      document.getElementById("passwordError").style.display = "block";
      isValid = false;
    } else if (password.length < 6) {
      passwordGroup.classList.add("error");
      document.getElementById("passwordError").textContent =
        "Password must be at least 6 characters";
      document.getElementById("passwordError").style.display = "block";
      isValid = false;
    }

    if (isValid) {
      // Show loading indicator
      const loadingDiv = document.createElement("div");
      loadingDiv.id = "loading-screen";
      loadingDiv.innerHTML = '<div class="loader"></div>';
      document.body.appendChild(loadingDiv);

      const requestData = {
        email: email,
        password: password,
        type: "Login",
      };

      const xhttp = new XMLHttpRequest();
      xhttp.open("POST", API_LINK, true);
      xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.setRequestHeader("Accept", "application/json");

      xhttp.onload = function () {
        document.getElementById("loading-screen").remove();
        if (xhttp.status >= 200 && xhttp.status < 300) {
          const response = JSON.parse(xhttp.responseText);
          try {
            if (response.success === "Success") {
              if(response.data.Type === "Admin") {
                localStorage.setItem("apiKey", response.data.Apikey);
                window.location.href = "userManagement.html";
              }
              else
              {
                localStorage.setItem("apiKey", response.data.Apikey);
                window.location.href = "homepage.html";
              }

            } else {
              showNotification("Username or password is incorrect", "error");
            }
          } catch (e) {
            showNotification("Username or password is incorrect", "error");
          }
        } else {
          showNotification("Username or password is incorrect", "error");
        }
      };

      xhttp.send(JSON.stringify(requestData));
      console.log("Form submitted successfully");
    }
  });

  // Clear errors when user starts typing
  emailInput.addEventListener("input", function () {
    emailGroup.classList.remove("error");
    document.getElementById("emailError").style.display = "none";
  });

  passwordInput.addEventListener("input", function () {
    passwordGroup.classList.remove("error");
    document.getElementById("passwordError").style.display = "none";
  });
});

function showNotification(message, type = "success") {
  console.log(message);
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
