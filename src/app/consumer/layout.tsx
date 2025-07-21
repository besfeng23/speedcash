import MobileBottomNav from "@/components/mobile-bottom-nav";

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}
