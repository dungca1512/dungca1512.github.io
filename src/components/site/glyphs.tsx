/* Glyphs shared between the backdrop and the hub in Expertise. Each one is
   drawn around its own origin in `currentColor` with no fill of its own, so
   the parent <svg> decides size, colour and stroke through CSS. */

/** A three-layer net, every edge drawn: the model, not a metaphor for one. */
export function NeuralNet() {
  const layers: { x: number; ys: number[] }[] = [
    { x: -62, ys: [-40, 0, 40] },
    { x: 0, ys: [-60, -20, 20, 60] },
    { x: 62, ys: [-26, 26] },
  ];
  return (
    <>
      {layers
        .slice(0, -1)
        .map((layer, i) =>
          layer.ys.map((from) =>
            layers[i + 1]!.ys.map((to) => (
              <path
                key={`${layer.x}-${from}-${to}`}
                d={`M${layer.x} ${from} L${layers[i + 1]!.x} ${to}`}
                strokeWidth="1.5"
                opacity="0.4"
              />
            )),
          ),
        )}
      {layers.map((layer) =>
        layer.ys.map((y) => (
          <circle
            key={`${layer.x}-${y}`}
            cx={layer.x}
            cy={y}
            r="6"
            fill="currentColor"
            stroke="none"
            opacity="0.85"
          />
        )),
      )}
    </>
  );
}
