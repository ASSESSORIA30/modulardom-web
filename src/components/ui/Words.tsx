/** Each word in its own mask, so a line can rise into place. --i staggers them in CSS. */
export function Words({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {text.split(/\s+/).map((w, i) => (
        <span key={i}>
          <span className="word">
            <span data-word style={{ '--i': from + i } as React.CSSProperties}>
              {w}
            </span>
          </span>{' '}
        </span>
      ))}
    </>
  );
}
