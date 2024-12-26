document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const userList = document.getElementById('userList');
  const chatWindow = document.getElementById('chatWindow');
  const chatMessage = document.getElementById('chatMessage');
  const sendMessage = document.getElementById('sendMessage');

  if (!token) {
    alert('Unauthorized access. Please log in.');
    window.location.href = '/users/login';
    return;
  }

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/messages/dashboard/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const rawData = await response.text(); // Fetch raw text
      //console.log(rawData); // Log the raw response
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
  
      const data = JSON.parse(rawData); // Parse as JSON
      
      // Clear previous data
      userList.innerHTML = '';
      chatWindow.innerHTML = '';
  
      // Render user list
      data.users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user.name;
        userList.appendChild(li);
      });
  
      // Render chat messages
      data.messages.forEach((msg) => {
        const p = document.createElement('p');
        p.textContent = `${msg.sender}: ${msg.message}`;
        chatWindow.appendChild(p);
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load dashboard data.');
    }
  };
  
  // Initial load
  await loadDashboardData();
// Fetch new messages and update the screen
  // setInterval(async () => {
  //   await loadDashboardData(); 
  // }, 1000);

  // Add event listener for sending a message
  sendMessage.addEventListener('click', async () => {
    const message = chatMessage.value;

    if (message.trim()) {
      try {
        const sendResponse = await fetch('/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        });

        if (!sendResponse.ok) throw new Error('Failed to send message');

        // Refresh chat messages after successful send
        chatMessage.value = '';
        await loadDashboardData();
      } catch (err) {
        console.error(err);
        alert('Failed to send message.');
      }
    }
  });
});
