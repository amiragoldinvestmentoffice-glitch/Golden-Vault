import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="flex justify-center py-16 px-4">
      <SignIn routing="hash" />
    </div>
  );
}
