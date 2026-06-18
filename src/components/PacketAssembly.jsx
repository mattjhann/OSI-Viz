import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  // The scaler is stable across steps; a ResizeObserver re-measures whenever the
  // content (step change) or the canvas (viewport) changes size.
  const scalerRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, w: undefined, h: undefined });

  useLayoutEffect(() => {
    const el = scalerRef.current;
    if (!el) return undefined;
    const canvas = el.parentElement?.parentElement; // scaler -> .assembly -> .encap-canvas
    const measure = () => {
      if (!canvas) return;
      const naturalW = el.scrollWidth;
      const naturalH = el.scrollHeight;
      if (naturalW <= 1) return; // mid-transition (no content) — keep last fit
      const avail = canvas.clientWidth - 8; // small safety margin
      const scale = naturalW > avail && avail > 0 ? avail / naturalW : 1;
      setFit((prev) => {
        const next = { scale, w: naturalW * scale, h: naturalH * scale };
        return prev.scale === next.scale && prev.w === next.w && prev.h === next.h ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (canvas) ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Recursively render the encapsulation: outermost box = current layer, each
  // inner box = the PDU handed down from the layer above. Everything renders
  // statically (no entry motion); only the leaving packet animates, on exit.
  function renderNode(index) {
    const layer = LAYERS[index];
    const isCurrent = index === activeIndex;

    // Application layer: the raw payload everything wraps around.
    if (index === 0) {
      return (
        <PacketBlock
          variant="data"
          accentColor={layer.accentColor}
          label={isCurrent ? layer.payload.label : 'Data'}
          value={isCurrent ? layer.payload.exampleValue : null}
          highlighted={isCurrent}
          muted={!isCurrent}
          noEnter
        />
      );
    }

    // Physical layer: the whole frame is serialized into a bit/signal stream.
    if (layer.id === 'physical') {
      return (
        <PacketBlock
          variant="bits"
          accentColor={layer.accentColor}
          label={layer.payload.label}
          value={layer.payload.exampleValue}
          highlighted
          noEnter
        />
      );
    }

    // Transport / Network / Data Link: wrap the inner PDU with a header
    // (and, for Data Link, a trailer).
    const inner = renderNode(index - 1);

    return (
      <div
        className={`pdu ${isCurrent ? 'is-current' : 'is-nested'}`}
        style={{ '--block-accent': layer.accentColor }}
      >
        <span className="pdu__tag">{layer.pduName}</span>

        <div className="pdu__row">
          {/* Header */}
          {isCurrent ? (
            <div className="header-group" aria-label={`${layer.protocol} header`}>
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
                      noEnter
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <PacketBlock
              variant="header"
              accentColor={layer.accentColor}
              label={`${abbrev(layer)} Hdr`}
              muted
              noEnter
            />
          )}

          {/* Nested payload */}
          <div className="pdu__payload">{inner}</div>

          {/* Trailer (Data Link only) */}
          {layer.trailerFields.length > 0 &&
            (isCurrent ? (
              <div className="header-group header-group--trailer" aria-label={`${layer.protocol} trailer`}>
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
                        noEnter
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <PacketBlock variant="trailer" accentColor={layer.accentColor} label="FCS" muted noEnter />
            ))}
        </div>
      </div>
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
        {/* No entry motion — the new packet appears instantly. The previous
            packet animates out (exit) as it leaves. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            className="assembly__inner"
            initial={false}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.32, ease: 'easeIn' }}
          >
            {renderNode(activeIndex)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
