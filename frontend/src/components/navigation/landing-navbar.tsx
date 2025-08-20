import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useAuth } from "@/context/AuthProvider";
import { Logo } from "@/components/icons";

export default function LandingNavbar() {
  const { user } = useAuth();

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4">
      <Link href="/" color="foreground" className="flex items-center gap-2">
        <Logo />
        <span className="font-semibold">Prankster</span>
      </Link>
      {user ? (
        <Button as={Link} href="/dashboard" color="primary" variant="solid">
          Dashboard
        </Button>
      ) : (
        <Button as={Link} href="/signin" color="primary" variant="solid">
          Sign In
        </Button>
      )}
    </nav>
  );
}
