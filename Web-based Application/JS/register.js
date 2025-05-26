document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("register-form");
  const firstNameInput = document.getElementById("first-name");
  const lastNameInput = document.getElementById("last-name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login-button");

  // Get all form groups
  const firstNameGroup = firstNameInput.closest(".form-group");
  const lastNameGroup = lastNameInput.closest(".form-group");
  const emailGroup = emailInput.closest(".form-group");
  const passwordGroup = passwordInput.closest(".form-group");

  // Handle login button click
  loginButton.addEventListener("click", function () {
    window.location.href = "login.html";
  });

  // Handle form submission
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Reset all error states
    [firstNameGroup, lastNameGroup, emailGroup, passwordGroup].forEach(
      (group) => {
        group.classList.remove("error");
      }
    );
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
      el.style.display = "none";
    });

    // Get form values
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validation flags
    let isValid = true;

    // First name validation
    if (!firstName) {
      firstNameGroup.classList.add("error");
      document.getElementById("nameError").textContent =
        "First name is required";
      document.getElementById("nameError").style.display = "block";
      isValid = false;
    }

    // Last name validation
    if (!lastName) {
      lastNameGroup.classList.add("error");
      document.getElementById("surnameError").textContent =
        "Last name is required";
      document.getElementById("surnameError").style.display = "block";
      isValid = false;
    }

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
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!password) {
      passwordGroup.classList.add("error");
      document.getElementById("passwordError").textContent =
        "Password is required";
      document.getElementById("passwordError").style.display = "block";
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      passwordGroup.classList.add("error");
      document.getElementById("passwordError").textContent =
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
      document.getElementById("passwordError").style.display = "block";
      isValid = false;
    }

    if (isValid) {
      const loadingDiv = document.createElement("div");
      loadingDiv.id = "loading-screen";
      loadingDiv.innerHTML = '<div class="loader"></div>';
      document.body.appendChild(loadingDiv);

      const requestData = {
        name: firstName,
        surname: lastName,
        email: email,
        password: password,
        type: "Register",
      };

      // Simulate API call (replace with actual API call)
      const xhttp = new XMLHttpRequest();
      xhttp.open(
        "POST",
        "https://wheatley.cs.up.ac.za/u24739163/api.php",
        true
      );
      xhttp.setRequestHeader("Content-Type", "application/json");
      xhttp.setRequestHeader("Accept", "application/json");

      xhttp.onload = function () {
        document.getElementById("loading-screen").remove();

        if (xhttp.status >= 200 && xhttp.status < 300) {
          const response = JSON.parse(xhttp.responseText);
          try {
            if (response.success === "Success") {
              //document.getElementById("signupForm").replaceWith(message);
              localStorage.setItem("apiKey", response.data.Apikey);
              window.location.href = "homepage.html";
            } else {
              showNotification(
                response.data.message || "Registration failed",
                "error"
              );
            }
          } catch (e) {
            showNotification(
              "An error occurred while processing your request",
              "error"
            );
          }
        } else {
          if (xhttp.status == 409) {
            showNotification("Account already exists", "error");
          } else {
            showNotification("Registration failed. Please try again", "error");
          }
        }
      };

      xhttp.onerror = function () {
        document.getElementById("loading-screen").remove();
        showNotification("Network error occurred", "error");
      };

      xhttp.send(JSON.stringify(requestData));
      console.log("Form submitted successfully");
    }
  });

  // Clear errors when user starts typing
  firstNameInput.addEventListener("input", function () {
    firstNameGroup.classList.remove("error");
    document.getElementById("nameError").style.display = "none";
  });

  lastNameInput.addEventListener("input", function () {
    lastNameGroup.classList.remove("error");
    document.getElementById("surnameError").style.display = "none";
  });

  emailInput.addEventListener("input", function () {
    emailGroup.classList.remove("error");
    document.getElementById("emailError").style.display = "none";
  });

  passwordInput.addEventListener("input", function () {
    passwordGroup.classList.remove("error");
    document.getElementById("passwordError").style.display = "none";
  });
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
