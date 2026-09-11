import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";

// Create the OpenAI client, prioritizing Agent Router settings
const openai = new OpenAI({
  apiKey: process.env.AGENT_ROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AGENT_ROUTER_BASE_URL || "https://api.agentrouter.org/v1", // Adjust to Agent Router's actual base URL if different
});

export const generateAnswerFn = createServerFn({ method: "POST" })
  .validator((data: { prompt: string }) => data)
  .handler(async ({ data }) => {
    try {
      if (!process.env.AGENT_ROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
        throw new Error("AI API key is missing on the server.");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fallback, AgentRouter allows dynamic model routing
        messages: [
          { role: "system", content: "You are a helpful expert assistant. Provide a highly accurate and concise response." },
          { role: "user", content: data.prompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      return { answer: response.choices[0]?.message?.content || "No response generated." };
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      throw new Error(error.message || "Failed to generate answer.");
    }
  });
