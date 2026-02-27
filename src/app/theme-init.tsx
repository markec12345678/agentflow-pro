/**
 * Inline script to set theme class before paint - prevents flash
 */
export function ThemeInit() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var t=localStorage.getItem("agentflow-theme");var p=window.matchMedia("(prefers-color-scheme: dark)").matches;var d=t==="dark"||(!t&&p);document.documentElement.classList.toggle("dark",d);})()`,
      }}
    />
  );
}
