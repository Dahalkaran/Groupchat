document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const result = await response.json();
      if (response.ok) {
        alert('Login successful!');
        // Save token to local storage or cookie
        localStorage.setItem('authToken', result.token);
        window.location.href = '/dashboard.html'; // Redirect to dashboard or home page
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    }
  });
  