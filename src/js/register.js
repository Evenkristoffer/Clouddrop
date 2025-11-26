const registerForm = document.querySelector(".auth-form form");
const emailInput = registerForm?.querySelector('input[type="email"]'); // Hva betyr .?. Det gjør at scripten ikke krasjer hvis  registerForm ikke eksisterer. En form for safeguard.
const passwordInput = registerForm?.querySelector('input[type="password"]'); // Samme her, safeguard.
const feedback = document.getElementById("authFeedback"); // Feedback element for å vise meldinger og error til klient eller bruker.
const API_BASE =
  window.API_BASE_URL ||
  (window.location.port === "5500" ? "http://localhost:3000" : window.location.origin); 
const setFeedback = (message, isError = false) => {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.toggle("auth-feedback--error", Boolean(isError));
};

if (registerForm) { 
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
      setFeedback("Email and password are required.", true);
      return;
    }

    try {
      setFeedback("Creating your account...");
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      localStorage.setItem("clouddrop.userEmail", email);
      window.location.href = "index.html";
    } catch (error) {
      console.error(error);
      setFeedback(error.message || "Unable to register.", true);
    }
  });
}
