import { doc, getDoc } from "firebase/firestore";
import { convertMsToHM } from "utils/converter";
import { jokes } from "utils/discord/randomMessage";
import type {
  FirebaseLogsInterface,
  FirebaseLogsSongsInterface,
} from "utils/firebase/client/firebase.types";
import { db } from "utils/firebase/client/firebase.utils";

const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data()?.displayName || userId;
    }
    return userId;
  } catch  {
    return userId;
  }
};

const formatLearnedMessage = async (log: FirebaseLogsSongsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  return {
    embeds: [
      {
        title: "Utwór Opanowany",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** nauczył się utworu **${log.songArtist} ${log.songTitle}**`,
        color: 0x2ecc71,
      },
    ],
  };
};

const formatWantToLearnMessage = async (log: FirebaseLogsSongsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  return {
    embeds: [
      {
        title: "Nauka Utworu",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** chce nauczyć się utworu **${log.songArtist} ${log.songTitle}**`,
        color: 0xf1c40f,
      },
    ],
  };
};

const formatLearningMessage = async (log: FirebaseLogsSongsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  return {
    embeds: [
      {
        title: "Nauka Utworu",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** uczy się utworu **${log.songArtist} ${log.songTitle}**`,
        color: 0xe67e22,
      },
    ],
  };
};

const formatAddedMessage = async (log: FirebaseLogsSongsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  return {
    embeds: [
      {
        title: "Nowy Utwór Dodany",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** dodał utwór **${log.songArtist} ${log.songTitle}**`,
        color: 0x3498db,
      },
    ],
  };
};
const getStars = (rate: number) => {
  const fullStar = "⭐";
  const emptyStar = "☆";
  return `${fullStar.repeat(rate)}${emptyStar.repeat(10 - rate)}`;
};

const formatDifficultyRateMessage = async (log: FirebaseLogsSongsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  return {
    embeds: [
      {
        title: "Ocena Trudności Utworu",
        description: `**[${displayName}](<https://www.cwiczymy-razem.pl//user/${log.uid}> " ")** ocenił trudność utworu **${log.songArtist} ${log.songTitle}**`,
        color: 0x9b59b6,
        fields: [
          {
            name: "Ocena ",
            value: `${getStars(log.difficulty_rate ?? 0)} (${
              log.difficulty_rate
            }/10)`,
            inline: false,
          },
        ],
      },
    ],
  };
};

const formatGeneralLogMessage = async (log: FirebaseLogsInterface) => {
  const displayName = await getUserDisplayName(log.uid);
  const fields = [];
  const randomMessages = [
    // Punkty
    {
      condition: log.points > 70,
      message: "🏆 **Mistrz dnia!** Ponad 70 punktów – to poziom, który budzi szacunek. Nie zatrzymuj się!",
    },
    {
      condition: log.points > 50 && log.points <= 70,
      message: "🔥 **Na wysokich obrotach.** Twój wynik to przykład świetnej pracy – kontynuuj ten trend!",
    },
    {
      condition: log.points >= 30 && log.points <= 50,
      message: "✅ **Stabilna forma.** Wynik w granicach 30–50 punktów to znak, że wiesz, co robisz. Dobra robota!",
    },
    {
      condition: log.points < 30,
      message: "🌱 **Każdy zaczyna od małych kroków.** Ważne, że działasz – zaangażowanie zawsze prowadzi do sukcesu.",
    },
  
    // Czas spędzony na aktywności
    {
      condition: log.timeSumary.creativityTime > 90 * 60 * 1000,
      message: "🎨 **Twórczy geniusz.** Ponad 1,5 godziny kreatywnej pracy? Czekamy na efekty Twoich pomysłów.",
    },
    {
      condition: log.timeSumary.theoryTime > 60 * 60 * 1000,
      message: "📚 **Wiedza to potęga.** Godzina spędzona na teorii? Widać, że stawiasz na solidne fundamenty.",
    },
    {
      condition: log.timeSumary.hearingTime > 45 * 60 * 1000,
      message: "🎧 **Słuch jak złoto.** Dzisiaj Twoje uszy były w akcji – czy słyszałeś już wszystkie niuanse?",
    },
    {
      condition: log.timeSumary.techniqueTime > 120 * 60 * 1000,
      message: "🎸 **Technika na mistrzowskim poziomie.** Po dwóch godzinach ćwiczeń Twoje palce mogą konkurować z maszynami.",
    },
  
    // Nowy poziom
    {
      condition: log.newLevel?.isNewLevel && log.newLevel.level > 10,
      message: "🏅 **Witaj w elicie!** Poziom 10+ to już wyższa liga – Twoje postępy są imponujące.",
    },
    {
      condition: log.newLevel?.isNewLevel && log.newLevel.level <= 10,
      message: "🚀 **Dobra robota.** Awans na nowy poziom to dowód, że regularna praca przynosi efekty.",
    },
  
    // Osiągnięcia
    {
      condition: log.newAchievements?.length >= 5,
      message: "🌟 **Rekord osiągnięć.** 5 nowych osiągnięć? To dzień, który warto zapamiętać.",
    },
    {
      condition: log.newAchievements?.length > 0 && log.newAchievements?.length < 5,
      message: `🏆 **Nowe sukcesy.** Zdobycie ${log.newAchievements.length} osiągnięć to dowód na to, że idziesz w dobrym kierunku.`,
    },
  
    {
      condition: log.points === 21,
      message: "🃏 **21 punktów – blackjack!** Wygląda na to, że dzisiaj sprzyja Ci szczęście.",
    },
    {
      condition: log.points === 1,
      message: "🎯 **Jeden punkt, ale wielki krok.** Każdy mały wynik to krok bliżej celu.",
    },
    {
      condition: log.points === 100,
      message: "💯 **Perfekcyjna setka!** Okrągłe 100 punktów – wygląda na to, że dzisiejszy dzień był wyjątkowo produktywny.",
    },
    {
      condition: log.points > 70 && log.timeSumary.creativityTime > 90 * 60 * 1000,
      message: "🌌 **Twórczość na maksa!** Ponad 70 punktów i prawie 2 godziny kreatywnej pracy – robi wrażenie.",
    },
  
    // Motywacyjne
    {
      condition: log.points > 0 && log.points < 20,
      message: "🌟 **Każdy wynik się liczy.** Dzisiejsza sesja to kolejny krok w stronę mistrzostwa – systematyczność popłaca.",
    },
    {
      condition: log.points >= 20 && log.points < 50,
      message: "⚙️ **Stabilny progres.** Wyniki w tym przedziale to znak, że idziesz w dobrym kierunku.",
    },
    {
      condition: true,
      message: "🚀 **Nie zatrzymuj się.** Każda chwila, którą poświęcasz, to inwestycja w Twój rozwój.",
    },
  
    // Humorystyczne
    {
      condition: log.points > 50 && log.timeSumary.techniqueTime > 90 * 60 * 1000,
      message: "🎸 **Palce jak maszyna!** Po takiej sesji technicznej Twoja gitara pewnie błaga o chwilę odpoczynku.",
    },
    {
      condition: log.points > 20 && log.timeSumary.theoryTime > 60 * 60 * 1000,
      message: "📖 **Teoretyczna dominacja.** Po dzisiejszej dawce wiedzy pewnie czujesz się jak profesor muzyki.",
    },
    {
      condition: log.points === 42,
      message: "🔑 **42 punkty – klucz do wszystkiego.** Czy wszechświat dał Ci odpowiedź?",
    },
    {
      condition: log.timeSumary.hearingTime > 2 * 60 * 60 * 1000,
      message: "🎧 **Maraton słuchowy.** Twoje uszy mogłyby teraz rozpoznać nawet najcichszy fałsz w orkiestrze.",
    },
    {
      condition: log.points === 7,
      message: "🍀 **Szczęśliwa siódemka!** Czy to przypadek, czy celowa liczba punktów?",
    },
    {
      condition: log.timeSumary.creativityTime > 3 * 60 * 60 * 1000,
      message: "🌈 **Twórcza eksplozja.** Ponad 3 godziny w świecie kreatywności – czas na odpoczynek!",
    },
  ];
  

  const applicableMessages =[ ...randomMessages.filter((msg) => msg.condition), ...jokes]
  const randomMessage =
    applicableMessages[Math.floor(Math.random() * applicableMessages.length)]?.message || "";


  if (log.newLevel?.isNewLevel) {
    fields.push({
      name: "🏅 **Nowy Poziom**",
      value: ` Gratulacje! Awans na poziom **${log.newLevel.level}**`,
      inline: false,
    });
  }

  if (log.newAchievements?.length) {
    fields.push({
      name: `🌟 **${log.newAchievements.length} Nowe Osiągnięcia!**`,
      inline: false,
    });
  }

  if (log.timeSumary.creativityTime) {
    fields.push({
      name: "🎨 **Kreatywność**",
      value: `${convertMsToHM(log.timeSumary.creativityTime)}h`,
      inline: true,
    });
  }

  if (log.timeSumary.hearingTime) {
    fields.push({
      name: "🎧 **Słuch**",
      value: `${convertMsToHM(log.timeSumary.hearingTime)}h`,
      inline: true,
    });
  }

  if (log.timeSumary.techniqueTime) {
    fields.push({
      name: "🎸 **Technika**",
      value: `${convertMsToHM(log.timeSumary.techniqueTime)}h`,
      inline: true,
    });
  }

  if (log.timeSumary.theoryTime) {
    fields.push({
      name: "📚 **Teoria**",
      value: `${convertMsToHM(log.timeSumary.theoryTime)}h`,
      inline: true,
    });
  }

  return {
    embeds: [
      {
        title: "📊 **Nowy Raport Aktywności**",
        description: ` **[${displayName}](https://www.cwiczymy-razem.pl/user/${log.uid})** zdobył **${log.points}** punktów! \n\nSprawdź jego szczegóły poniżej:`,
        color: 0x3498db,
        fields: [...fields,  {
          name: "A tak poza tym...",
          value: randomMessage,
          inline: false,
        },],
        thumbnail: {
          url: "https://www.clipartmax.com/png/full/155-1559277_2nd-quarter-report-cards-were-emailed-today-report-cards.png",
        },
        
        footer: {
          text: "Keep pushing forward! 🚀",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
};

export const formatDiscordMessage = async (
  log: FirebaseLogsInterface | FirebaseLogsSongsInterface
) => {
  if ("songTitle" in log) {
    switch (log.status) {
      case "learned":
        return formatLearnedMessage(log);
      case "wantToLearn":
        return formatWantToLearnMessage(log);
      case "learning":
        return formatLearningMessage(log);
      case "added":
        return formatAddedMessage(log);
      case "difficulty_rate":
        return formatDifficultyRateMessage(log);
      default:
        throw new Error("Unknown log status");
    }
  } else {
    return formatGeneralLogMessage(log);
  }
};
