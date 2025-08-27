// test-login.mjs
const email = "demo" + Math.floor(Math.random() * 1e6) + "@example.com";
const password = "secretpass123";

(async () => {
  const r1 = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: "Login Demo" }),
  });
  console.log("register status:", r1.status, await r1.text());

  const r2 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  console.log("login status:", r2.status, await r2.text());

  console.log("used credentials:", email, password);
})();
