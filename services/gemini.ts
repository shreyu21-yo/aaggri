const API_URL = "https://agrii-4fcm.onrender.com/api/gemini";

export const askGemini = async (prompt: string) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    return data.reply;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI is not available right now";
  }
};
