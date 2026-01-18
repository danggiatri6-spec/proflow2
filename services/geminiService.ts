
import { GoogleGenAI, Type } from "@google/genai";
import { GoalDescription, AiSettings } from "../types";

export const getCacheKey = (goal: string, settings: AiSettings): string => {
  return `cache_${settings.model}_${settings.language}_${goal.trim().toLowerCase().substring(0, 50)}`;
};

export const generateGoalDescription = async (goal: string, settings: AiSettings): Promise<GoalDescription> => {
  // Use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are a professional life coach and strategic planner. 
  Your task is to turn raw goals into structured, inspiring descriptions and a clear roadmap of 3-5 specific steps. 
  IMPORTANT: You MUST provide all output in ${settings.language}. 
  Output must be in JSON format. ${settings.customInstructions}`;

  const response = await ai.models.generateContent({
    model: settings.model,
    contents: `Please refine this goal: "${goal}". Provide a polished description, a motivational insight, and decompose it into specific, actionable steps.`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shortDescription: {
            type: Type.STRING,
            description: "A concise, professional description of the goal.",
          },
          motivation: {
            type: Type.STRING,
            description: "A one-sentence motivational insight.",
          },
          steps: {
            type: Type.ARRAY,
            description: "A list of actionable steps to achieve the goal.",
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "A short, punchy title for the step." },
                description: { type: Type.STRING, description: "A brief explanation of how to execute this step." }
              },
              required: ["title", "description"]
            }
          }
        },
        required: ["shortDescription", "motivation", "steps"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as GoalDescription;
};

export const generateStepSolution = async (goalContext: string, stepDescription: string, settings: AiSettings): Promise<string> => {
  // Use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are an expert tactical advisor. 
  Your task is to provide clear, practical 'how-to' instructions for a specific step. 
  IMPORTANT: You MUST provide all output in ${settings.language}. 
  ${settings.customInstructions}`;

  const response = await ai.models.generateContent({
    model: settings.model,
    contents: `The overall goal is: "${goalContext}". I am at the following step: "${stepDescription}". Please provide a detailed, actionable solution.`,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Could not generate solution for this step.");
  return text;
};
