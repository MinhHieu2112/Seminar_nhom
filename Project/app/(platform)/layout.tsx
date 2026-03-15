import { PlatformLayout } from "@/components/layouts/platform-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PlatformLayout>{children}</PlatformLayout>
}
