import { Suspense } from "react";
import { Metadata } from "next";
import { getGiftById } from "@/lib/db";
import ReceiverGiftClient from "@/components/ReceiverGiftClient";
import GiftNotFound from "@/components/GiftNotFound";

export const dynamic = "force-dynamic";

interface GiftPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GiftPageProps): Promise<Metadata> {
  const { id } = await params;
  const gift = await getGiftById(id);

  if (!gift) {
    return {
      title: "Gift Not Found — iQOO Diwali",
      description: "This Diwali gift link does not exist or has expired.",
    };
  }

  return {
    title: `${gift.senderName} sent you an iQOO Diwali Gift!`,
    description: `Open your exclusive handcrafted Diwali celebration box with 6 handpicked treats from ${gift.senderName}.`,
    openGraph: {
      title: `${gift.senderName} sent you an iQOO Diwali Gift!`,
      description: `Open your exclusive handcrafted Diwali celebration box from ${gift.senderName}.`,
      type: "website",
    },
  };
}

async function GiftContent({ id }: { id: string }) {
  const gift = await getGiftById(id);

  if (!gift) {
    return <GiftNotFound />;
  }

  return <ReceiverGiftClient gift={gift} />;
}

export default async function GiftPage({ params }: GiftPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-black flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-gold/30 border-t-gold animate-spin" />
        </div>
      }
    >
      <GiftContent id={id} />
    </Suspense>
  );
}
