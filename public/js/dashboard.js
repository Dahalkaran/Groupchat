//import {io} from "socket.io-client"
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('Unauthorized access. Please log in.');
    window.location.href = '/users/login';
    return;
  }
 
  const userList = document.getElementById('userList');
  const groupList = document.getElementById('groupList');
  const chatWindow = document.getElementById('chatWindow');
  const chatMessage = document.getElementById('chatMessage');
  const sendMessage = document.getElementById('sendMessage');
  const createGroupButton = document.getElementById('createGroup');
  const groupNameInput = document.getElementById('groupName');
  const userSelect = document.getElementById('userSelect');
  const inviteSection = document.getElementById('inviteSection');
  const maxStoredChats = 10;
  let selectedGroupId = null;
  let lastMessageId = null;
  let messageFetchInterval = null;
  const socket = io('http://localhost:3000', {
    auth: { token },
  });
  //console.log(socket)
  inviteSection.style.display = 'none';

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
     // console.log(response.data)
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
  
    const formattedMessages = newMessages.map((msg) => ({
      id: msg.id,
      message: msg.message,
      sender: msg.sender ,//|| 'Unknown', // Ensure sender is always present
      groupId: msg.groupId,
      createdAt: msg.createdAt || new Date().toISOString(), // Ensure createdAt is set
    }));
     console.log(formattedMessages);
    const allMessages = [...storedMessages, ...formattedMessages];
    const trimmedMessages = allMessages.slice(-maxStoredChats);
    localStorage.setItem(`chatMessages_${groupId}`, JSON.stringify(trimmedMessages));
  };
  
  const loadMessagesFromLocal = (groupId) => {
    const storedMessages = JSON.parse(localStorage.getItem(`chatMessages_${groupId}`)) || [];
    chatWindow.innerHTML = '';
  
    storedMessages.forEach((msg) => {
      const p = document.createElement('p');
      const sender = msg.sender ;//|| 'Unknown'; // Fallback for undefined sender
      p.textContent = `${sender}: ${msg.message}`;
      chatWindow.appendChild(p);
    });
  
    return storedMessages.length > 0 ? storedMessages[storedMessages.length - 1].id : null;
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

  // Function to fetch and display group members
  const fetchGroupMembers = async (groupId) => {
    try {
      const response = await axios.get(`/groups/members/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { members } = response.data;
  
      // Clear existing members
      userList.innerHTML = '';
  
      // Get the current user's ID from the token
      const currentUser = JSON.parse(atob(token.split('.')[1])).userId;
  
      members.forEach((member) => {
        const li = document.createElement('li');
  
        // Show "You" for the current user
        const userName =
          member.id === currentUser ? `${member.name} (You)` : member.name;
        li.textContent = `${userName} (${member.email})${member.isAdmin ? ' - Admin' : ''}`;
  
        // Add "Make Admin" button for non-admin members (not "You")
        if (!member.isAdmin && member.id !== currentUser) {
          const makeAdminButton = document.createElement('button');
          makeAdminButton.textContent = 'Make Admin';
          makeAdminButton.addEventListener('click', async () => {
            try {
              await axios.post(
                '/groups/make-admin',
                { groupId, userId: member.id },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              alert(`${member.name} has been promoted to admin.`);
              await fetchGroupMembers(groupId); // Reload the members list
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.message || 'Failed to make admin.');
            }
          });
          li.appendChild(makeAdminButton);
        }
  
        // Add "Delete Admin" button for admin members (not "You")
        if (member.isAdmin && member.id !== currentUser) {
          const deleteAdminButton = document.createElement('button');
          deleteAdminButton.textContent = 'Delete Admin';
          deleteAdminButton.addEventListener('click', async () => {
            try {
              const response = await axios.post(
                '/groups/revoke-admin',
                { groupId, userId: member.id },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.data.isAdminActionAllowed === false) {
                alert('You are not the admin.');
              } else {
                alert(`${member.name} is no longer an admin.`);
                await fetchGroupMembers(groupId); // Reload the members list
              }
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.message || 'Failed to revoke admin rights.');
            }
          });
          li.appendChild(deleteAdminButton);
        }
  
        // Add "Delete Member" button for all non-admin members (not "You")
        if (!member.isAdmin && member.id !== currentUser) {
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete Member';
          deleteButton.addEventListener('click', async () => {
            try {
              const response = await axios.post(
                '/groups/remove-user',
                { groupId, userId: member.id },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (response.data.isAdminActionAllowed === false) {
                alert('You are not the admin.');
              } else {
                alert(`${member.name} has been removed from the group.`);
                await fetchGroupMembers(groupId); // Reload the members list
              }
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.message || 'Failed to delete member.');
            }
          });
          li.appendChild(deleteButton);
        }
  
        userList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load group members.');
    }
  };
  
  const fetchNewMessages = async (groupId) => {
    try {
      const response = await axios.get(`/groups/messages/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Save fetched messages to local storage
      saveMessagesToLocal(groupId, response.data.messages);
  
      // Load messages into the chat window
      loadMessagesFromLocal(groupId);
  
      return response.data.messages;
    } catch (err) {
      console.error(err);
      alert('Failed to fetch new messages.');
      return [];
    }
  };
  

  
 
  const selectGroup = async (groupId, groupName) => {
    inviteSection.style.display = 'block';
    selectedGroupId = groupId;
    document.getElementById('currentGroupName').textContent = `Chatting in: ${groupName}`;
    chatWindow.innerHTML = '';
  
    lastMessageId = loadMessagesFromLocal(groupId);
  
    socket.emit('joinGroup', groupId); // Join the group room in socket.io
  
    await fetchGroupMembers(groupId);
  
    const messages = await fetchNewMessages(groupId); // Fetch messages when selecting a group
    if (messages.length > 0) {
      lastMessageId = messages[messages.length - 1].id; // Update lastMessageId
    }
  };
  

  createGroupButton.addEventListener('click', async () => {
    const name = groupNameInput.value.trim();
    if (!name) return alert('Group name is required');
    try {
      await axios.post(
        '/groups/create',
        { name },
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
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
          '/groups/messages',
          { message, groupId: selectedGroupId },
          { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
        );
        chatMessage.value = '';
      } catch (err) {
        console.error(err);
        alert('Failed to send message.');
      }
    }
  });

  document.getElementById('inviteUser').addEventListener('click', async () => {
    const userId = userSelect.value;
    if (!userId) return alert('Please select a user to invite');
    if (!selectedGroupId) return alert('Please select a group first.');
    try {
      const response = await axios.post(
        '/groups/invite',
        { groupId: selectedGroupId, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || 'User invited successfully');
  
      // Call the functions to reload the updated data
      await fetchGroupMembers(selectedGroupId); // Reload group members
      await fetchGroups(); // Reload the group list (if needed)
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to invite user');
    }
  });
  socket.on('newMessage', async (message) => {
    //console.log('New message received via socket:', message);
    
    // Fetch sender's details based on userId
    try {
      const response = await axios.get(`/users/${message.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const sender = response.data.name;  // Assuming the response contains the sender's name
      if (selectedGroupId === message.groupId) {
        // Save the message with the sender's name
        saveMessagesToLocal(message.groupId, [{ ...message, sender }]); // Ensure sender is saved
        lastMessageId = message.id; // Set lastMessageId to the ID of the new message
        loadMessagesFromLocal(message.groupId);
      }
    } catch (err) {
      console.error('Failed to fetch sender details:', err);
      alert('Failed to load sender information.');
    }
  });
  
  

  await fetchUsers();
  await fetchGroups();
});   