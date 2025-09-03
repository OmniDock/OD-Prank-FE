import LandingNavbar from "@/components/navigation/landing-navbar";
import Footer from "@/components/landing/Footer";
import ScrollToHash from "@/components/routing/ScrollToHash";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <LandingNavbar />
      <ScrollToHash />
      <main className="container mx-auto max-w-[80%] px-6 flex-grow pt-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
