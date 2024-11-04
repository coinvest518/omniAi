// pages/api/analyzeTranscript.ts
// ... (no need to import CharacterAnalysis, it's already in this file)

export interface CharacterAnalysis {
  youAreA: string;
  personality: string;
  background: string;
  communicationStyle: string;
  motivations: string;
  examples: string[];
}

export function analyzeTranscript(transcript: string): CharacterAnalysis {
  try {
    // 1. Analysis Phase (Manual for now):
    // TODO: In the future, replace this manual analysis with NLP techniques
    //       using libraries like Natural or Compromise.

    // Example manual analysis (replace with your actual logic):
    const ageClues = transcript.match(/(\d+)\s*(years\s*old|year\s*old|yo)/i);
    let age: number | null = null; // Initialize to null
    if (ageClues && ageClues[1]) {
      age = parseInt(ageClues[1], 10);
    }
    if (age != null) { // Check if age is not null before using it
      console.log(`The age is ${age}`); // Safe to use age here
    }

    const professionClues = transcript.match(/(software\s*engineer|doctor|teacher|entrepreneur)/gi);
    const profession = professionClues ? professionClues[0] : null;

    // ... (Analyze other aspects like personality, communication style, motivations)

    // Personality Keywords
    const personalityKeywords = {
      outgoing: ['energetic', 'enthusiastic', 'social', 'talkative', 'extroverted'],
      introverted: ['reserved', 'shy', 'quiet', 'thoughtful', 'reflective'],
      creative: ['artistic', 'imaginative', 'innovative', 'original', 'inventive']
    };

    let personality = ''; // Initialize personality
    for (const key in personalityKeywords) {
      if (personalityKeywords[key as keyof typeof personalityKeywords].some(keyword => transcript.includes(keyword))) {
        personality = key;
        break;
      }
    }

    // Motivation Keywords
    const motivationKeywords = {
      learning: ['learn', 'study', 'understand', 'knowledge'],
      helping: ['help', 'support', 'assist', 'care'],
      creating: ['build', 'design', 'create', 'invent']
    };

    let motivations = ''; // Initialize motivations
    for (const key in motivationKeywords) {
      if (motivationKeywords[key as keyof typeof motivationKeywords].some(keyword => transcript.includes(keyword))) {
        motivations = key;
        break;
      }
    }

    // 2. Character Sheet Drafting:
    let youAreA = "You are a ";

    if (age) {
      youAreA += `${age} year old `;
    }

    if (profession) {
      youAreA += `${profession} `;
    }

    // ... (Add more to the "You are a..." statement based on analysis)

    youAreA += "who..."; // Complete the sentence

    const characterAnalysis: CharacterAnalysis = {
      youAreA: youAreA,
      personality: personality, // Fill based on analysis
      background: "", // Fill based on analysis
      communicationStyle: "", // Fill based on analysis
      motivations: motivations, // Fill based on analysis
      examples: [
        // Find relevant quotes from the transcript to support the analysis
      ],
    };

    // 3. Validation and Refinement (Manual for now):
    // TODO: In the future, add automated validation and refinement steps.

    return characterAnalysis;
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    // Return a default or error object
    return {
      youAreA: "Error analyzing transcript",
      personality: "",
      background: "",
      communicationStyle: "",
      motivations: "",
      examples: [],
    };
  }
}