// Fixed, decorative, non-interactive — sits behind all page content
// (negative z-index) as soft blurred aqua/teal orbs that drift slowly.
// Pure CSS animation (see .animate-float-slow/-slower in index.css),
// not Framer Motion or Three.js, since this runs on every single page
// and needs to be essentially free performance-wise.
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-glow/10 blur-[100px] animate-float-slow" />
      <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-[120px] animate-float-slower" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-glow/5 blur-[90px] animate-float-slow" />
    </div>
  );
}
