import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCZoqgUeBRoxuwSr7yrKl5oGiMCAlHUVig';
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-lite',
            systemInstruction: "You are a test assistant.",
        });

        const history = [
            { role: 'user', parts: [{ text: "Hello" }] }
        ];

        const chat = model.startChat({ history });
        const result = await chat.sendMessage("test");
        console.log("SUCCESS:", result.response.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}

test();
