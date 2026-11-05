import Portrait from './Portrait.jsx';

// A person's photo. Without one: a trainer gets a drawn portrait made from their name, an athlete their first letter. `size`: '' (default) | 'lg' | 'xl'.
export default function Avatar({ user, size = '', className = '' }) {
  return (
    <span className={`avatar ${size} ${className}`.trim()} aria-hidden="true">
      {user.avatar ? <img src={user.avatar} alt="" loading="lazy" /> : user.role === 'coach' ? <Portrait name={user.name} /> : user.name[0]}
    </span>
  );
}
