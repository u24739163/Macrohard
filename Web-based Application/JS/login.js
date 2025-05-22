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
    const rememberMe = document.getElementById("remember").checked;

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

      // Simulate API call
      setTimeout(() => {
        // Remove loading indicator
        document.body.removeChild(loadingDiv);

        // Here you would typically redirect to dashboard or products page
        console.log("Login successful", { email, rememberMe });
        // window.location.href = 'products.html';
      }, 1500);
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
