"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DownloadIcon, RefreshCwIcon, WifiOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { detectBrowserCapabilities } from "../domain/browser-capabilities";
import {
  InstallCapabilityAdapter,
  type DeferredInstallPrompt,
  type InstallOutcome,
} from "../domain/install";
import { SERVICE_WORKER_PATH, type ServiceWorkerMessage } from "./pwa-config";

type AsyncActionResult = { ok: true } | { ok: false; message: string };

type PwaContextValue = {
  online: boolean;
  installAvailable: boolean;
  iosInstallAvailable: boolean;
  installed: boolean;
  registrationStatus: "idle" | "ready" | "unsupported" | "failed";
  updateReady: boolean;
  requestInstall: () => Promise<InstallOutcome>;
  prepareOffline: () => Promise<AsyncActionResult>;
  clearAppCaches: () => Promise<AsyncActionResult>;
  applyUpdate: () => Promise<AsyncActionResult>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}

function postWorkerMessage(
  worker: ServiceWorker,
  message: Exclude<ServiceWorkerMessage, { type: "SKIP_WAITING" }>
): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve(false), 20_000);
    channel.port1.onmessage = (event: MessageEvent<{ ok?: boolean }>) => {
      window.clearTimeout(timeout);
      resolve(event.data.ok === true);
    };
    worker.postMessage(message, [channel.port2]);
  });
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const online = useOnlineStatus();
  const installAdapter = useRef(new InstallCapabilityAdapter());
  const [installAvailable, setInstallAvailable] = useState(false);
  const [installed, setInstalled] = useState(() =>
    typeof navigator === "undefined"
      ? false
      : detectBrowserCapabilities().standalone
  );
  const [registrationStatus, setRegistrationStatus] = useState<
    PwaContextValue["registrationStatus"]
  >(() =>
    typeof navigator === "undefined" ||
    detectBrowserCapabilities().serviceWorker
      ? "idle"
      : "unsupported"
  );
  const [updateReady, setUpdateReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const capabilities = detectBrowserCapabilities();

    const onInstallPrompt = (event: Event) => {
      installAdapter.current.capture(event as DeferredInstallPrompt);
      setInstallAvailable(true);
    };
    const onInstalled = () => {
      installAdapter.current.clear();
      setInstallAvailable(false);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (process.env.NODE_ENV !== "production" || !capabilities.serviceWorker) {
      return () => {
        window.removeEventListener("beforeinstallprompt", onInstallPrompt);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    let active = true;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          SERVICE_WORKER_PATH,
          { scope: "/", updateViaCache: "none" }
        );
        if (!active) return;
        registrationRef.current = registration;
        setRegistrationStatus("ready");
        setUpdateReady(Boolean(registration.waiting));
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              setUpdateReady(true);
          });
        });
      } catch {
        if (active) setRegistrationStatus("failed");
      }
    };
    const onLoad = () => void register();
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      active = false;
      window.removeEventListener("load", onLoad);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const requestInstall = useCallback(async () => {
    const outcome = await installAdapter.current.request();
    setInstallAvailable(false);
    if (outcome === "accepted") setInstalled(true);
    return outcome;
  }, []);

  const prepareOffline = useCallback(async (): Promise<AsyncActionResult> => {
    if (!("serviceWorker" in navigator))
      return {
        ok: false,
        message: "Offline preparation is not supported by this browser.",
      };
    try {
      const registration = await navigator.serviceWorker.ready;
      const worker = registration.active;
      if (!worker) throw new Error("No active worker");
      const ok = await postWorkerMessage(worker, {
        type: "PREPARE_OFFLINE",
        requestId: crypto.randomUUID(),
      });
      return ok
        ? { ok: true }
        : {
            ok: false,
            message:
              "The offline files could not be prepared. Check the connection and try again.",
          };
    } catch {
      return {
        ok: false,
        message:
          "Offline preparation is unavailable right now. The current local session was not changed.",
      };
    }
  }, []);

  const clearAppCaches = useCallback(async (): Promise<AsyncActionResult> => {
    if (!("serviceWorker" in navigator)) return { ok: true };
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const registration =
        registrationRef.current ??
        registrations.find((candidate) =>
          candidate.scope.startsWith(window.location.origin)
        );
      const worker = registration?.active;
      if (worker)
        await postWorkerMessage(worker, {
          type: "CLEAR_APP_CACHES",
          requestId: crypto.randomUUID(),
        });
      await registration?.unregister();
      registrationRef.current = null;
      setRegistrationStatus("idle");
      return { ok: true };
    } catch {
      return {
        ok: false,
        message:
          "App caches could not be cleared. Saved recipes were not changed.",
      };
    }
  }, []);

  const applyUpdate = useCallback(async (): Promise<AsyncActionResult> => {
    const waiting = registrationRef.current?.waiting;
    if (!waiting)
      return { ok: false, message: "No application update is waiting." };
    return new Promise((resolve) => {
      const timeout = window.setTimeout(
        () => resolve({ ok: false, message: "The update did not finish." }),
        10_000
      );
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          window.clearTimeout(timeout);
          window.location.reload();
          resolve({ ok: true });
        },
        { once: true }
      );
      waiting.postMessage({
        type: "SKIP_WAITING",
      } satisfies ServiceWorkerMessage);
    });
  }, []);

  const capabilities =
    typeof navigator === "undefined" ? null : detectBrowserCapabilities();
  const value = useMemo<PwaContextValue>(
    () => ({
      online,
      installAvailable,
      iosInstallAvailable: Boolean(
        capabilities?.ios && !capabilities.standalone && !installAvailable
      ),
      installed,
      registrationStatus,
      updateReady,
      requestInstall,
      prepareOffline,
      clearAppCaches,
      applyUpdate,
    }),
    [
      applyUpdate,
      capabilities?.ios,
      capabilities?.standalone,
      clearAppCaches,
      installAvailable,
      installed,
      online,
      prepareOffline,
      registrationStatus,
      requestInstall,
      updateReady,
    ]
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      {!online ? (
        <div
          role="status"
          className="fixed top-[calc(3.25rem+env(safe-area-inset-top))] right-3 z-40 flex items-center gap-1.5 rounded-md border-[0.5px] border-graphite bg-obsidian px-2.5 py-1.5 text-xs text-secondary-foreground shadow-sm"
        >
          <WifiOffIcon aria-hidden="true" className="size-3.5" />
          Offline · local work stays available
        </div>
      ) : null}
      {updateReady ? (
        <section
          role="status"
          aria-label="Application update"
          className="fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 flex max-w-sm items-center gap-3 rounded-md border-[0.5px] border-graphite bg-obsidian p-3 shadow-lg"
        >
          <RefreshCwIcon aria-hidden="true" className="size-4 text-acid-lime" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">An updated version is ready.</p>
            <p className="text-xs text-muted-foreground">
              Local recipes and timestamp-based timers are preserved.
            </p>
          </div>
          <Button size="sm" onClick={() => void applyUpdate()}>
            Update now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setUpdateReady(false)}
          >
            Later
          </Button>
        </section>
      ) : null}
    </PwaContext.Provider>
  );
}

export function usePwa(): PwaContextValue {
  const value = useContext(PwaContext);
  if (!value) throw new Error("usePwa must be used inside PwaProvider");
  return value;
}

export function InstallAppButton() {
  const { installAvailable, iosInstallAvailable, installed, requestInstall } =
    usePwa();
  const [message, setMessage] = useState<string | null>(null);
  if ((installed || (!installAvailable && !iosInstallAvailable)) && !message)
    return null;
  return (
    <div className="flex flex-col gap-2">
      {installAvailable ? (
        <Button
          variant="outline"
          onClick={async () => {
            const result = await requestInstall();
            setMessage(
              result === "accepted"
                ? "App installation accepted."
                : result === "dismissed"
                  ? "Installation was canceled. You can try again from Help."
                  : "Installation could not be started in this browser."
            );
          }}
        >
          <DownloadIcon />
          Install App
        </Button>
      ) : iosInstallAvailable ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          On iPhone or iPad, open the browser Share menu and choose Add to Home
          Screen.
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
    </div>
  );
}
