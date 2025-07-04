import Link from 'next/link';

export function MainNav() {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Home
      </Link>
      <Link
        href="/events"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Events
      </Link>
      <Link
        href="/tracked-objects"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Tracked Objects
      </Link>
      <Link
        href="/lizi"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Lizi Monitor
      </Link>
      <Link
        href="/settings"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Settings
      </Link>
    </nav>
  );
} 