import { useEffect, useState } from "react";

/** A minimal hash router: routes look like #/runs/abc/panel. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => setParts(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}

export function Link(props: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={`#${props.to}`} className={props.className}>
      {props.children}
    </a>
  );
}
