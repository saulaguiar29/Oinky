import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { authAPI } from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true while checking auth state on startup

  // Listen for Firebase auth state changes (runs on app start and login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in — get a fresh ID token to use in API requests
        const idToken = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        setToken(idToken);

        // Sync with our MongoDB backend so a User document exists
        try {
          await authAPI.sync(idToken);
        } catch (e) {
          console.warn("Backend sync failed (non-fatal):", e);
        }
      } else {
        // User is logged out
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();

    // Sync to MongoDB on login (creates user doc on first login)
    await authAPI.sync(idToken);
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Set the display name in Firebase right away
    await updateProfile(credential.user, { displayName: name });

    const idToken = await credential.user.getIdToken();

    // Sync to MongoDB — creates the User document with name + email
    await authAPI.sync(idToken);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — access auth state and actions from any screen.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
