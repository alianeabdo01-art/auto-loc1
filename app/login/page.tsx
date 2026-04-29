import AuthForm from "@/app/components/auth-form";

export const metadata = {
  title: "Sign In — Auto-Loc",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}