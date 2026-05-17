import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import chromaticAccentsImage from "./image.png";


export const chromaticAccentsExercise: Exercise = {
  id: "chromatic_accents",
  title: "Chromatic Accent Dynamics",
  description: "Master your dynamic control by playing a chromatic sequence with shifting accents. You will learn to control your pick attack to make accented notes significantly louder and non-accented notes noticeably quieter.",
  whyItMatters: "This exercise develops precise dynamic control over your pick attack. It teaches you to differentiate accented and normal notes, which is essential for groove, phrasing, and expressive playing.",
  difficulty: "medium",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Play the chromatic sequence across the strings, strictly following the accent markers (>).",
    "Make accented notes significantly louder and non-accented notes whisper-soft.",
  ],
  tips: [
    "Exaggerate the volume difference — strike accents hard and brush normal notes gently.",
    "Keep your metronome slow and focus entirely on dynamic control.",
    "Ensure your timing remains perfectly even; do not rush the loud notes.",
  ],
  metronomeSpeed: {
    min: 60,
    max: 140,
    recommended: 80
  },
  tablature: [
    {
      "timeSignature": [
        4,
        4
      ],
      "beats": [
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 1,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 1,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 1,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 1,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 4
            }
          ]
        }
      ]
    },
    {
      "timeSignature": [
        4,
        4
      ],
      "beats": [
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 1,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 1,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 1,
              "isAccented": false
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 2,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 1,
              "isAccented": false
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 2,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 4
            }
          ]
        }
      ]
    },
    {
      "timeSignature": [
        4,
        4
      ],
      "beats": [
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 2,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 2,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 3,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 6,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 3,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 4
            }
          ]
        }
      ]
    },
    {
      "timeSignature": [
        4,
        4
      ],
      "beats": [
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 3,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 3,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 3,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 3,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 1,
              "fret": 4,
              "isAccented": false
            }
          ]
        }
      ]
    },
    {
      "timeSignature": [
        4,
        4
      ],
      "beats": [
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 2,
              "fret": 4,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 3
              
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 3,
              "fret": 4,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 4,
              "fret": 4,
              "isAccented": true
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.5,
          "notes": [
            {
              "string": 5,
              "fret": 4,
              "isAccented": true
            }
          ]
        }
      ]
    }
  ],
  relatedSkills: ["alternate_picking", "articulation"],
  image: chromaticAccentsImage,
}; 