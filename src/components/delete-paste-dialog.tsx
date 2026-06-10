import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deletePaste } from "@/lib/paste.functions";

export function DeletePasteDialog({
  id, isOwner, onDeleted,
}: {
  id: string;
  isOwner: boolean;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const removeFn = useServerFn(deletePaste);

  const mut = useMutation({
    mutationFn: () => removeFn({ data: { id, token: isOwner ? undefined : token } }),
    onSuccess: () => {
      toast.success("Paste deleted");
      setOpen(false);
      onDeleted();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this paste?</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "It will be permanently removed from your account."
              : "Paste the one-time delete token shown when this paste was created. Without it, anonymous pastes can't be deleted."}
          </DialogDescription>
        </DialogHeader>
        {!isOwner && (
          <div className="space-y-1.5">
            <Label htmlFor="dtok">Delete token</Label>
            <Input
              id="dtok"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your delete token"
              className="font-mono text-xs"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={mut.isPending || (!isOwner && !token)}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
