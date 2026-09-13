import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Share2, Gift, Check, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function ReferralBanner() {
  const { user } = useAccount();
  const [refCode, setRefCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    async function fetchRefCode() {
      // First try to get it
      const { data } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();
        
      if (data?.referral_code) {
        setRefCode(data.referral_code);
      }
    }
    fetchRefCode();
  }, [user]);

  if (!user) {
    return (
      <div className="mt-8 rounded-xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Gift className="size-5 text-primary" />
            Campus Referral Program
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Refer your classmates and unlock 7 Days of Pro access for free! 
          </p>
        </div>
        <Button asChild className="shrink-0 rounded-full">
          <Link to="/auth">Sign in to get your link</Link>
        </Button>
      </div>
    );
  }

  // If no code is loaded yet, hide to prevent flicker
  if (!refCode) return null;

  const referralUrl = `${window.location.origin}/auth?ref=${refCode}`;
  const whatsappMessage = `Hey! I'm using Meridian to write my final year project and proposals with AI. Use my link to sign up and we both get 7 days of Pro for free! 🚀\n\n${referralUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 rounded-xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex-1">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Gift className="size-5 text-primary" />
          Unlock 7 Days of Pro for Free!
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Share your unique link with classmates. When they sign up, you both instantly get a week of Pro access.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 shrink-0">
        <Button 
          variant="outline" 
          onClick={copyToClipboard}
          className="rounded-full bg-white dark:bg-black"
        >
          {copied ? <Check className="size-4 mr-2" /> : <Share2 className="size-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button 
          asChild
          className="rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4 mr-2" />
            Share on WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
