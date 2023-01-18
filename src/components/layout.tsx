import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "../utils/api";
import { userSlug } from "../utils/models";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-purple-700 text-white">
      <Navbar />
      <main className="mt-4 px-8">{children}</main>
    </div>
  );
};

export default Layout;

const Navbar = () => {
  const session = useSession();

  const userId = session.data?.user?.id;

  const user = api.users.get.useQuery(
    { id: userId as string },
    { enabled: userId !== undefined }
  );

  if (!user.data) {
    return <></>;
  }

  return (
    <div className="flex h-20 items-center justify-between bg-purple-800 p-8 text-xl">
      <span>
        <Link href="/" className="mr-2 text-3xl">
          Postr
        </Link>
      </span>
      <span>
        {session.data?.user ? (
          <>
            <Link href={`/${userSlug(user.data)}`} className="mr-2">
              Profile
            </Link>
            <button onClick={() => void signOut()}>Sign out</button>
          </>
        ) : (
          <button onClick={() => void signIn()}>Sign in</button>
        )}
      </span>
    </div>
  );
};
