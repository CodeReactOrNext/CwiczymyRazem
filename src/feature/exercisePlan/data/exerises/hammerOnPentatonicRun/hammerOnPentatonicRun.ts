import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const hammerOnPentatonicRunExercise: Exercise = {
  id: "hammer_on_pentatonic_run",
  title: "Hammer-on Pentatonic Run – 3 Strings",
  description:
    "Legato hammer-on exercise using the A minor pentatonic scale across 3 strings (G→B→e→B). One bar of 8th notes: pick the first note on each string, hammer-on the second, then reverse back to B — building left-hand strength and smooth cross-string transitions.",
  difficulty: "easy",
  category: "technique",
  timeInMinutes: 1,
  instructions: [
    "Pick only the first note on each string, then hammer-on to the second note.",
    "Follow the string order: G (5→7), B (5→8), e (5→8), then back to B (5→8).",
    "Keep each hammer-on strong and equal in volume to the picked note.",
    "Repeat the pattern continuously without stopping between cycles.",
    "Mute unused strings with your fretting hand to keep the sound clean."
  ],
  tips: [
    "Hammer firmly — the goal is equal volume between picked and hammered notes.",
    "Keep fingers close to the fretboard to reduce movement and increase speed.",
    "The direction change at the top (e→B) is the trickiest part — practice it slowly first.",
    "Avoid squeezing the neck — use focused finger strength, not grip tension.",
    "Once comfortable, try reversing the entire pattern using pull-offs."
  ],
  metronomeSpeed: { min: 60, max: 160, recommended: 60 },
  examBacking: { url: "/static/sounds/exercise/hammer_on_pentatonic_run___3_strings_backing_track (1).mp3", sourceBpm: 60 },
  relatedSkills: ["legato"],
  tablature: [
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 3,
            fret: 7,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 1,
            fret: 8,
            isHammerOn: true
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 5
          }
        ]
      },
      {
        duration: 0.5,
        notes: [
          {
            string: 2,
            fret: 8,
            isHammerOn: true
          }
        ]
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 4,
        notes: []
      }
    ]
  },
  {
    timeSignature: [
      4,
      4
    ],
    beats: [
      {
        duration: 4,
        notes: []
      }
    ]
  }
],
};
