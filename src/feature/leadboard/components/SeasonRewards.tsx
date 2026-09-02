import { placeSuffix, SEASON_FAME_REWARDS } from "constants/seasonRewards";

/** Places shown as their own row. The rest collapse into one summary line — ten
 *  rows would outgrow the hero banner this card sits in, and the tail is flat
 *  enough that a range says everything a row would. */
const DETAILED_PLACES = 5;

const RANKS = [
  { medal: "👑", gemColor: "#FFD700", rowBg: "rgba(255,215,0,0.07)", labelColor: "#FFD700" },
  { medal: "🥈", gemColor: "#C0C0C0", rowBg: "rgba(192,192,192,0.05)", labelColor: "#C8C8C8" },
  { medal: "🥉", gemColor: "#CD7F32", rowBg: "rgba(205,127,50,0.06)", labelColor: "#CD9B6A" },
] as const;

const PLAIN_RANK = {
  medal: null,
  gemColor: "#6B7280",
  rowBg: "transparent",
  labelColor: "#9CA3AF",
} as const;

const ordinal = (place: number): string => `${place}${placeSuffix(place)}`;

export const SeasonRewards = () => {
  const detailed = SEASON_FAME_REWARDS.slice(0, DETAILED_PLACES);
  const tail = SEASON_FAME_REWARDS.slice(DETAILED_PLACES);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.28)",
        backdropFilter: "blur(16px)",
        borderRadius: "14px",
        padding: "18px 20px",
        minWidth: "240px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "14px",
        }}
      >
        <img src="/images/coin.png" alt="coin" style={{ width: 14, height: 14, flexShrink: 0 }} />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Season Rewards
        </span>
      </div>

      {/* Rows */}
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          margin: 0,
          padding: 0,
          listStyle: "none",
        }}
      >
        {detailed.map((fame, i) => {
          const rank = RANKS[i] ?? PLAIN_RANK;
          return (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "7px 10px",
                borderRadius: "9px",
                background: rank.rowBg,
              }}
            >
              {/* Medal / rank number */}
              <span
                style={{
                  width: "22px",
                  textAlign: "center",
                  flexShrink: 0,
                  fontSize: rank.medal ? "15px" : "12px",
                  color: rank.medal ? undefined : "rgba(255,255,255,0.2)",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                {rank.medal ?? i + 1}
              </span>

              {/* Place label */}
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: i < 3 ? 600 : 400,
                  color: rank.labelColor,
                  flex: 1,
                  lineHeight: 1,
                }}
              >
                {ordinal(i + 1)}
              </span>

              {/* Coin + amount */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontWeight: 700,
                  fontSize: i === 0 ? "16px" : "13px",
                  color: rank.gemColor,
                  lineHeight: 1,
                }}
              >
                <img
                  src="/images/coin.png"
                  alt="coin"
                  style={{
                    width: i === 0 ? 16 : 13,
                    height: i === 0 ? 16 : 13,
                    flexShrink: 0,
                  }}
                />
                {fame.toLocaleString()}
              </span>
            </li>
          );
        })}

        {tail.length > 0 && (
          <li
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 10px 2px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1,
            }}
          >
            <span style={{ width: "22px", flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              {ordinal(DETAILED_PLACES + 1)}–{ordinal(SEASON_FAME_REWARDS.length)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
              <img
                src="/images/coin.png"
                alt="coin"
                style={{ width: 11, height: 11, flexShrink: 0, opacity: 0.6 }}
              />
              {tail[0].toLocaleString()}–{tail[tail.length - 1].toLocaleString()}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};
