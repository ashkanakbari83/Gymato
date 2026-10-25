// Views, likes and reviews.
import { recordView, submitReview, toggleLike } from '../lib/domain/engagement.js';

export function useEngagementActions({ user, notify, t, dispatch }) {
  /** Counts a view (ignored for trainers and for repeat views within a day). */
  const trackView = (targetKind, targetId) => dispatch(recordView, user.id, targetKind, targetId);

  const likeProgram = (programId) => dispatch(toggleLike, user.id, programId);

  /** Returns the domain result so the form can show field errors. */
  const postReview = (review) => {
    const result = dispatch(submitReview, user.id, review);
    if (result.ok) notify(t('review.thanks'));
    return result;
  };

  return { trackView, likeProgram, postReview };
}
