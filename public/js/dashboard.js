document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const userList = document.getElementById('userList');
  const chatWindow = document.getElementById('chatWindow');
  const chatMessage = document.getElementById('chatMessage');
  const sendMessage = document.getElementById('sendMessage');
  const maxStoredChats = 10; // Store a maximum of 10 chats in local storage

  if (!token) {
    alert('Unauthorized access. Please log in.');
    window.location.href = '/users/login';
    return;
  }

  const saveMessagesToLocal = (messages) => {
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const allMessages = [...storedMessages, ...messages];
    
    // Keep only the last 10 messages
    const trimmedMessages = allMessages.slice(-maxStoredChats);
    localStorage.setItem('chatMessages', JSON.stringify(trimmedMessages));
  };

  const loadMessagesFromLocal = () => {
    const storedMessages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    chatWindow.innerHTML = ''; // Clear previous messages
    storedMessages.forEach((msg) => {
      const p = document.createElement('p');
      p.textContent = `${msg.sender}: ${msg.message}`;
      chatWindow.appendChild(p);
    });
    return storedMessages.length > 0 ? storedMessages[storedMessages.length - 1].id : null; // Return the ID of the last stored message
  };

  const fetchNewMessages = async (lastMessageId) => {
    try {
      const response = await fetch(`/messages/dashboard/data?lastMessageId=${lastMessageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch new messages');
      return await response.json();
    } catch (err) {
      console.error(err);
      alert('Failed to fetch new messages.');
      return { users: [], messages: [] }; // Return empty data in case of error
    }
  };

  const loadDashboardData = async () => {
    const lastMessageId = loadMessagesFromLocal(); // Load messages from local storage and get the last message ID
    const { users, messages } = await fetchNewMessages(lastMessageId); // Fetch new messages from the backend
    
    // Update user list
    userList.innerHTML = ''; // Clear previous user list
    users.forEach((user) => {
      const li = document.createElement('li');
      li.textContent = user.name;
      userList.appendChild(li);
    });

    // Append new messages to local storage and chat window
    saveMessagesToLocal(messages);
    loadMessagesFromLocal(); // Reload messages from local storage to show the latest ones
  };

  // Initial load
  await loadDashboardData();

  // Poll for new messages every second
  setInterval(async () => {
    await loadDashboardData();
  }, 1000);

  // Send a message
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
        chatMessage.value = ''; // Clear input field
        await loadDashboardData(); // Fetch new messages after sending
      } catch (err) {
        console.error(err);
        alert('Failed to send message.');
      }
    }
  });
});
