import { motion } from 'framer-motion';

// A single labeled rectangle inside the data packet.
//
// Two flavours:
//  - interactive: a header/trailer field of the CURRENT layer. It is hoverable
//    and keyboard-focusable; pointing at it surfaces its explanation below.
//  - static: a payload, muted (nested) header, or the bit-stream block.
//
// When `layoutId` is supplied (and motion is allowed) the block participates in
// a shared-layout transition: as the structure changes between layers, Framer
// Motion animates it from its previous position/size into its new one — so the
// previous data visibly slides into its place inside the next layer's box.
export default function PacketBlock({
  label,
  value,
  accentColor,
  variant = 'payload', // 'payload' | 'header' | 'trailer' | 'bits' | 'data'
  highlighted = false,
  muted = false,
  interactive = false,
  isHovered = false,
  field = null,
  onInspect,
  reducedMotion = false,
  layoutId = null,
}) {
  const className = [
    'block',
    `block--${variant}`,
    highlighted ? 'is-highlighted' : '',
    muted ? 'is-muted' : '',
    interactive ? 'is-interactive' : '',
    isHovered ? 'is-hovered' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = accentColor ? { '--block-accent': accentColor } : undefined;

  const inspect = () => {
    if (interactive && onInspect && field) onInspect(field);
  };

  const useShared = Boolean(layoutId) && !reducedMotion;
  const transition = reducedMotion
    ? { duration: 0.2 }
    : { type: 'spring', stiffness: 220, damping: 30 };

  // Shared-layout blocks let the layout projection do the work (no pop-in, so
  // they morph smoothly). Fresh blocks (e.g. newly added header fields) pop in.
  const motionProps = useShared
    ? { layoutId, initial: false, animate: { opacity: 1 }, transition }
    : {
        initial: reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: -14 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition,
      };

  if (interactive) {
    return (
      <motion.button
        type="button"
        className={className}
        style={style}
        {...motionProps}
        onMouseEnter={inspect}
        onFocus={inspect}
        aria-label={`${label}${value ? `, value ${value}` : ''}`}
      >
        <span className="block__label">{label}</span>
        {value != null && <span className="block__value">{value}</span>}
      </motion.button>
    );
  }

  return (
    <motion.div className={className} style={style} {...motionProps}>
      <span className="block__label">{label}</span>
      {value != null && <span className="block__value">{value}</span>}
    </motion.div>
  );
}
