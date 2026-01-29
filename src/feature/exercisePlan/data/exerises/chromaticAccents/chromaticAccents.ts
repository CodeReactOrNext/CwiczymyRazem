import type { Exercise } from "feature/exercisePlan/types/exercise.types";

import chromaticAccentsImage from "./image.png";


export const chromaticAccentsExercise: Exercise = {
  id: "chromatic_accents",
  title: "Chromatic Accent Dynamics",
  description: "Exercise developing dynamic control through playing chromatic sequences with shifting accents.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Follow the chromatic sequence (frets 1-4) moving across the strings as shown in the tablature.",
    "The exercise focuses on shifting the dynamic accent through each 16th note in a group of four.",
    "Measures 1-2: Begin by accenting the 1st note of each group, then shift to the 2nd note mid-measure 2.",
    "Measure 3: Maintain the 2nd note accent, then shift to the 3rd note mid-measure 3.",
    "Measure 4: Continue accenting the 3rd note of each group across all strings.",
    "Measure 5: Complete the pattern by shifting the accent to the 4th note of each group."
  ],
  tips: [
    "The difference between accented and non-accented notes should be clearly audible.",
    "Control your pick attack - stronger for accents, lighter for other notes.",
    "Work with a metronome to maintain even timing despite dynamic changes.",
    "Initially practice slowly, increasing tempo only when you have full control over dynamics.",

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
              "fret": 5
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
  relatedSkills: ["alternate_picking", "rhythm", "technique"],
  image: chromaticAccentsImage,
}; 