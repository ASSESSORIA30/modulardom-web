/** A title as lines, each rising out of its own mask. A line wrapped in *asterisks* is set in italic. */
export function Lines({ lines, from = 0 }: { lines: string[]; from?: number }) {
  return (
    <>
      {lines.map((raw, i) => {
        const italic = raw.startsWith('*');
        const text = raw.replace(/\*/g, '');
        return (
          <span key={i} className="line">
            <span data-line style={{ '--i': from + i } as React.CSSProperties}>
              {italic ? <em>{text}</em> : text}
            </span>{' '}
          </span>
        );
      })}
    </>
  );
}

/** plain text of a title, for labels */
export const plain = (lines: string[]) => lines.join(' ').replace(/\*/g, '');
