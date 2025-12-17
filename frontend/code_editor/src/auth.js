export const login = async (username, password) => {
  const res = await fetch("http://localhost:5000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
};
