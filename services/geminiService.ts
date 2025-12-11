import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Address } from "../types";

// Initialize Gemini
// NOTE: In a real production app, you might proxy this through a backend to protect the key,
// but for this frontend demo, we use the env variable directly as per instructions.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const addressSchema: Schema = {
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

export const parseAddressWithAI = async (rawText: string): Promise<Partial<Address>> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning empty address.");
    return {};
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract the postal address components from the following text into a JSON object. Text: "${rawText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: addressSchema,
        temperature: 0.1, // Low temperature for deterministic extraction
      },
    });

    const text = response.text;
    if (!text) return {};

    const parsed = JSON.parse(text);
    
    // Ensure default country if missing
    if (!parsed.country) {
      parsed.country = "US";
    }

    return parsed as Partial<Address>;
  } catch (error) {
    console.error("AI Address Parsing Error:", error);
    return {};
  }
};