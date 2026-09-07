import { SubpageFrame } from "@/components/subpage-frame";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SubpageFrame>{children}</SubpageFrame>;
}
