// pages/api/analyzeTranscript.ts

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
    const ageClues = transcript.match(/(\d+)\s*(years\s*old|year\s*old|yo)/i);
    let age: number | null = null; 
    if (ageClues && ageClues[1]) {
      age = parseInt(ageClues[1], 10);
    }

    const professionClues = transcript.match(/(software\s*engineer|doctor|teacher|entrepreneur)/gi);
    const profession = professionClues ? professionClues[0] : null;

    const personalityKeywords = {
      outgoing: ['energetic', 'enthusiastic', 'social', 'talkative', 'extroverted'],
      introverted: ['reserved', 'shy', 'quiet', 'thoughtful', 'reflective'],
      creative: ['artistic', 'imaginative', 'innovative', 'original', 'inventive']
    };

    let personality = '';
    for (const key in personalityKeywords) {
      if (personalityKeywords[key as keyof typeof personalityKeywords].some(keyword => transcript.includes(keyword))) {
        personality = key;
        break;
      }
    }

    const motivationKeywords = {
      learning: ['learn', 'study', 'understand', 'knowledge'],
      helping: ['help', 'support', 'assist', 'care'],
      creating: ['build', 'design', 'create', 'invent']
    };

    let motivations = '';
    for (const key in motivationKeywords) {
      if (motivationKeywords[key as keyof typeof motivationKeywords].some(keyword => transcript.includes(keyword))) {
        motivations = key;
        break;
      }
    }

    let youAreA = "You are a ";
    if (age) {
      youAreA += `${age} year old `;
    }
    if (profession) {
      youAreA += `${profession} `;
    }
    youAreA += "who..."; 

    const characterAnalysis: CharacterAnalysis = {
      youAreA,
      personality,
      background: "",
      communicationStyle: "",
      motivations,
      examples: [],
    };

    return characterAnalysis;
  } catch (error) {
    console.error("Error analyzing transcript:", error);
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
