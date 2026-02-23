import { Redirect } from "expo-router";

// Later (Week 6) this will check Firebase auth state
// and redirect to (tabs) if already logged in
export default function Index() {
  return <Redirect href="./(auth)/login" />;
}
