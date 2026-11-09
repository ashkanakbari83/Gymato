// Loaded before every test file (see the "test" script): the app loads the starter data on demand, tests want it ready.
import { createSeedState } from '../../data/seed.js';
import { provideSeed } from '../storage.js';

provideSeed(createSeedState);
