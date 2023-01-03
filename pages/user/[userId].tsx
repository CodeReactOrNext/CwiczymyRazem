import { useRouter } from "next/router";

function UserProfile() {
  const router = useRouter();

  return <div>{router.query.userId}</div>;
}
export default UserProfile;
