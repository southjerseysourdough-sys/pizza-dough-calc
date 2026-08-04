export const LAUNCH_EVENT = "pdc:launch-action";

export type LaunchAction =
  "commands" | "help" | "data" | "onboarding" | "install";

export function dispatchLaunchAction(action: LaunchAction): void {
  window.dispatchEvent(
    new CustomEvent<LaunchAction>(LAUNCH_EVENT, { detail: action })
  );
}
