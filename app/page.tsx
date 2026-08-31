import TanpuraSection from "@/components/TanpuraSection";
import MetronomeSection from "@/components/MetronomeSection";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <h1 className="font-serif text-2xl italic tracking-wide text-ink">
          My Riyaz
        </h1>

        <TanpuraSection />
        <MetronomeSection />
      </div>
    </main>
  );
}
