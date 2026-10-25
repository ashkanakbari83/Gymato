import { POSES } from '../../data/poses.js';
import { useApp } from '../../context/AppContext.jsx';

const parsePose = (text) => text.trim().split(/\s+/).map((pair) => pair.split(',').map(Number));

// Joint indexes: 0 head, 1 shoulder, 2 pelvis, 3-4 elbow/wrist, 5-6 elbow/wrist, 7-8 knee/foot, 9-10 knee/foot
const BONES = [[0, 1], [1, 2], [1, 3], [3, 4], [1, 5], [5, 6], [2, 7], [7, 8], [2, 9], [9, 10]];

const EQUIPMENT = {
  pullup: <line className="sm-bar" x1="70" y1="12" x2="130" y2="12" />,
  dbpress: (
    <g className="sm-bar">
      <rect x="28" y="100" width="150" height="8" rx="3" />
      <line x1="44" y1="108" x2="44" y2="126" />
      <line x1="160" y1="108" x2="160" y2="126" />
    </g>
  ),
  treadmill: <rect className="sm-bar" x="52" y="122" width="100" height="4" rx="2" />,
};

/** Ping-pongs one SVG attribute between two values. */
const Motion = ({ attr, from, to }) => (
  <animate
    attributeName={attr}
    values={`${from};${to};${from}`}
    keyTimes="0;.5;1"
    calcMode="spline"
    keySplines=".45 0 .55 1;.45 0 .55 1"
    dur="1.8s"
    repeatCount="indefinite"
  />
);

/** Animated stick figure; stands in for a GIF until real ones are added to public/exercises/. */
export default function Stickman({ id }) {
  const { t } = useApp();
  const [a, b] = (POSES[id] ?? POSES.stand).map(parsePose);

  return (
    <svg className="stickman" viewBox="0 0 200 140" role="img" aria-label={t('ex.animation')}>
      <line className="sm-floor" x1="8" y1="126" x2="192" y2="126" />
      {EQUIPMENT[id]}
      {BONES.map(([from, to]) => (
        <line key={`${from}-${to}`} stroke="currentColor" x1={a[from][0]} y1={a[from][1]} x2={a[to][0]} y2={a[to][1]}>
          <Motion attr="x1" from={a[from][0]} to={b[from][0]} />
          <Motion attr="y1" from={a[from][1]} to={b[from][1]} />
          <Motion attr="x2" from={a[to][0]} to={b[to][0]} />
          <Motion attr="y2" from={a[to][1]} to={b[to][1]} />
        </line>
      ))}
      <circle fill="var(--accent)" r="8.5" cx={a[0][0]} cy={a[0][1]}>
        <Motion attr="cx" from={a[0][0]} to={b[0][0]} />
        <Motion attr="cy" from={a[0][1]} to={b[0][1]} />
      </circle>
    </svg>
  );
}
