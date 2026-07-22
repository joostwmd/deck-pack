import { Button } from "@deck-pack/ui/components/system/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@deck-pack/ui/components/system/dialog";
import { Input } from "@deck-pack/ui/components/system/input";
import { Label } from "@deck-pack/ui/components/system/label";
import { useForm } from "@tanstack/react-form";
import { ArrowRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

const waitlistSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export function WaitlistBanner() {
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: waitlistSchema,
    },
    onSubmit: async ({ value }) => {
      toast.success(`You're on the list! We'll reach out at ${value.email} when the plugin launches.`);
      form.reset();
      setOpen(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full shrink-0 items-center justify-between gap-4 border-b border-primary/20 bg-primary px-4 py-3 text-left text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:px-6 md:py-3.5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
            <SparkleIcon className="size-4" weight="fill" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold md:text-base">
              Get the official DeckPack PowerPoint plugin
            </p>
            <p className="truncate text-xs text-primary-foreground/80 md:text-sm">
              Join the waitlist for early access when we launch in the Office add-in store.
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium md:text-sm">
          Join waitlist
          <ArrowRightIcon
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join the plugin waitlist</DialogTitle>
            <DialogDescription>
              Be the first to know when the official DeckPack add-in is available for PowerPoint.
              We&apos;ll only use your email for launch updates.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="email">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <div className="space-y-2">
                    <Label htmlFor="waitlist-email">Email address</Label>
                    <Input
                      id="waitlist-email"
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid
                      ? field.state.meta.errors.map((error) => (
                          <p key={error?.message} role="alert" className="text-sm text-destructive">
                            {error?.message}
                          </p>
                        ))
                      : null}
                  </div>
                );
              }}
            </form.Field>

            <DialogFooter>
              <form.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button type="submit" className="w-full sm:w-auto" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "Joining..." : "Join waitlist"}
                  </Button>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
