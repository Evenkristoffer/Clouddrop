const loginForm = document.querySelector(".auth-form form");
const emailInput = loginForm?.querySelector('input[type="email"]');
const passwordInput = loginForm?.querySelector('input[type="password"]');
const feedback = document.getElementById("authFeedback");

const API_BASE = window.API_BASE_URL
  ? window.API_BASE_URL
  : window.location.port === "5500"
  ? "http://localhost:3000"
  : window.location.origin;

function setFeedback(message, isError = false) {
  if (!feedback) return;

  feedback.textContent = message;
  feedback.classList.toggle("auth-feedback--error", Boolean(isError));
}

if (loginForm && emailInput && passwordInput) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      setFeedback("Email and password are required.", true);
      return;
    }

    setFeedback("Signing in...");

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
      }

      if (!res.ok) {
        setFeedback(data.error || "Login failed.", true);
        return;
      }

      localStorage.setItem("clouddrop.userEmail", email);

      window.location.href = "index.html";
    } catch (error) {
      console.error(error);
      setFeedback("Unable to login. Please try again.", true);
    }
  });
}
