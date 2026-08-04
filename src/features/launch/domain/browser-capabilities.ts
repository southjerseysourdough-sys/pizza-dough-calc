export type BrowserCapabilities = {
  clipboard: boolean;
  fileApi: boolean;
  download: boolean;
  share: boolean;
  notifications: boolean;
  wakeLock: boolean;
  serviceWorker: boolean;
  standalone: boolean;
  ios: boolean;
};

type CapabilityEnvironment = {
  navigator?: Pick<Navigator, "userAgent"> & Partial<Navigator>;
  window?: Pick<Window, "matchMedia"> & Partial<Window>;
  document?: Pick<Document, "createElement">;
  notification?: unknown;
};

/** One feature-detection boundary for progressively enhanced browser APIs. */
export function detectBrowserCapabilities(
  environment: CapabilityEnvironment = {}
): BrowserCapabilities {
  const browserNavigator =
    environment.navigator ??
    (typeof navigator === "undefined" ? undefined : navigator);
  const browserWindow =
    environment.window ?? (typeof window === "undefined" ? undefined : window);
  const browserDocument =
    environment.document ??
    (typeof document === "undefined" ? undefined : document);
  const userAgent = browserNavigator?.userAgent ?? "";
  const ios = /iPad|iPhone|iPod/.test(userAgent);

  return {
    clipboard: Boolean(browserNavigator?.clipboard?.writeText),
    fileApi: typeof File !== "undefined" && typeof FileReader !== "undefined",
    download: Boolean(browserDocument?.createElement),
    share: typeof browserNavigator?.share === "function",
    notifications:
      environment.notification !== undefined ||
      typeof Notification !== "undefined",
    wakeLock: Boolean(browserNavigator && "wakeLock" in browserNavigator),
    serviceWorker: Boolean(
      browserNavigator && "serviceWorker" in browserNavigator
    ),
    standalone: Boolean(
      browserWindow?.matchMedia?.("(display-mode: standalone)").matches ||
      (browserNavigator as (Navigator & { standalone?: boolean }) | undefined)
        ?.standalone
    ),
    ios,
  };
}
