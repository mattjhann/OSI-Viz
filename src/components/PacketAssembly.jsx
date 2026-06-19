import { LayoutGroup, motion } from 'framer-motion';
import { LAYERS } from '../data/layers.js';
import PacketBlock from './PacketBlock.jsx';

// Short label for a nested (already-wrapped) header.
const abbrev = (layer) => (layer.id === 'datalink' ? 'Eth' : layer.protocol);

// Build the inspect payload handed to the detail panel when a field is hovered.
const makeField = (layer, field, kind) => ({
  id: `${layer.id}-${kind}-${field.name}`,
  name: field.name,
  exampleValue: field.exampleValue,
  detail: field.detail,
  kind,
  accentColor: layer.accentColor,
  layerName: layer.layerName,
  protocol: layer.protocol,
});

export default function PacketAssembly({ activeIndex, hoveredField, onInspect, reducedMotion }) {
  const sharedTransition = reducedMotion
    ? { duration: 0.2 }
    : { type: 'spring', stiffness: 220, damping: 30 };

  // Stable layout identity for a persistent piece. Across layer changes Framer
  // Motion animates each piece from its old box to its new (nested) box, so the
  // previous data shrinks and slides into its place inside the next layer when
  // scrolling down, and zooms back out to full size when scrolling up.
  //
  // The packet is fitted to narrow screens purely with CSS (smaller blocks +
  // wrapped header fields) — never a transform-scale, which would break this
  // shared-layout projection.
  const layoutProps = (id) =>
    reducedMotion ? {} : { layoutId: id, transition: sharedTransition };

  // Recursively render the encapsulation: outermost box = current layer,
  // each inner box = the PDU handed down from the layer above.
  function renderNode(index) {
    const layer = LAYERS[index];
    const isCurrent = index === activeIndex;

    // Application layer: the raw payload everything wraps around.
    if (index === 0) {
      return (
        <PacketBlock
          key="data"
          layoutId="data"
          variant="data"
          accentColor={layer.accentColor}
          label={isCurrent ? layer.payload.label : 'Data'}
          value={isCurrent ? layer.payload.exampleValue : null}
          highlighted={isCurrent}
          muted={!isCurrent}
          reducedMotion={reducedMotion}
        />
      );
    }

    // Physical layer: the whole frame is serialized into a bit/signal stream.
    // It reuses the Data Link box's layout id, so the frame morphs into the bits.
    if (layer.id === 'physical') {
      return (
        <PacketBlock
          key="bits"
          layoutId="box-datalink"
          variant="bits"
          accentColor={layer.accentColor}
          label={layer.payload.label}
          value={layer.payload.exampleValue}
          highlighted
          reducedMotion={reducedMotion}
        />
      );
    }

    // Transport / Network / Data Link: wrap the inner PDU with a header
    // (and, for Data Link, a trailer).
    const inner = renderNode(index - 1);

    return (
      <motion.div
        key={`box-${layer.id}`}
        {...layoutProps(`box-${layer.id}`)}
        className={`pdu ${isCurrent ? 'is-current' : 'is-nested'}`}
        style={{ '--block-accent': layer.accentColor }}
      >
        <span className="pdu__tag">{layer.pduName}</span>

        <div className="pdu__row">
          {/* Header */}
          {isCurrent ? (
            <motion.div
              {...layoutProps(`hdr-${layer.id}`)}
              className="header-group"
              aria-label={`${layer.protocol} header`}
            >
              <span className="header-group__title">{layer.protocol} Header</span>
              <div className="header-group__fields">
                {layer.headerFields.map((f) => {
                  const field = makeField(layer, f, 'header');
                  return (
                    <PacketBlock
                      key={field.id}
                      variant="header"
                      interactive
                      accentColor={layer.accentColor}
                      label={f.name}
                      value={f.exampleValue}
                      field={field}
                      isHovered={hoveredField?.id === field.id}
                      onInspect={onInspect}
                      highlighted
                      reducedMotion={reducedMotion}
                    />
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <PacketBlock
              layoutId={`hdr-${layer.id}`}
              variant="header"
              accentColor={layer.accentColor}
              label={`${abbrev(layer)} Hdr`}
              muted
              reducedMotion={reducedMotion}
            />
          )}

          {/* Nested payload */}
          <div className="pdu__payload">{inner}</div>

          {/* Trailer (Data Link only) */}
          {layer.trailerFields.length > 0 &&
            (isCurrent ? (
              <motion.div
                {...layoutProps(`tlr-${layer.id}`)}
                className="header-group header-group--trailer"
                aria-label={`${layer.protocol} trailer`}
              >
                <span className="header-group__title">Trailer</span>
                <div className="header-group__fields">
                  {layer.trailerFields.map((f) => {
                    const field = makeField(layer, f, 'trailer');
                    return (
                      <PacketBlock
                        key={field.id}
                        variant="trailer"
                        interactive
                        accentColor={layer.accentColor}
                        label={f.name}
                        value={f.exampleValue}
                        field={field}
                        isHovered={hoveredField?.id === field.id}
                        onInspect={onInspect}
                        highlighted
                        reducedMotion={reducedMotion}
                      />
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <PacketBlock
                layoutId={`tlr-${layer.id}`}
                variant="trailer"
                accentColor={layer.accentColor}
                label="FCS"
                muted
                reducedMotion={reducedMotion}
              />
            ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="assembly">
      <LayoutGroup>
        {/* The whole asset fades in once when it becomes visible (no zoom, no
            movement). This wrapper persists across steps, so its entry runs only
            on mount — step-to-step changes are handled by the shared-layout
            morph below, never a re-fade. */}
        <motion.div
          className="assembly__inner"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0.12 : 0.4, ease: 'easeOut' }}
        >
          {renderNode(activeIndex)}
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
