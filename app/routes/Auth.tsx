import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter"

export const meta = () => ([
  {title: 'Resumatch | Auth'},
  {name: 'description', content: 'Log into your account'}
])

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = location.search.split('next=')[1];
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(next)
    }
  }, [auth.isAuthenticated, next]);

  return (
    <main className="bg-[url('/images/bg-auth.png')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="!text-gradient">Welcome</h1>
            <h2 className="!text-gradient">Log into your account</h2>
          </div>
          <div>
            {isLoading ? (
              <button className="auth-button animate-pulse">
                <p>Loading...</p>
              </button>
            ) : (
              <>
                {auth.isAuthenticated ? (
                  <button className="auth-button" onClick={auth.signOut}>
                    <p>Log Out</p>
                  </button>
                ) : (
                  <button className="auth-button" onClick={auth.signIn}>
                    <p>Sign In</p>
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Auth