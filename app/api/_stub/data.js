// 15 fixed categories (for reference)
export const CATEGORIES = [
  "Creative & Design","Technical & IT","Business & Management","Communication & Interpersonal",
  "Health & Wellness","Education & Training","Home & Lifestyle","Handiwork & Maintenance",
  "Digital & Social Media","Language & Translation","Financial & Accounting","Sports & Fitness",
  "Arts & Performance","Culture & Diversity","Research & Critical Thinking",
]

// Minimal realistic users for matching demo.
// Availability: 0..3; Reputation = avgStars + ln(1+ratingCount)
export const USERS = [
  {
    id: 101, name: "Alex Cruz", location: "Manila, NCR", verified: true,
    avgStars: 4.6, ratingCount: 18, availability: 3,
    offers: [ { category: "Education & Training", sub: "Calculus tutoring" }, { category: "Technical & IT", sub: "Web debugging" } ],
    wants:  [ { category: "Creative & Design", sub: "Logo ideation" } ]
  },
  {
    id: 102, name: "Bea Santos", location: "Quezon City, NCR", verified: false,
    avgStars: 4.2, ratingCount: 9, availability: 2,
    offers: [ { category: "Creative & Design", sub: "Poster design" } ],
    wants:  [ { category: "Education & Training", sub: "Algebra help" }, { category: "Technical & IT" } ]
  },
  {
    id: 103, name: "Carlo Dela Vega", location: "Cebu City, Cebu", verified: true,
    avgStars: 4.9, ratingCount: 42, availability: 1,
    offers: [ { category: "Language & Translation", sub: "EN↔PH" } ],
    wants:  [ { category: "Technical & IT", sub: "React tutoring" } ]
  },
  {
    id: 104, name: "Diane Lee", location: "Manila, NCR", verified: false,
    avgStars: 3.8, ratingCount: 3, availability: 2,
    offers: [ { category: "Technical & IT", sub: "Next.js help" } ],
    wants:  [ { category: "Communication & Interpersonal", sub: "Copy review" } ]
  },
  {
    id: 105, name: "EJ Ramos", location: "Makati, NCR", verified: true,
    avgStars: 4.4, ratingCount: 25, availability: 3,
    offers: [ { category: "Communication & Interpersonal", sub: "Copywriting" } ],
    wants:  [ { category: "Education & Training", sub: "Calculus" }, { category: "Technical & IT" } ]
  },
  {
    id: 106, name: "Faye Navarro", location: "Davao City, Davao", verified: false,
    avgStars: 4.1, ratingCount: 7, availability: 1,
    offers: [ { category: "Digital & Social Media", sub: "TikTok edits" } ],
    wants:  [ { category: "Language & Translation" } ]
  },
  // >>> add barter-compatible calc ↔ copy so you get ~5 ranked hits <<<
  {
    id: 107, name: "Gio Perez", location: "Manila, NCR", verified: true,
    avgStars: 4.5, ratingCount: 11, availability: 3,
    offers: [ { category: "Education & Training", sub: "Calculus tutoring" } ],
    wants:  [ { category: "Communication & Interpersonal", sub: "Copywriting" } ]
  },
  {
    id: 108, name: "Hana Kim", location: "Manila, NCR", verified: false,
    avgStars: 4.2, ratingCount: 8, availability: 2,
    offers: [ { category: "Education & Training", sub: "Calculus problem solving" } ],
    wants:  [ { category: "Communication & Interpersonal", sub: "Copy editing" } ]
  },
  {
    id: 109, name: "Ivan Reyes", location: "Makati, NCR", verified: true,
    avgStars: 4.8, ratingCount: 30, availability: 1,
    offers: [ { category: "Education & Training", sub: "Calculus tutoring" } ],
    wants:  [ { category: "Communication & Interpersonal", sub: "Copywriting" } ]
  },
  {
    id: 110, name: "Jana Uy", location: "Quezon City, NCR", verified: false,
    avgStars: 4.0, ratingCount: 5, availability: 3,
    offers: [ { category: "Education & Training", sub: "Calculus review" } ],
    wants:  [ { category: "Communication & Interpersonal", sub: "Copywriting" } ]
  },
  {
    id: 111, name: "Ken Santos", location: "Manila, NCR", verified: true,
    avgStars: 4.3, ratingCount: 15, availability: 2,
    offers: [ { category: "Education & Training", sub: "Calculus tutoring" } ],
    wants:  [ { category: "Communication & Interpersonal", sub: "Copywriting" } ]
  },
]