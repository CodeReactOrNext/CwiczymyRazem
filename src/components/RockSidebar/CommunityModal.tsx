import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Share2, Users, Heart, ExternalLink } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { CopyLinkProfile } from "components/CopyLinkProfile/CopyLinkProfile";

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityModal = ({ isOpen, onClose }: CommunityModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl border-white/10 bg-zinc-900 text-white shadow-2xl">
        <DialogHeader className="border-b border-white/5 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            Grow the Community
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Join Discord */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-800/50 p-5 transition-all hover:bg-zinc-800">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#5865F2]">
                <FaDiscord size={28} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">Join our Discord</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Leave feedback, suggest features, and chat with fellow guitarists.
                </p>
                <a
                  href="https://discord.gg/yRdT9T9F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2 text-sm font-bold text-[#5865F2] hover:underline"
                >
                  Enter the Server <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Share App */}
            <div className="rounded-2xl border border-white/5 bg-zinc-800/50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                <Share2 size={20} />
              </div>
              <h4 className="font-bold">Spread the word</h4>
              <p className="mt-1 text-xs text-zinc-500">
                Tell your guitar buddies about Riff Quest!
              </p>
              <div className="mt-4">
                <CopyLinkProfile mode="default" />
              </div>
            </div>

            {/* Support */}
            <div className="rounded-2xl border border-white/5 bg-zinc-800/50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Users size={20} />
              </div>
              <h4 className="font-bold">Invite friends</h4>
              <p className="mt-1 text-xs text-zinc-500">
                The more the merrier! Compete on the leaderboard.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-4 h-8 w-full border-white/10 bg-white/5 text-[10px] font-bold uppercase transition-all hover:bg-white/10"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Riff Quest',
                      text: 'Level up your guitar skills with Riff Quest!',
                      url: window.location.origin,
                    });
                  }
                }}
              >
                Share App
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
             <p className="text-xs italic text-zinc-500">
               "Your feedback helps us build the ultimate practice companion."
             </p>
          </div>
        </div>

        <div className="mt-2 flex justify-end">
            <Button 
                onClick={onClose}
                variant="ghost" 
                className="text-zinc-500 hover:text-white"
            >
                Close
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
