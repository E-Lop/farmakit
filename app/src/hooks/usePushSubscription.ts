import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  isPushSupported,
  isPWAInstalled,
  isIOS,
  getPermissionState,
  getCurrentSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  syncSubscription,
} from "@/lib/pushNotifications";

export type PushStatus =
  | "unsupported"
  | "ios-not-installed"
  | "prompt"
  | "subscribed"
  | "denied"
  | "loading";

function getInitialStatus(): PushStatus {
  if (!isPushSupported()) return "unsupported";
  if (isIOS() && !isPWAInstalled()) return "ios-not-installed";
  const permission = getPermissionState();
  if (permission === "denied") return "denied";
  if (permission === "granted") return "subscribed";
  return "prompt";
}

export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>(getInitialStatus);
  const [isLoading, setIsLoading] = useState(false);

  // Refine: verifica subscription reale (async) e sincronizza col server
  useEffect(() => {
    if (status !== "subscribed") return;
    let cancelled = false;
    getCurrentSubscription()
      .then((sub) => {
        if (cancelled) return;
        if (!sub) {
          setStatus("prompt");
        } else {
          syncSubscription();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Ascolta pushsubscriptionchange dal SW
  useEffect(() => {
    function handleSwMessage(event: MessageEvent): void {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        subscribeToPush().then((result) => {
          if (result.success) setStatus("subscribed");
        });
      }
    }
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);
    return () =>
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    let result: Awaited<ReturnType<typeof subscribeToPush>>;
    try {
      result = await subscribeToPush();
    } finally {
      setIsLoading(false);
    }

    if (result.success) {
      setStatus("subscribed");
      toast.success("Notifiche attivate!");
      return;
    }

    const error = result.error ?? "Errore nell'attivazione delle notifiche";

    if (error.includes("Schermata Home")) {
      setStatus("ios-not-installed");
      toast.info(error, { duration: 6000 });
    } else if (error.includes("negato")) {
      setStatus("denied");
      toast.error(
        "Permesso negato. Puoi riabilitarlo dalle impostazioni del browser.",
      );
    } else {
      toast.error(error);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    let result: Awaited<ReturnType<typeof unsubscribeFromPush>>;
    try {
      result = await unsubscribeFromPush();
    } finally {
      setIsLoading(false);
    }

    if (result.success) {
      setStatus("prompt");
      toast.success("Notifiche disattivate");
    } else {
      toast.error("Errore nella disattivazione delle notifiche");
    }
  }, []);

  return { status, isLoading, subscribe, unsubscribe };
}
