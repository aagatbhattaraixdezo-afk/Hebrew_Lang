import { auth } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { AlphabetTrainer } from "./alphabet-trainer";
import { hebrewAlphabet } from "@/lib/hebrew-alphabet";

export const metadata = {
  title: "The Hebrew alphabet — Shalom",
};

export default async function AlphabetPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <>
      <TopNav />
      <main className="container-tight py-6 sm:py-10">
        <AlphabetTrainer letters={hebrewAlphabet} />
      </main>
    </>
  );
}
