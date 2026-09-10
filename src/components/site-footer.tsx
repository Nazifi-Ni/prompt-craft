import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-foreground">Meridian</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
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
        © {new Date().getFullYear()} Meridian. All rights reserved.
      </div>
    </footer>
  );
}
