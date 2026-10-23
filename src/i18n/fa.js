// Persian dictionary, derived from messages.js.
import { messages } from './messages.js';

export const fa = Object.fromEntries(Object.entries(messages).map(([key, [text]]) => [key, text]));
