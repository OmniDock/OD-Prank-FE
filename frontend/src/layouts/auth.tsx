import LandingNavbar from "@/components/navigation/landing-navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      {/* Use the same navbar but hide auth buttons */}
      <LandingNavbar hideAuthButtons={true} />
      
      {/* Main content with padding to account for fixed navbar */}
      <main className="flex-grow pt-24">
        {children}
      </main>
    </div>
  );
}
