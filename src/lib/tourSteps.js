// The interface tour: which parts of the screen it points at, per side. `target` matches a `data-tour` attribute in the
// page; a step whose target is not on screen (the bottom bar on desktop, say) is skipped. Texts: tour.<side>.<id>.title / .text
export const TOUR_STEPS = {
  athlete: [
    { id: 'today', target: 'today' },
    { id: 'main', target: 'main' },
    { id: 'tools', target: 'tools' },
    { id: 'nav', target: 'nav' },
    { id: 'top', target: 'top' },
  ],
  trainer: [
    { id: 'main', target: 'main' },
    { id: 'tools', target: 'tools' },
    { id: 'nav', target: 'nav' },
    { id: 'top', target: 'top' },
  ],
};

export const tourSide = (user) => (user.role === 'coach' ? 'trainer' : 'athlete');
/** Text key of one step: nav and top read the same for both sides. */
export const tourKey = (side, id, part) => (id === 'nav' || id === 'top' ? `tour.${id}.${part}` : `tour.${side}.${id}.${part}`);
