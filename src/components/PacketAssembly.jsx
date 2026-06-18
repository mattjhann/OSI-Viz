import { useLayoutEffect, useRef, useState } from 'react';
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
  // The concentric packet is a single non-wrapping row, so on narrow screens it
  // would overflow. Measure its natural size and transform-scale it to fit the
  // canvas, sizing the footprint to the scaled box so no layout overflow remains.
  const scalerRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, w: undefined, h: undefined });

  useLayoutEffect(() => {
    const el = scalerRef.current;
    if (!el) return undefined;
    const measure = () => {
      const canvas = el.parentElement?.parentElement; // scaler -> .assembly -> .encap-canvas
      if (!canvas) return;
      const avail = canvas.clientWidth - 8; // small safety margin
      const naturalW = el.scrollWidth;
      const naturalH = el.scrollHeight;
      const scale = naturalW > avail && avail > 0 ? avail / naturalW : 1;
      setFit({ scale, w: naturalW * scale, h: naturalH * scale });
    };
    measure();
    const canvas = el.parentElement?.parentElement;
    const ro = new ResizeObserver(measure);
    if (canvas) ro.observe(canvas);
    return () => ro.disconnect();
  }, [activeIndex]);

  const sharedTransition = reducedMotion
    ? { duration: 0.2 }
    : { type: 'spring', stiffness: 220, damping: 30 };

  // Stable layout identity for a persistent piece. Across layer changes Framer
  // Motion animates each piece from its old box to its new (nested) box, so the
  // previous data slides into place inside the next layer instead of re-mounting.
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

  const scaled = fit.scale < 1;
  return (
    <div className="assembly" style={scaled ? { width: fit.w, height: fit.h } : undefined}>
      <div
        className="assembly__scaler"
        ref={scalerRef}
        style={scaled ? { transform: `scale(${fit.scale})`, transformOrigin: 'top left' } : undefined}
      >
        <LayoutGroup>
          <div className="assembly__inner">{renderNode(activeIndex)}</div>
        </LayoutGroup>
      </div>
    </div>
  );
}
