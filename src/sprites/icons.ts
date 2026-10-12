import { sprite } from '../lib/sprite'

// Icons take their colour from the --icon custom property of whatever holds them.
const KEY = { x: 'icon' }

export const ICONS = {
  sound: sprite(['...x...', '..xx.x.', 'xxxx..x', 'xxxx..x', 'xxxx..x', '..xx.x.', '...x...'], KEY),
  mute: sprite(['...x...', '..xx...', 'xxxxx.x', 'xxxx.x.', 'xxxxx.x', '..xx...', '...x...'], KEY),
  reset: sprite(['.xxxx.x', 'x....xx', 'x...xxx', 'x......', 'x.....x', 'x.....x', '.xxxxx.'], KEY),
  clear: sprite(['..xxx..', 'xxxxxxx', '.x...x.', '.x.x.x.', '.x.x.x.', '.x...x.', '.xxxxx.'], KEY),
  remove: sprite(['x.....x', '.x...x.', '..x.x..', '...x...', '..x.x..', '.x...x.', 'x.....x'], KEY),
  lampOn: sprite(['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', '..x.x..', '.x.x.x.', 'x..x..x'], KEY),
  lampOff: sprite(['...x...', '..xxx..', '.xxxxx.', 'xxxxxxx', '...x...', '.......', '.......'], KEY),
  gear: sprite(['.x.x.x.', 'xxxxxxx', '.xx.xx.', 'xx...xx', '.xx.xx.', 'xxxxxxx', '.x.x.x.'], KEY),
  play: sprite(['.x.....', '.xxx...', '.xxxxx.', '.xxxxxx', '.xxxxx.', '.xxx...', '.x.....'], KEY),
}
