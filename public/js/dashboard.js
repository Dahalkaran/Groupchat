document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const userList = document.getElementById('userList');
  const groupList = document.getElementById('groupList');
  const chatWindow = document.getElementById('chatWindow');
  const chatMessage = document.getElementById('chatMessage');
  const sendMessage = document.getElementById('sendMessage');
  const createGroupButton = document.getElementById('createGroup');
  const groupNameInput = document.getElementById('groupName');
  const userSelect = document.getElementById('userSelect');
  const maxStoredChats = 10; // Store a maximum of 10 chats per group in local storage
  let selectedGroupId = null;
  let lastMessageId = null;
  let messageFetchInterval = null; // Variable to store the interval ID

  if (!token) {
    alert('Unauthorized access. Please log in.');
    window.location.href = '/users/login';
    return;
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { users } = response.data;
      userSelect.innerHTML = '<option value="">Select User</option>';

      users.forEach((user) => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        userSelect.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load users.');
    }
  };

  const saveMessagesToLocal = (groupId, messages) => {
    const storedMessages = JSON.parse(localStorage.getItem(`chatMessages_${groupId}`)) || [];
    const existingMessageIds = new Set(storedMessages.map((msg) => msg.id));
    const newMessages = messages.filter((msg) => !existingMessageIds.has(msg.id));
    const allMessages = [...storedMessages, ...newMessages];
    const trimmedMessages = allMessages.slice(-maxStoredChats);
    localStorage.setItem(`chatMessages_${groupId}`, JSON.stringify(trimmedMessages));
  };

  const loadMessagesFromLocal = (groupId) => {
    const storedMessages = JSON.parse(localStorage.getItem(`chatMessages_${groupId}`)) || [];
    chatWindow.innerHTML = '';
    storedMessages.forEach((msg) => {
      const p = document.createElement('p');
      p.textContent = `${msg.sender}: ${msg.message}`;
      chatWindow.appendChild(p);
    });
    return storedMessages.length > 0 ? storedMessages[storedMessages.length - 1].id : null;
  };

  const fetchNewMessages = async (groupId, lastMessageId) => {
    try {
      const response = await axios.get(`/groups/messages/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { lastMessageId },
      });
      return response.data;
    } catch (err) {
      console.error(err);
      alert('Failed to fetch new messages.');
      return { messages: [] };
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { groups } = response.data;

      groupList.innerHTML = '';
      if (groups.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No groups available. Create a group!';
        groupList.appendChild(li);
      } else {
        groups.forEach((group) => {
          const li = document.createElement('li');
          li.textContent = group.name;
          li.addEventListener('click', () => selectGroup(group.id, group.name));
          groupList.appendChild(li);
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load groups.');
    }
  };

  const selectGroup = async (groupId, groupName) => {
    selectedGroupId = groupId;
    document.getElementById('currentGroupName').textContent = `Chatting in: ${groupName}`;
    chatWindow.innerHTML = ''; // Clear previous messages
    lastMessageId = loadMessagesFromLocal(groupId);
  
    // Start fetching new messages
    setInterval(async () => {
      if (!selectedGroupId) return;
      const { messages } = await fetchNewMessages(groupId, lastMessageId);
      if (messages.length > 0) {
        saveMessagesToLocal(groupId, messages);
        lastMessageId = messages[messages.length - 1].id;
        loadMessagesFromLocal(groupId);
      }
    }, 2000); // Adjust polling interval as needed
  };
  createGroupButton.addEventListener('click', async () => {
    const name = groupNameInput.value.trim();
    if (!name) return alert('Group name is required');

    try {
      await axios.post(
        '/groups/create',
        { name },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      groupNameInput.value = '';
      await fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Failed to create group.');
    }
  });

  sendMessage.addEventListener('click', async () => {
    const message = chatMessage.value;
    if (!selectedGroupId) {
      alert('Please select a group to send a message.');
      return;
    }
    if (message.trim()) {
      try {
        await axios.post(
          `/groups/messages`,
          { message, groupId: selectedGroupId },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        chatMessage.value = '';
      } catch (err) {
        console.error(err);
        alert('Failed to send message.');
      }
    }
  });

  // Invite a user to the selected group
  document.getElementById('inviteUser').addEventListener('click', async () => {
    const userId = userSelect.value;
    if (!userId) {
      return alert('Please select a user to invite');
    }
    if (!selectedGroupId) {
      return alert('Please select a group first.');
    }
    try {
      const response = await axios.post(
        '/groups/invite',
        { groupId: selectedGroupId, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || 'User invited successfully');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to invite user');
    }
  });

  // Initial load of users and groups
  await fetchUsers();
  await fetchGroups();
});
