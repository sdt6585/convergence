import Check from './Check.svelte';
import { tick, mount, unmount } from 'svelte';

export async function roll(
  sides = 15,
  baseStatValue = 0,
  threshold = 0,
  modifiers = [],
  title = 'Dice Roll'
) {
  return new Promise(async (resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let resultObj;
    const modal = mount(Check, {
      target: container,
      props: {
        sides,
        baseStatValue,
        threshold,
        modifiers,
        title,
        onResult: (result) => {
          resultObj = result;
          resolve(result);
        }
      }
    });
    await tick();
    setTimeout(() => {
      unmount(modal);
      document.body.removeChild(container);
    }, 3000);
  });
} 