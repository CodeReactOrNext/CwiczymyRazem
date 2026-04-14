import type { Exercise } from "feature/exercisePlan/types/exercise.types";



export const spiderStairsHardExercise: Exercise = {
  id: "spider_stairs_hard",
  title: "Advanced Spider Stairs Exercise",
  description: "Advanced version of the stairs exercise with wider note intervals and faster tempo.",
  difficulty: "hard",
  category: "technique",
  timeInMinutes: 5,
  instructions: [
    "Start from the first fret on the E string, using fingers 1-2-4.",
    "Move to the next string shifting two frets higher.",
    "Continue the pattern until the highest string, increasing finger stretch.",
    "Return the same way down, maintaining movement precision."
  ],
  tips: [
    "Pay special attention to precision with wider stretches.",
    "Maintain proper wrist position despite larger distances.",
    "Control pressure - it's easy to press too hard with wider stretches.",
    "If you feel discomfort, reduce tempo.",

  ],
  tablature: [
    {
      "timeSignature": [
        4,
        4
      ],
      "beats": [
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 1
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 5
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 5
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
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 5
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 6
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 5
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 6
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 3,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 6,
              "fret": 5
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 2
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 3
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 4,
              "fret": 4
            }
          ]
        },
        {
          "duration": 0.25,
          "notes": [
            {
              "string": 1,
              "fret": 5
            }
          ]
        }
      ]
    }
  ],
  metronomeSpeed: {
    min: 40,
    max: 200,
    recommended: 50,
  },
  relatedSkills: ["finger_independence"],
};