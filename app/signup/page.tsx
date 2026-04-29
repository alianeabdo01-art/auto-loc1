import AuthForm from "@/app/components/auth-form";

export const metadata = {
  title: "Create Account — Auto-Loc",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}