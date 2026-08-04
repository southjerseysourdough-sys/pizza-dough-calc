export type InstallOutcome = "accepted" | "dismissed" | "failed";

export type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** The prompt is deliberately held only in memory; browsers own its lifetime. */
export class InstallCapabilityAdapter {
  private promptEvent: DeferredInstallPrompt | null = null;

  capture(event: DeferredInstallPrompt): void {
    event.preventDefault();
    this.promptEvent = event;
  }

  clear(): void {
    this.promptEvent = null;
  }

  get available(): boolean {
    return this.promptEvent !== null;
  }

  async request(): Promise<InstallOutcome> {
    const event = this.promptEvent;
    if (!event) return "failed";
    this.promptEvent = null;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      return choice.outcome;
    } catch {
      return "failed";
    }
  }
}
