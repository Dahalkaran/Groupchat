document.getElementById('signupForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;

  try {
    const response = await axios.post('/users/signup', {
      name,
      email,
      phone,
      password,
    });

    if (response.status === 200 || response.status === 201) {
      alert(response.data.message); // Alert success message
      window.location.href = '/login.html'; // Redirect to login page
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
