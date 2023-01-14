import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const session = useSession();
  return (
    <div>
      <div>
        {session.data?.user && (
          <>
            <Link href="/" className="mr-2">
              Timeline
            </Link>
            <Link href={`/${session.data.user.id}`} className="mr-2">
              Profile
            </Link>
          </>
        )}
        <button
          onClick={session.data ? () => void signOut() : () => void signIn()}
        >
          {session.data !== null ? "Sign out" : "Sign in"}
        </button>
      </div>
      {children}
    </div>
  );
};

export default Layout;
