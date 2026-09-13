import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
              >
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              </svg>
            </div>
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              Promptcraft
            </p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Specialised AI prompt toolkits for scholarship applicants, students, job seekers and
            builders.
          </p>
        </div>
        <div>
          <p className="label-caps">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/toolkits" className="text-muted-foreground hover:text-foreground">
                Toolkits
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/search" className="text-muted-foreground hover:text-foreground">
                Search prompts
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="label-caps">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/auth" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="label-caps">Integrity</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Our prompts never fabricate achievements, citations or experiences. Always verify
            deadlines and eligibility with official sources.
          </p>
        </div>
      </div>
      <div className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Promptcraft. All rights reserved.
      </div>
    </footer>
  );
}
