import { VibeAgent } from "@/components/vibe-agent";
import { auth, isDevelopmentMode } from "@/auth";
import { Button } from "@/components/ui/button";
import { PilotHistory } from "@/components/pilot-history";
import { Lock } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-deezer)] bg-black text-white selection:bg-deezer-purple selection:text-white">
      {/* Development Mode Banner */}
      {isDevelopmentMode && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm">
          <strong>🔧 Development Mode:</strong> Deezer OAuth credentials not configured. 
          You can still search for tracks, but playlist creation is disabled. 
          See README for setup instructions.
        </div>
      )}
      
      <header className="flex justify-between items-center max-w-6xl mx-auto mb-20 relative z-20">
        <div className="text-2xl font-black tracking-tighter">
          DEEZER <span className="text-deezer-purple">PILOT</span>
        </div>
        <div className="flex gap-4 items-center">
            {session ? (
              <>
                <div className="hidden sm:block text-sm text-gray-400">
                  {session.user?.name || session.user?.email}
                </div>
                <form action={async () => {
                  "use server"
                  await import("@/auth").then(m => m.signOut())
                }}>
                  <Button variant="outline" className="rounded-full h-10 px-6">Sign Out</Button>
                </form>
                <PilotHistory />
              </>
            ) : (
              <Button 
                disabled 
                className="rounded-full bg-gray-600/50 text-gray-400 cursor-not-allowed h-10 px-6 font-bold gap-2"
              >
                <Lock className="w-4 h-4" />
                Connect Deezer
              </Button>
            )}
        </div>
      </header>

      <main className="flex flex-col gap-8 items-center w-full relative z-10">
         <VibeAgent />
      </main>
      
      {/* Background Ambient Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-deezer-purple/20 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-30"></div>
      </div>
    </div>
  );
}
