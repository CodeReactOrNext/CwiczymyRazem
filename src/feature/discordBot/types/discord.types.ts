export interface DiscordMessage {
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  url?: string;
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordField {
  name: string;
  value?: string;
  inline?: boolean;
}

interface RandomMessage {
  condition: boolean;
  message: string;
}
