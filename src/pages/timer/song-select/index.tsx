import type { GetServerSideProps } from "next";

// The song-select picker was merged into the songs board (/songs?view=board):
// one place to pick a song, start practice and review per-song stats.
// The route stays as a redirect so old links and bookmarks keep working.
const SongSelectRedirect = () => null;

export default SongSelectRedirect;

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/songs?view=board", permanent: false },
});
