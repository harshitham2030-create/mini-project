document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const message = document.getElementById("message").value;

  const response = await fetch("https://portfolio-backend-ludi.onrender.com/api/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, message })
  });

  const data = await response.json();

  if (data.success) {
    alert("Message saved successfully!");
  } else {
    alert("Error: " + data.error);
  }
});