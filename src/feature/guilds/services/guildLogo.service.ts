import { GUILD_LOGO_FOLDER } from "feature/guilds/utils/guildLogo";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "utils/firebase/client/firebase.utils";
import { shuffleUid } from "utils/user/shuffleUid";

/** Thrown so the caller can tell a failed upload from a refused founding. */
export class GuildLogoUploadError extends Error {
  constructor() {
    super("Could not upload the guild picture");
    this.name = "GuildLogoUploadError";
  }
}

/**
 * Puts the crest in Storage and hands back its URL, which is all the API ever
 * sees. Filed under the founder rather than the guild: the guild's own id is
 * only decided once the founding transaction wins the race for the name, and a
 * file named after a name somebody else took would overwrite their crest.
 */
export const uploadGuildLogo = async (image: Blob): Promise<string> => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const target = ref(storage, `${GUILD_LOGO_FOLDER}/${shuffleUid(uid)}`);

  try {
    const { metadata } = await uploadBytes(target, image, {
      contentType: image.type,
    });

    return await getDownloadURL(ref(storage, metadata.fullPath));
  } catch {
    throw new GuildLogoUploadError();
  }
};
