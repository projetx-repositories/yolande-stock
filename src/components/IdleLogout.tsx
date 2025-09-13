import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

// Simple invisible component that signs out the user after inactivity
// Default: 1h30 (90 minutes)
const INACTIVITY_LIMIT_MS = 90 * 60 * 1000; // 5,400,000 ms

const events: (keyof DocumentEventMap | keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
];

const IdleLogout = () => {
  const { user, signOut } = useAuth();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Only track inactivity when logged in
    if (!user) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(async () => {
        try {
          await signOut();
          toast({
            title: "Déconnecté pour inactivité",
            description: "Vous avez été déconnecté après 1h30 d’inactivité.",
          });
        } catch (e) {
          // Silently ignore
        }
      }, INACTIVITY_LIMIT_MS);
    };

    // Initialize and bind listeners
    resetTimer();
    events.forEach((event) => window.addEventListener(event as any, resetTimer, { passive: true }));

    // Optional: also reset when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") resetTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      events.forEach((event) => window.removeEventListener(event as any, resetTimer));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, signOut]);

  return null;
};

export default IdleLogout;
