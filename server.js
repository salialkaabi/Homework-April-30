import OpenAI from "openai";
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

// Remove the hardcoded API key and ensure it is read from the environment
if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in the environment variables.");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
const PORT = 3000;

app.use(bodyParser.json());

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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});