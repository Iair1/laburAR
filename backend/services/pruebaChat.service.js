import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.TIC_AI_API_KEY,
  baseURL: "https://ia.ort.edu.ar/api/v1",
});

async function probar(question) {
  try {
    console.log("Sending request...");
    
    const completion = await client.chat.completions.create({
      model: "tic-chat", // reemplazar por tic-chat, tic-code, tic-embed o tic-test
      messages: [{ role: "user", content: question }],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI request failed:");

    console.error("=== OPENAI ERROR ===");
    console.error("name:", error.name);
    console.error("status:", error.status);
    console.error("code:", error.code);
    console.error("cause:", error.cause);
    console.error("full error:", error);
    console.error("\n\nmessage:", error.message);
  
    throw error;
  }
}

//probar("Cuanto es 1+1? Responde y haz un cuestionamiento filosofico sobre las bananas.")

const PruebaChatService = {
    probar
}
export default PruebaChatService