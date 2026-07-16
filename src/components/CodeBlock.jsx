import { motion } from 'framer-motion';

// A monospace code panel used across the vulnerability walkthroughs. Lines are
// plain text; a line becomes hoverable/keyboard-focusable when it carries a
// `note` (mirrors PacketBlock's field/onInspect/isHovered contract so it can
// feed the same FieldDetail panel). `activeLines` pulses specific line ids to
// draw the eye to what changed this step (e.g. the byte that just got
// overwritten, the line that just executed).
export default function CodeBlock({
  title,
  lines,
  activeLines = [],
  accentColor,
  hoveredField,
  onInspect,
  reducedMotion = false,
  ariaLabel,
}) {
  const active = new Set(activeLines);

  return (
    <div className="code-block" style={{ '--block-accent': accentColor }} role="group" aria-label={ariaLabel}>
      {title && <div className="code-block__title">{title}</div>}
      <pre className="code-block__body">
        {lines.map((line, i) => {
          const field = line.note
            ? {
                id: line.id ?? `line-${i}`,
                name: line.note.name,
                exampleValue: line.note.exampleValue,
                detail: line.note.detail,
                accentColor,
                protocol: line.note.protocol,
                kind: line.note.kind,
              }
            : null;
          const isHovered = field && hoveredField?.id === field.id;
          const className = [
            'code-line',
            line.tone ? `is-${line.tone}` : '',
            active.has(line.id) ? 'is-active' : '',
            field ? 'is-interactive' : '',
            isHovered ? 'is-hovered' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const content = (
            <>
              <span className="code-line__num">{i + 1}</span>
              <span className="code-line__text">{line.text || ' '}</span>
            </>
          );

          if (field) {
            return (
              <motion.button
                key={field.id}
                type="button"
                className={className}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reducedMotion ? 0.15 : 0.25, delay: i * 0.02 }}
                onMouseEnter={() => onInspect?.(field)}
                onFocus={() => onInspect?.(field)}
              >
                {content}
              </motion.button>
            );
          }

          return (
            <motion.div
              key={line.id ?? i}
              className={className}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.25, delay: i * 0.02 }}
            >
              {content}
            </motion.div>
          );
        })}
      </pre>
    </div>
  );
}
