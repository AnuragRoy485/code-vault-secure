import { Twitter, Linkedin, Facebook, Link2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  url: string;
  title: string;
};

export function ShareButtons({ url, title }: Props) {
  const enc = encodeURIComponent;
  const links = [
    {
      label: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      label: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${enc(title)}&body=${enc(url)}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {links.map(({ label, icon: Icon, href }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer noopener" aria-label={`Share on ${label}`}>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
            <Icon className="h-4 w-4" />
          </Button>
        </a>
      ))}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full"
        aria-label="Copy link"
        onClick={() => {
          navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard");
        }}
      >
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
