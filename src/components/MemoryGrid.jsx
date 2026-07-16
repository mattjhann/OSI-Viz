import { motion } from 'framer-motion';

// A row (heap) or column (stack) of labeled memory cells. Each cell's `state`
// picks its color language, kept consistent across both the use-after-free and
// buffer-overflow visualizations:
//   empty | allocated | freed | dangling | attacker | overwritten | canary | retaddr
// Cells with a `note` become hoverable and feed FieldDetail, same contract as
// CodeBlock's annotated lines and PacketBlock's fields.
export default function MemoryGrid({
  cells,
  layout = 'row', // 'row' (heap) | 'column' (stack, grows downward)
  accentColor,
  hoveredField,
  onInspect,
  reducedMotion = false,
  ariaLabel,
}) {
  return (
    <div
      className={`mem-grid mem-grid--${layout}`}
      style={{ '--block-accent': accentColor }}
      role="img"
      aria-label={ariaLabel}
    >
      {cells.map((cell) => {
        const field = cell.note
          ? {
              id: cell.id,
              name: cell.note.name ?? cell.label,
              exampleValue: cell.note.exampleValue ?? cell.value,
              detail: cell.note.detail,
              accentColor,
              protocol: cell.note.protocol ?? 'Memory',
              kind: cell.note.kind ?? cell.state,
            }
          : null;
        const isHovered = field && hoveredField?.id === field.id;
        const className = [
          'mem-cell',
          `is-${cell.state}`,
          field ? 'is-interactive' : '',
          isHovered ? 'is-hovered' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const inner = (
          <>
            {cell.address && <span className="mem-cell__addr">{cell.address}</span>}
            <span className="mem-cell__label">{cell.label}</span>
            {cell.value != null && <span className="mem-cell__value">{cell.value}</span>}
          </>
        );

        const motionProps = {
          layout: !reducedMotion,
          initial: reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: reducedMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 24 },
        };

        if (field) {
          return (
            <motion.button
              key={cell.id}
              type="button"
              className={className}
              onMouseEnter={() => onInspect?.(field)}
              onFocus={() => onInspect?.(field)}
              {...motionProps}
            >
              {inner}
            </motion.button>
          );
        }

        return (
          <motion.div key={cell.id} className={className} {...motionProps}>
            {inner}
          </motion.div>
        );
      })}
    </div>
  );
}
