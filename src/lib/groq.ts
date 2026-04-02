import { Groq } from "groq-sdk";

let groqClient: any = null;

const getGroqClient = () => {
    if (groqClient) return groqClient;

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
        console.warn("GROQ_API_KEY is missing. AI features will not be available.");
        return null;
    }

    try {
        groqClient = new Groq({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });
        return groqClient;
    } catch (err) {
        console.error("Failed to initialize Groq client:", err);
        return null;
    }
};

export const getGroqCompletion = async (prompt: string, systemMessage: string = "You are an AI assistant for GOPHORA, a platform for work, education and investment.") => {
    try {
        const client = getGroqClient();
        if (!client) {
            return "Error: AI Config missing. Please try again later.";
        }

        const chatCompletion = await client.chat.completions.create({
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
            ],
            model: "llama-3.3-70b-versatile",
        });
        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq API Error:", error);
        return `Error: ${error instanceof Error ? error.message : "AI unreachable"}`;
    }
};

export default getGroqCompletion;
