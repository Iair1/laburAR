import OpenAI from "openai";

const openai = new OpenAI();

async function probar(question) {
  try {
    console.log("Sending request...");

    const response = await openai.responses.create({
      model: "gpt-5.6",
      input: question,
    });

    return response.output_text;
  } catch (error) {
    console.error("OpenAI request failed:");

    console.error("=== OPENAI ERROR ===");
    console.error("name:", error.name);
    console.error("message:", error.message);
    console.error("status:", error.status);
    console.error("code:", error.code);
    console.error("cause:", error.cause);
    console.error("full error:", error);
  
    throw error;
  }
}

//probar("Cuanto es 1+1? Responde y haz un cuestionamiento filosofico sobre las bananas.")

const PruebaChatService = {
    probar
}
export default PruebaChatService