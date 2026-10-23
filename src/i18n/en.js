// English dictionary, derived from messages.js.
import { messages } from './messages.js';

export const en = Object.fromEntries(Object.entries(messages).map(([key, [, text]]) => [key, text]));
