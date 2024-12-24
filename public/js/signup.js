document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password }),
      });
  
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        window.location.href = '/login.html'; // Redirect to login page if needed
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    }
  });
  