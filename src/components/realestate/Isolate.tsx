import { Fragment } from "react";

// Customer and listing text comes in any script. Putting `dir="auto"` on a whole line that also holds English words
// lets the first word decide the direction of everything, and an Arabic name then drags the sentence backwards.
// Each piece of user text is isolated instead, so the line keeps the direction of the screen.

// "Aisha Khan · Dubai Marina": the pieces of a line, each isolated, with a dot between them.
export function Dotted({ items }: { items: (string | null | undefined)[] }) {
  const parts = items.filter((s): s is string => Boolean(s));
  return (
    <>
      {parts.map((s, i) => (
        <Fragment key={i}>
          {i > 0 && " · "}
          <bdi>{s}</bdi>
        </Fragment>
      ))}
    </>
  );
}

// A sentence written by the server that contains a customer's name: the name is isolated where it appears.
export function NameIn({ text, name }: { text: string; name: string }) {
  const at = name ? text.indexOf(name) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <bdi>{name}</bdi>
      {text.slice(at + name.length)}
    </>
  );
}
