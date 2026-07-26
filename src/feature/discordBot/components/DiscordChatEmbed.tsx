import { DISCORD_GUILD_ID } from "feature/discordBot/constants/widget";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const DiscordChatEmbed = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className='relative h-full overflow-hidden rounded-2xl bg-zinc-950/40'>
      {!isLoaded && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <Loader2 className='animate-spin text-zinc-500' />
        </div>
      )}
      <iframe
        src={`https://e.widgetbot.io/channels/${DISCORD_GUILD_ID}`}
        title='Riff Quest Discord'
        width='100%'
        height='100%'
        allow='clipboard-write; fullscreen'
        onLoad={() => setIsLoaded(true)}
        className={isLoaded ? "opacity-100" : "opacity-0"}
      />
    </div>
  );
};

export default DiscordChatEmbed;
