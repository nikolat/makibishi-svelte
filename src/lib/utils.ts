import { finalizeEvent, generateSecretKey, type EventTemplate, type NostrEvent } from 'nostr-tools/pure';
import type { SimplePool } from 'nostr-tools/pool';
import type { SubCloser } from 'nostr-tools/abstract-pool';
import type { Filter } from 'nostr-tools/filter';
import type { WindowNostr } from 'nostr-tools/nip07';

declare global {
  interface Window {
    nostr?: WindowNostr;
  }
}

export const getGeneralEvents = (pool: SimplePool, relays: string[], filters: Filter[], callbackEvent: Function = () => {}): Promise<NostrEvent[]> => {
  return new Promise((resolve) => {
    const events: NostrEvent[] = [];
    const onevent = (ev: NostrEvent) => {
      events.push(ev);
      callbackEvent(ev);
    };
    const oneose = () => {
      sub.close();
      resolve(events);
    };
    const sub: SubCloser = pool.subscribeMany(
      relays,
      filters,
      { onevent, oneose }
    );
  });
};

export const sendReaction = async (pool: SimplePool, relaysToWrite: string[], targetURL: string, content: string, useNip07: boolean = true, emojiurl?: string) => {
  const tags: string[][] = [
    ['r', targetURL],
  ];
  if (emojiurl) {
    tags.push(['emoji', content.replaceAll(':', ''), emojiurl]);
  }
  const baseEvent: EventTemplate = {
    kind: 7,
    created_at: Math.floor(Date.now() / 1000),
    tags: tags,
    content: content
  };
  let newEvent: NostrEvent;
  if (useNip07) {
    if (window.nostr === undefined) {
      console.warn('window.nostr is undefined');
      return;
    }
    newEvent = await window.nostr.signEvent(baseEvent);
  }
  else {
    const sk = generateSecretKey();
    newEvent = finalizeEvent(baseEvent, sk);
  }
  const pubs = pool.publish(relaysToWrite, newEvent);
  await Promise.any(pubs);
};
