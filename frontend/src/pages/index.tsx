import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-16 md:py-24 min-h-screen"></section>
      <section className="flex flex-col items-center justify-center gap-4 py-16 md:py-24 min-h-screen bg-red-500"></section>
    </DefaultLayout>
  );
}
