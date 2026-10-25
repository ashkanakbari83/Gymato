import { useEffect, useState } from 'react';
import Stickman from './Stickman.jsx';

/** Shows /exercises/<id>.gif when it exists, otherwise the animated stickman. */
export default function MoveMedia({ exercise }) {
  const [hasGif, setHasGif] = useState(false);
  useEffect(() => setHasGif(false), [exercise.id]);

  return (
    <>
      {!hasGif && <Stickman id={exercise.id} />}
      <img
        className="move-gif"
        hidden={!hasGif}
        src={`/exercises/${exercise.id}.gif`}
        alt={exercise.fa}
        onLoad={() => setHasGif(true)}
        onError={() => setHasGif(false)}
      />
    </>
  );
}
