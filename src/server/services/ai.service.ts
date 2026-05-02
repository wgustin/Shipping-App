
import { GoogleGenAI, Type } from "@google/genai";
import { serverConfig } from "../config";

const aiAddressSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Full name of the person or business" },
    street1: { type: Type.STRING, description: "Street address line 1 (e.g., 123 Main St)" },
    street2: { type: Type.STRING, description: "Apartment, suite, or unit number" },
    city: { type: Type.STRING, description: "City name" },
    state: { type: Type.STRING, description: "State or province code (e.g., CA, NY)" },
    zip: { type: Type.STRING, description: "Postal or ZIP code" },
    country: { type: Type.STRING, description: "Country code (e.g., US)" },
  },
  required: ["street1", "city", "state", "zip"],
};

export async function parseAddressWithAI(rawText: string) {
  const ai = new GoogleGenAI({ apiKey: serverConfig.GEMINI_API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the postal address components from the following text into a JSON object. Text: "${rawText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: aiAddressSchema,
      temperature: 0.1,
    },
  });

  const text = response.text;
  if (!text) {
    return {};
  }

  const parsed = JSON.parse(text);
  if (!parsed.country) parsed.country = "US";

  return parsed;
}
