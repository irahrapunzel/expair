// data/ai/seed.ts
export type Candidate = {
  userId: string;
  name: string;
  city?: string;
  mode?: "Onsite" | "Online Sync" | "Online Async" | "Hybrid";
  availability?: string[];
  reputation?: { stars?: number; completed?: number; level?: number };
  generalSkills?: string[];
  offers: { skill: string; level: "Beginner"|"Intermediate"|"Advanced"|"Certified"; minutesDefault?: number; specialized?: boolean }[];
};

export const candidates: Candidate[] = [
  {
    userId: "U5",
    name: "Ana",
    city: "Manila",
    mode: "Online Sync",
    availability: ["weeknights"],
    reputation: { stars: 4.8, completed: 18, level: 12 },
    generalSkills: ["Languages & Translation"],
    offers: [
      { skill: "Language Tutoring", level: "Intermediate", minutesDefault: 60 },
      { skill: "Translation", level: "Advanced", minutesDefault: 90, specialized: true }
    ]
  },
  {
    userId: "U7",
    name: "Rafael",
    city: "Quezon City",
    mode: "Online Async",
    availability: ["weeknights","weekends"],
    reputation: { stars: 4.6, completed: 9, level: 9 },
    generalSkills: ["Education & Training"],
    offers: [
      { skill: "Tutoring", level: "Intermediate", minutesDefault: 60 },
      { skill: "Curriculum Development", level: "Advanced", minutesDefault: 120 }
    ]
  },
  // add 5–15 more copied from the FE lists you’re already rendering
];