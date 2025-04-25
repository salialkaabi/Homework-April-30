// This file will handle message-related operations

// Function to fetch messages from the server
async function fetchMessages() {
    const response = await fetch('/messages');
    const messages = await response.json();
    return messages;
}

// Function to send a new message to the server
async function sendMessage(content) {
    const response = await fetch('/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
    });
    return response.ok;
}

export { fetchMessages, sendMessage };