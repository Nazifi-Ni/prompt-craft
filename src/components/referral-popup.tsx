import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReferralBanner } from "./referral-banner";
import { useAccount } from "@/hooks/useAuth";

export function ReferralPopup() {
  const [open, setOpen] = useState(false);
  const { user } = useAccount();

  useEffect(() => {
    if (!user) return;

    const hasSeenPopup = sessionStorage.getItem("hasSeenReferralPopup");
    
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("hasSeenReferralPopup", "true");
      }, 20000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl sm:p-6 p-4 border-primary/20 bg-card overflow-hidden">
        <DialogTitle className="sr-only">Invite friends to Promptcraft</DialogTitle>
        <DialogDescription className="sr-only">Share your referral link to earn Pro access.</DialogDescription>
        
        <div className="pt-2">
          <h2 className="text-xl font-display font-semibold text-center mb-1">Earn Free Pro Access! 🎁</h2>
          <p className="text-sm text-muted-foreground text-center mb-2">Share Promptcraft with your friends and get rewarded.</p>
          <ReferralBanner className="mt-2 border-none shadow-none bg-transparent p-0" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
