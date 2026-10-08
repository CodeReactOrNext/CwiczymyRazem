import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import {
  checkGuildName,
  checkGuildTag,
  GUILD_DESCRIPTION_MAX,
  GUILD_NAME_MAX,
  GUILD_NAME_MIN,
  GUILD_TAG_MAX,
  GUILD_TAG_MIN,
  guildSlug,
  normaliseTag,
} from "feature/guilds/utils/guild.utils";
import {
  GUILD_LOGO_MAX_BYTES,
  GUILD_LOGO_SIZE,
  GUILD_LOGO_TYPES,
} from "feature/guilds/utils/guildLogo";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSquareImg } from "utils/canvasUtils";

interface NewGuildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost: number;
  tokensLeft: number;
  busy: boolean;
  onSubmit: (input: {
    name: string;
    tag: string;
    description: string;
    /** Already squared and scaled down; the caller uploads it. */
    logo: Blob | null;
  }) => Promise<void>;
}

export const NewGuildDialog = ({
  open,
  onOpenChange,
  cost,
  tokensLeft,
  busy,
  onSubmit,
}: NewGuildDialogProps) => {
  const { t } = useTranslation("guilds");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoProblem, setLogoProblem] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // The preview is an object URL, so it has to be handed back or the blob it
  // points at stays in memory for the life of the tab.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const clearLogo = () => {
    setLogo(null);
    setPreview(null);
    setLogoProblem(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const pickLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!GUILD_LOGO_TYPES.includes(file.type)) {
      setLogoProblem(t("new.logo_types"));
      return;
    }
    if (file.size > GUILD_LOGO_MAX_BYTES) {
      setLogoProblem(
        t("new.logo_size", {
          mb: Math.round(GUILD_LOGO_MAX_BYTES / (1024 * 1024)),
        }),
      );
      return;
    }

    // Squared here rather than on the way out, so what the founder sees in the
    // preview is exactly the picture the cards will show. A file that decodes
    // to nothing throws rather than returning, so both endings land here.
    const square = await getSquareImg(file, GUILD_LOGO_SIZE).catch(() => null);
    if (!square) {
      setLogoProblem(t("new.logo_unreadable"));
      return;
    }

    setLogo(square);
    setPreview(URL.createObjectURL(square));
    setLogoProblem(null);
  };

  // The same checks the server runs, so the button says no before a token does.
  const nameProblem = name.trim() ? checkGuildName(name) : null;
  const tagProblem = tag.trim() ? checkGuildTag(tag) : null;
  const slug = guildSlug(name);

  const canSubmit =
    !busy &&
    tokensLeft >= cost &&
    checkGuildName(name) === null &&
    checkGuildTag(tag) === null;

  const submit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      name: name.trim(),
      tag: normaliseTag(tag),
      description: description.trim(),
      logo,
    });
    setName("");
    setTag("");
    setDescription("");
    clearLogo();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t("browser.found")}</DialogTitle>
          <DialogDescription>
            <Interpolate
              text={t("new.description")}
              values={{
                cost: (
                  <>
                    <SupportToken
                      size={18}
                      className='inline-block align-middle'
                    />{" "}
                    {cost}
                  </>
                ),
                left: (
                  <>
                    <SupportToken
                      size={18}
                      className='inline-block align-middle'
                    />{" "}
                    {tokensLeft}
                  </>
                ),
              }}
            />
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-2'>
          <div className='space-y-2'>
            <Label
              htmlFor='guild-name'
              className='ml-1 font-bold text-zinc-400'>
              {t("new.name")}
            </Label>
            <Input
              id='guild-name'
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={GUILD_NAME_MAX}
              placeholder='Riff Raiders'
              className='h-11 bg-white/5 font-bold'
            />
            {nameProblem ? (
              <p className='ml-1 text-xs text-amber-400/80'>
                {t(`new.name_problems.${nameProblem}`, {
                  min: GUILD_NAME_MIN,
                  max: GUILD_NAME_MAX,
                })}
              </p>
            ) : (
              slug && (
                <p className='font-mono ml-1 text-[11px] text-zinc-500'>
                  /{slug}
                </p>
              )
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='guild-tag' className='ml-1 font-bold text-zinc-400'>
              {t("new.tag")}{" "}
              <span className='font-medium text-zinc-500'>
                {t("new.tag_hint")}
              </span>
            </Label>
            <Input
              id='guild-tag'
              value={tag}
              onChange={(event) => setTag(normaliseTag(event.target.value))}
              maxLength={GUILD_TAG_MAX}
              placeholder='RIF'
              className='h-11 w-32 bg-white/5 font-black tracking-widest'
            />
            {tagProblem && (
              <p className='ml-1 text-xs text-amber-400/80'>
                {t(`new.tag_problems.${tagProblem}`, {
                  min: GUILD_TAG_MIN,
                  max: GUILD_TAG_MAX,
                })}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label className='ml-1 font-bold text-zinc-400'>
              {t("new.picture")}{" "}
              <span className='font-medium text-zinc-500'>
                {t("new.picture_hint")}
              </span>
            </Label>

            <div className='flex items-center gap-4'>
              <GuildCrest
                logo={preview}
                tag={normaliseTag(tag) || "?"}
                className='h-16 w-16 text-sm'
              />

              <div className='flex flex-wrap items-center gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => fileInput.current?.click()}
                  className='h-9 bg-white/5 text-zinc-300 hover:text-zinc-100'>
                  <span className='flex items-center gap-2'>
                    <ImagePlus size={15} />
                    {preview ? t("new.change") : t("new.add_image")}
                  </span>
                </Button>

                {preview && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={clearLogo}
                    className='h-9 text-zinc-500 hover:text-red-400'>
                    <span className='flex items-center gap-1.5'>
                      <X size={14} />
                      {t("new.remove")}
                    </span>
                  </Button>
                )}

                <input
                  ref={fileInput}
                  type='file'
                  accept={GUILD_LOGO_TYPES.join(",")}
                  onChange={pickLogo}
                  className='hidden'
                />
              </div>
            </div>

            {logoProblem && (
              <p className='ml-1 text-xs text-amber-400/80'>{logoProblem}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='guild-desc'
              className='ml-1 font-bold text-zinc-400'>
              {t("new.what_for")}{" "}
              <span className='font-medium text-zinc-500'>
                {t("new.optional")}
              </span>
            </Label>
            <Textarea
              id='guild-desc'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={GUILD_DESCRIPTION_MAX}
              rows={3}
              placeholder={t("new.what_for_placeholder")}
              className='resize-none bg-white/5 font-medium'
            />
          </div>
        </div>

        <div className='flex justify-end gap-3'>
          <Button
            variant='ghost'
            onClick={() => onOpenChange(false)}
            className='text-zinc-400 hover:text-zinc-200'>
            {t("new.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {tokensLeft >= cost ? (
              <span className='flex items-center gap-1.5'>
                {t("founding.cta")}
                <SupportToken size={20} />
                {cost}
              </span>
            ) : (
              t("founding.not_enough")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
