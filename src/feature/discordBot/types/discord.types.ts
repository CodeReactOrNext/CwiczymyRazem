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
  thumbnail?: {
    url: string;
  };
  footer?: {
    text: string;
  };
  timestamp?: string;
}

export interface DiscordField {
  name: string;
  value?: string;
  inline?: boolean;
}

export interface RandomMessage {
  condition: boolean;
  message: string;
}
