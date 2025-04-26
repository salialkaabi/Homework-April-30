import OpenAI from "openai";
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { Server } from "socket.io";

// Remove the hardcoded API key and ensure it is read from the environment
if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment variables.");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Ensure chatHistory.json exists
const chatHistoryFilePath = 'chatHistory.json';
if (!fs.existsSync(chatHistoryFilePath)) {
    fs.writeFileSync(chatHistoryFilePath, JSON.stringify([]));
}

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const io = new Server(server);

// Function to save messages to a file
function saveMessageToFile(message) {
    const filePath = 'chatHistory.json';
    fs.readFile(filePath, 'utf8', (err, data) => {
        let chatHistory = [];
        if (!err && data) {
            chatHistory = JSON.parse(data);
        }
        chatHistory.push(message);
        fs.writeFile(filePath, JSON.stringify(chatHistory, null, 2), (err) => {
            if (err) {
                console.error('Error saving message to file:', err);
            }
        });
    });
}

io.on("connection", (socket) => {
    console.log("A user connected");

    // Debugging: Log when history is requested
    socket.on("requestHistory", () => {
        console.log("History requested by client");
        const filePath = 'chatHistory.json';
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err && data) {
                const chatHistory = JSON.parse(data);
                console.log("Sending history to client:", chatHistory);
                socket.emit("loadHistory", chatHistory);
            } else {
                console.error("Error reading chat history file:", err);
            }
        });
    });

    socket.on("sendMessage", (message) => {
        console.log("Message received from client:", message); // Debugging log

        // Broadcast the message to all connected clients
        io.emit("receiveMessage", message);

        // Save the message to a file
        saveMessageToFile(message);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Endpoint to fetch messages
app.get('/messages', async (req, res) => {
    try {
        const response = await client.responses.create({
            model: "gpt-4.1",
            input: "Write a new comment message."
        });

        fs.readFile('messages.json', 'utf8', (err, data) => {
            if (err) {
                res.status(500).send('Error reading messages');
            } else {
                res.json({
                    messages: JSON.parse(data),
                    aiResponse: response
                });
            }
        });
    } catch (error) {
        res.status(500).send('Error fetching AI response');
    }
});

// Endpoint to post a new message
app.post('/messages', (req, res) => {
    const newMessage = req.body;
    fs.readFile('messages.json', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading messages');
        } else {
            const messages = JSON.parse(data);
            messages.push(newMessage);
            fs.writeFile('messages.json', JSON.stringify(messages, null, 2), (err) => {
                if (err) {
                    res.status(500).send('Error saving message');
                } else {
                    res.status(201).send('Message saved');
                }
            });
        }
    });
});