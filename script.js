document.addEventListener("DOMContentLoaded", function () {
  // SEARCH
  function startSearch() {
    window.location.href = "ai-simulation.html";
  }
  window.startSearch = startSearch;

  // FILL SERVICE
  window.fillService = function(service) {
    document.getElementById("service").value = service;
  };

  // MODAL OPEN
  document.getElementById("openModal")?.addEventListener("click", function () {
    document.getElementById("modalBg").style.display = "flex";
  });

  // MODAL CLOSE (X button)
  document.getElementById("closeModal")?.addEventListener("click", function () {
    document.getElementById("modalBg").style.display = "none";
  });

  // MODAL CLOSE (Click background)
  document.getElementById("modalBg")?.addEventListener("click", function (e) {
    if (e.target === this) {
      this.style.display = "none";
    }
  });

  // MODAL CLOSE (ESC key)
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.getElementById("modalBg").style.display = "none";
    }
  });

  // TOGGLE: LOGIN → SIGNUP
  document.getElementById("showSignUp")?.addEventListener("click", function () {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signUpForm").style.display = "block";
  });

  // TOGGLE: SIGNUP → LOGIN
  document.getElementById("showLogin")?.addEventListener("click", function () {
    document.getElementById("signUpForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  });
});
