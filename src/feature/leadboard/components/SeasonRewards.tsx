import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import { Gem } from "lucide-react";

const RANKS = [
  {
    label: "1st",
    medal: "👑",
    gemColor: "#FFD700",
    rowBg: "rgba(255,215,0,0.07)",
    labelColor: "#FFD700",
  },
  {
    label: "2nd",
    medal: "🥈",
    gemColor: "#C0C0C0",
    rowBg: "rgba(192,192,192,0.05)",
    labelColor: "#C8C8C8",
  },
  {
    label: "3rd",
    medal: "🥉",
    gemColor: "#CD7F32",
    rowBg: "rgba(205,127,50,0.06)",
    labelColor: "#CD9B6A",
  },
  {
    label: "4th",
    medal: null,
    gemColor: "#6B7280",
    rowBg: "transparent",
    labelColor: "#9CA3AF",
  },
  {
    label: "5th",
    medal: null,
    gemColor: "#6B7280",
    rowBg: "transparent",
    labelColor: "#9CA3AF",
  },
] as const;

export const SeasonRewards = () => {
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
        <Gem style={{ width: 13, height: 13, color: "#FFD700", flexShrink: 0 }} />
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
        {SEASON_FAME_REWARDS.map((fame, i) => {
          const rank = RANKS[i];
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
                {rank.label}
              </span>

              {/* Gem + amount */}
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
                <Gem
                  style={{
                    width: i === 0 ? 14 : 11,
                    height: i === 0 ? 14 : 11,
                    color: rank.gemColor,
                    flexShrink: 0,
                  }}
                />
                {fame}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
