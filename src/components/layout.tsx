import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "../utils/api";
import { userSlug } from "../utils/models";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="bg-purple-700 min-h-screen text-white">
      <Navbar />
      <main className="px-8 mt-4">
        {children}
      </main>
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
    return <></>
  }

  return (
    <div className="text-xl flex justify-between bg-purple-800 h-20 items-center p-8">
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
            <button
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => void signIn()}
          >
            Sign in
          </button>
        )}
      </span>
    </div>)
}
