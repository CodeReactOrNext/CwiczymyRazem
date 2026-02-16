
interface ActivityMessage {
  condition: (log: {
    points: number;
    timeSumary: {
      creativityTime: number;
      theoryTime: number;
      hearingTime: number;
      techniqueTime: number;
    };
    newLevel?: {
      isNewLevel: boolean;
      level: number;
    };
    newAchievements?: any[];
    skillPointsGained?: Record<string, number>;
    newRecords?: {
      maxPoints?: boolean;
      longestSession?: boolean;
      maxStreak?: boolean;
      newLevel?: boolean;
    };
    exerciseRecords?: {
      micHighScore?: { exerciseTitle: string; score: number; accuracy: number };
      earTrainingHighScore?: { exerciseTitle: string; score: number };
    };
  }) => boolean;
  message: string;
}

export const ACTIVITY_MESSAGES: ActivityMessage[] = [

  {
    condition: (log) => log.points > 70,
    message:
      "🏆 **Mistrz dnia!** Ponad 70 punktów – to poziom, który budzi szacunek. Nie zatrzymuj się!",
  },
  {
    condition: (log) => log.points > 50 && log.points <= 70,
    message:
      "🔥 **Na wysokich obrotach.** Twój wynik to przykład świetnej pracy – kontynuuj ten trend!",
  },
  {
    condition: (log) => log.points >= 30 && log.points <= 50,
    message:
      "✅ **Stabilna forma.** Wynik w granicach 30–50 punktów to znak, że wiesz, co robisz. Dobra robota!",
  },
  {
    condition: (log) => log.points < 30,
    message:
      "🌱 **Każdy zaczyna od małych kroków.** Ważne, że działasz – zaangażowanie zawsze prowadzi do sukcesu.",
  },
  {
    condition: (log) => log.timeSumary.creativityTime > 90 * 60 * 1000,
    message:
      "🎨 **Twórczy geniusz.** Ponad 1,5 godziny kreatywnej pracy? Czekamy na efekty Twoich pomysłów.",
  },
  {
    condition: (log) => log.timeSumary.theoryTime > 60 * 60 * 1000,
    message:
      "📚 **Wiedza to potęga.** Godzina spędzona na teorii? Widać, że stawiasz na solidne fundamenty.",
  },
  {
    condition: (log) => log.timeSumary.hearingTime > 45 * 60 * 1000,
    message:
      "🎧 **Słuch jak złoto.** Dzisiaj Twoje uszy były w akcji – czy słyszałeś już wszystkie niuanse?",
  },
  {
    condition: (log) => log.timeSumary.techniqueTime > 120 * 60 * 1000,
    message:
      "🎸 **Technika na mistrzowskim poziomie.** Po dwóch godzinach ćwiczeń Twoje palce mogą konkurować z maszynami.",
  },
  {
    condition: (log) =>
      Boolean(log.newLevel?.isNewLevel && log.newLevel?.level && log.newLevel?.level > 10),
    message:
      "🏅 **Witaj w elicie!** Poziom 10+ to już wyższa liga – Twoje postępy są imponujące.",
  },
  {
    condition: (log) =>
      Boolean(
        Boolean(log.newLevel?.isNewLevel) &&
          log.newLevel?.level &&
          log.newLevel?.level <= 10
      ),
    message:
      "🚀 **Dobra robota.** Awans na nowy poziom to dowód, że regularna praca przynosi efekty.",
  },

  {
    condition: (log) => (log.newAchievements?.length || 0) >= 5,
    message:
      "🌟 **Rekord osiągnięć.** 5 nowych osiągnięć? To dzień, który warto zapamiętać.",
  },
  {
    condition: (log) =>
      (log.newAchievements?.length || 0) > 0 &&
      (log.newAchievements?.length || 0) < 5,
    message:
      "🏆 **Nowe sukcesy.** Zdobycie nowych osiągnięć to dowód na to, że idziesz w dobrym kierunku.",
  },
  {
    condition: (log) => log.points === 21,
    message:
      "🃏 **21 punktów – blackjack!** Wygląda na to, że dzisiaj sprzyja Ci szczęście.",
  },
  {
    condition: (log) => log.points === 1,
    message:
      "🎯 **Jeden punkt, ale wielki krok.** Każdy mały wynik to krok bliżej celu.",
  },
  {
    condition: (log) => log.points === 100,
    message:
      "💯 **Perfekcyjna setka!** Okrągłe 100 punktów – wygląda na to, że dzisiejszy dzień był wyjątkowo produktywny.",
  },
  {
    condition: (log) =>
      log.points > 70 && log.timeSumary.creativityTime > 90 * 60 * 1000,
    message:
      "🌌 **Twórczość na maksa!** Ponad 70 punktów i prawie 2 godziny kreatywnej pracy – robi wrażenie.",
  },
  {
    condition: (log) =>
      log.points > 50 && log.timeSumary.techniqueTime > 90 * 60 * 1000,
    message:
      "🎸 **Palce jak maszyna!** Po takiej sesji technicznej Twoja gitara pewnie błaga o chwilę odpoczynku.",
  },
  {
    condition: (log) =>
      log.points > 20 && log.timeSumary.theoryTime > 60 * 60 * 1000,
    message:
      "📖 **Teoretyczna dominacja.** Po dzisiejszej dawce wiedzy pewnie czujesz się jak profesor muzyki.",
  },
  {
    condition: (log) =>
      log.timeSumary.creativityTime > 30 * 60 * 1000 &&
      log.timeSumary.theoryTime > 30 * 60 * 1000 &&
      log.timeSumary.techniqueTime > 30 * 60 * 1000,
    message:
      "⚖️ **Mistrz równowagi!** Świetnie rozplanowana sesja - teoria, technika i kreatywność w idealnych proporcjach.",
  },
  {
    condition: (log) =>
      Object.values(log.timeSumary).reduce((a, b) => a + b, 0) >
      240 * 60 * 1000,
    message:
      "⏰ **Maratończyk!** Ponad 4 godziny praktyki? Twoje zaangażowanie jest godne podziwu!",
  },
  {
    condition: (log) => log.points >= 50 && Boolean(log.newLevel?.isNewLevel),
    message:
      "🌈 **Podwójne zwycięstwo!** Wysoki wynik punktowy i nowy poziom - dziś naprawdę dajesz z siebie wszystko!",
  },
];
export const DISCORD_JOKES = [
  {
    message:
      "**Jak rozpoznać gitarzystę na imprezie?** Spokojnie, sam Ci o tym powie.",
  },
  {
    message:
      "**Co mówi gitarzysta do basisty?** 'Dzięki za trzymanie rytmu, ale mógłbyś grać ciszej?'",
  },
  {
    message:
      "**Ile gitarzystów potrzeba, żeby zmienić żarówkę?** Jeden, ale zajmie mu to godzinę – w końcu musi poćwiczyć solówkę pod światło.",
  },
  {
    message:
      "**Czy wiesz, dlaczego gitarzyści tak często stroją swoje gitary?** Bo lubią myśleć, że to wina instrumentu, a nie ich!",
  },
  {
    message:
      "**Co robi gitarzysta w wolnym czasie?** Sprawdza ceny nowych gitar, których nie potrzebuje.",
  },
  {
    message:
      "**Co łączy wszystkich gitarzystów?** Przekonanie, że potrzebują 'jeszcze tylko jednej' gitary.",
  },
  {
    message:
      "**Jak poznać, że gitarzysta jest początkujący?** Ma tylko jedną gitarę.",
  },
  {
    message:
      "**Co mówi gitarzysta po koncercie?** 'Mogłem zagrać wolniej, ale szybciej było bezpieczniej.'",
  },
  {
    message:
      "**Jaka jest definicja optymizmu?** Gitarzysta, który bierze tylko jedną gitarę na koncert.",
  },
  {
    message:
      "**Co gitarzysta mówi, kiedy zapomni solówki?** „Improwizacja była zaplanowana od początku.",
  },
  {
    message:
      "**Dlaczego gitarzyści lubią zakupy online?** Bo nikt nie widzi ich kolekcji w domu.",
  },
  {
    message:
      "**Co mówi gitarzysta do swojego portfela?** 'To ostatnia gitara, obiecuję.'",
  },
  {
    message:
      "**Jak gitarzysta liczy do czterech?** Jeden, dwa, trzy, cztery... i solówka!",
  },
  {
    message:
      "**Jak gitarzysta definiuje oszczędzanie?** Kupowanie używanych gitar zamiast nowych.",
  },
  {
    message:
      "**Co jest największym kłamstwem gitarzysty?** 'Ta gitara to naprawdę ostatni zakup.'",
  },
  {
    message:
      "**Dlaczego gitarzysta nie gra na perkusji?** Bo musiałby liczyć więcej niż do czterech.",
  },
  {
    message:
      "**Jaki jest ulubiony dzień gitarzysty?** Black Friday w sklepie muzycznym.",
  },
  {
    message:
      "**Dlaczego gitarzysta zawsze zostaje na bis?** Bo jeszcze nie zdążył zagrać swojej ulubionej solówki.",
  },
  {
    message:
      "**Jak gitarzysta nazywa swój pokój?** Studio z miejscem do spania.",
  },
  {
    message:
      "**Co jest największym dylematem gitarzysty?** Czy kupić nową gitarę, czy nowy wzmacniacz.",
  },
  {
    message:
      "**Dlaczego gitarzysta zawsze spóźnia się na próbę?** Bo spędził godzinę wybierając, którą gitarę zabrać.",
  },
  {
    message:
      "**Co mówi żona gitarzysty, gdy widzi nową gitarę w domu?** 'Och, miałeś ją od zawsze, prawda?'",
  },
  {
    message:
      "**Jak gitarzysta definiuje 'budżet domowy'?** To kwota, którą może wydać na sprzęt, zanim żona zauważy.",
  },
  {
    message:
      "**Jak gitarzysta nazywa swoje dzieci?** Fender, Gibson i Taylor.",
  },
  {
    message:
      "**Dlaczego gitarzysta nie może utrzymać tajemnicy?** Bo wszystko musi wyrazić przez swoją gitarę.",
  },
  {
    message:
      "**Jak gitarzysta definiuje 'minimalizm'?** Posiadanie tylko dziesięciu gitar.",
  },

];
