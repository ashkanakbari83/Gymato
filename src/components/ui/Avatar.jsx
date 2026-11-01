// A person's photo, or their first letter when they have none. `size`: '' (default) | 'lg' | 'xl'.
export default function Avatar({ user, size = '', className = '' }) {
  return (
    <span className={`avatar ${size} ${className}`.trim()} aria-hidden="true">
      {user.avatar ? <img src={user.avatar} alt="" loading="lazy" /> : user.name[0]}
    </span>
  );
}
