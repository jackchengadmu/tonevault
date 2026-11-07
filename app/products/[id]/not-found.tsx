import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">Not in the vault</p>
      <h1 className="mt-3 font-serif text-4xl text-foreground">Instrument not found</h1>
      <p className="mt-3 text-muted">This listing may have moved, or the identifier is invalid.</p>
      <Link href="/browse" className="mt-8 rounded-full bg-gold px-5 py-2.5 text-sm text-background">
        Return to catalog
      </Link>
    </div>
  );
}
