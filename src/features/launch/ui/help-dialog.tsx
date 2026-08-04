"use client";

import { useState } from "react";
import {
  DatabaseIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { HELP_TOPICS } from "../domain/help-content";
import { InstallAppButton } from "../pwa/pwa-provider";
import { dispatchLaunchAction } from "./launch-events";

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeId, setActiveId] = useState("quick-start");
  const active =
    HELP_TOPICS.find((topic) => topic.id === activeId) ?? HELP_TOPICS[0];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(64rem,calc(100%-1rem))] max-w-none gap-0 overflow-hidden rounded-xl border-[0.5px] border-graphite bg-carbon p-0 shadow-none sm:max-w-[64rem]"
        data-help-workspace
      >
        <DialogHeader className="border-b-[0.5px] border-graphite p-4 pr-12 sm:p-5 sm:pr-12">
          <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
            Help / Dough Lab
          </p>
          <DialogTitle className="text-xl">Help Center</DialogTitle>
          <DialogDescription>
            Short explanations for the controls already in the calculator.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 sm:grid-cols-[15rem_minmax(0,1fr)]">
          <nav
            aria-label="Help topics"
            className="max-h-48 overflow-y-auto border-b-[0.5px] border-graphite p-2 sm:max-h-[65dvh] sm:border-r-[0.5px] sm:border-b-0"
          >
            {HELP_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setActiveId(topic.id)}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-inset focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none",
                  active.id === topic.id
                    ? "bg-inset text-foreground"
                    : "text-muted-foreground"
                )}
                aria-current={active.id === topic.id ? "page" : undefined}
              >
                <span className="block font-medium">{topic.title}</span>
                <span className="mt-0.5 block text-[10px] leading-snug opacity-75">
                  {topic.summary}
                </span>
              </button>
            ))}
          </nav>
          <article className="max-h-[65dvh] overflow-y-auto p-5 sm:p-7">
            <p className="font-mono text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
              {active.id}
            </p>
            <h2 className="mt-2 text-2xl font-medium">{active.title}</h2>
            <div className="mt-4 grid gap-3 text-sm leading-relaxed text-muted-foreground">
              {active.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-7 grid gap-2 border-t-[0.5px] border-graphite pt-5 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  dispatchLaunchAction("onboarding");
                }}
              >
                <GraduationCapIcon />
                Reopen Quick Start
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  dispatchLaunchAction("data");
                }}
              >
                <DatabaseIcon />
                Data Management
              </Button>
              <InstallAppButton />
              {siteConfig.feedbackUrl ? (
                <Button
                  variant="outline"
                  render={
                    <a
                      href={siteConfig.feedbackUrl}
                      target={
                        siteConfig.feedbackUrl.startsWith("mailto:")
                          ? undefined
                          : "_blank"
                      }
                      rel={
                        siteConfig.feedbackUrl.startsWith("mailto:")
                          ? undefined
                          : "noreferrer"
                      }
                    />
                  }
                >
                  <ExternalLinkIcon />
                  Send Feedback
                </Button>
              ) : null}
            </div>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  );
}
