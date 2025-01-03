document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await axios.post('/users/login', {
      email,
      password,
    });

    // Handle successful login
    if (response.status === 200) {
      alert('Login successful!');
      // Save token to local storage or cookie
      localStorage.setItem('authToken', response.data.token);
      // Redirect to the dashboard
      window.location.href = '/dashboard';
    }
  } catch (err) {
    if (err.response) {
      // Handle errors from the server
      alert(`Error: ${err.response.data.message}`);
    } else {
      // Handle client-side or network errors
      console.error(err);
      alert('Something went wrong!');
    }
  }
});
