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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    async function fetchRefCode() {
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle to avoid 406 errors if row doesn't exist
          
        if (error) {
          console.error("Error fetching referral code:", error);
        } else if (data?.referral_code) {
          setRefCode(data.referral_code);
        } else {
          // Self-healing: If the row exists but has no code, or row is completely missing
          const fallbackCode = user.id.substring(0, 8); // Use first 8 chars of user ID
          
          if (!data) {
            // Profile row is missing entirely, create it
            await supabase.from('profiles').insert({
              id: user.id,
              referral_code: fallbackCode
            });
          } else {
            // Profile exists but no referral code, update it
            await supabase.from('profiles').update({
              referral_code: fallbackCode
            }).eq('id', user.id);
          }
          
          setRefCode(fallbackCode);
        }
      } catch (err) {
        console.error("Failed to fetch/generate referral code:", err);
      } finally {
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="mt-8 rounded-xl bg-primary/5 border border-primary/20 p-6 h-24 flex items-center justify-center animate-pulse">
        <p className="text-sm text-muted-foreground">Loading referral program...</p>
      </div>
    );
  }

  // If no code is loaded after fetching, display an error message
  if (!refCode) {
    return (
      <div className="mt-8 rounded-xl bg-destructive/10 border border-destructive/20 p-6">
        <p className="text-sm text-destructive">
          Referral program is currently unavailable. (Ensure the database script has been run).
        </p>
      </div>
    );
  }

  const referralUrl = `${window.location.origin}/auth?ref=${refCode}`;
  const whatsappMessage = `Hey! I'm using Meridian to write my final year project and proposals with AI. Check it out using my link! 🚀\n\n${referralUrl}`;
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
          Share your unique link with classmates. When they sign up, you instantly get a week of Pro access.
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
