import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ChatPanel } from "@/components/ChatPanel";

type Props = {
  searchParams: { conv?: string };
};

export default async function ChatPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <section className="space-y-3">
      <div>
        <h1 className="text-xl font-bold text-[#7a1f2b]">Messages</h1>
        <p className="text-xs text-slate-500">Chat privately with families you&apos;ve connected with.</p>
      </div>
      <ChatPanel initialConvId={searchParams.conv} />
    </section>
  );
}
