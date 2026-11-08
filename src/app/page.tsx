import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import GallerySection from "@/components/GallerySection";
import GiftBuilderSection from "@/components/GiftBuilderSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex-1 bg-transparent text-fg min-h-screen flex flex-col relative z-10">
      <Navbar />
      <Hero />
      <GallerySection />
      <GiftBuilderSection />
      <Footer />
    </main>
  );
}
