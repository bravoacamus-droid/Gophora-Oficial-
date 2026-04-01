import { Groq } from "groq-sdk";

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true, // Needed for client-side usage in this project
});

export const getGroqCompletion = async (prompt: string, systemMessage: string = "You are an AI assistant for GOPHORA, a platform for work, education and investment.") => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
            ],
            model: "llama-3.3-70b-versatile",
        });
        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq API Error:", error);
        throw error;
    }
};

export default groq;
