<script lang="ts">
  import type { NostrEvent } from 'nostr-tools/pure';
  import { SimplePool } from 'nostr-tools/pool';
  import { insertEventIntoAscendingList, normalizeURL } from 'nostr-tools/utils';
  import * as nip19 from 'nostr-tools/nip19';
  import { getGeneralEvents, sendReaction } from './lib/utils';
  import { defaultReaction, defaultRelays, getRoboHashURL, profileRelays, reactionEventKind, urlToLinkEvent } from './lib/config';
  import { onMount } from 'svelte';

  let pool: SimplePool;
  let reactionEvents: NostrEvent[] = [];
  let profiles: Map<string, NostrEvent> = new Map<string, NostrEvent>();
  let relays: string[];
  let targetUrl: string;
  let reactionContent: string;
  let allowAnonymousReaction: boolean;

  const getReactions = async (url: string): Promise<void> => {
    if (!URL.canParse(url))
      return;
    const reactionEventsFetched = await getGeneralEvents(pool, relays, [{ kinds: [reactionEventKind], '#r': [url] }], (event: NostrEvent) => {
      if (!reactionEvents.some(ev => ev.id === event.id)) {
        reactionEvents = insertEventIntoAscendingList(reactionEvents, event);
      }
    });
    const pubkeys: string[] = Array.from(new Set<string>(reactionEvents.map(ev => ev.pubkey)));
    const profileEventsFetched = await getGeneralEvents(pool, profileRelays, [{ kinds: [0], authors: pubkeys }], (event: NostrEvent) => {
      const prof = profiles.get(event.pubkey);
      if (prof === undefined || prof.created_at < event.created_at) {
        try {
          const obj = JSON.parse(event.content);
        } catch (error) {
          console.warn(error);
          return;
        }
        profiles.set(event.pubkey, event);
        profiles = profiles;
      }
    });
  };

  const callSendReaction = async () => {
    await sendReaction(pool, relays, targetUrl, reactionContent, !allowAnonymousReaction);
    await getReactions(targetUrl);//本来は不要 wss://relay.mymt.casa/ 用処理
  };

  onMount(async () => {
    const makibishi = document.getElementById('makibishi');
    if (makibishi === null) {
      console.warn('makibishi is not found');
      return;
    }
    const makibishiRelays = makibishi.dataset.relays;
    const makibishiUrl = makibishi.dataset.url;
    const makibishiReaction = makibishi.dataset.content;
    const makibishiAllowAnonymousReaction = makibishi.dataset.allowAnonymousReaction;
    if (makibishiRelays === undefined) {
      relays = defaultRelays;
    }
    else {
      relays = Array.from(new Set<string>(makibishiRelays.split(',').filter(r => URL.canParse(r)).map(r => normalizeURL(r))));
    }
    if (makibishiUrl === undefined) {
      targetUrl = window.location.href;
    }
    else {
      targetUrl = URL.canParse(makibishiUrl) ? makibishiUrl : window.location.href;
    }
    reactionContent = makibishiReaction ?? defaultReaction;
    if (makibishiAllowAnonymousReaction === undefined) {
      allowAnonymousReaction = false;
    }
    else {
      allowAnonymousReaction = /^true$/i.test(makibishiAllowAnonymousReaction);
    }
    console.log('MAKIBISHI Settings:', {relays, targetUrl, reactionContent, allowAnonymousReaction});
    pool = new SimplePool();
    await getReactions(targetUrl);
  });
</script>

<span class="makibishi-container">
  <button class="makibishi-button" on:click={callSendReaction} title="add star">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M3.58169903,14.7981322 L4.42551943,9.87828177 L0.851038858,6.39402435 L5.79084952,5.67622784 L8,1.20000005 L10.2091505,5.67622784 L15.1489611,6.39402435 L11.5744806,9.87828177 L12.418301,14.7981322 L8,12.4752939 L3.58169903,14.7981322 Z M8,10.2157425 L9.76203892,11.1421011 L9.42551943,9.18004197 L10.8510389,7.79050395 L8.88101946,7.50424338 L8,5.71910297 L7.11898054,7.50424338 L5.14896114,7.79050395 L6.57448057,9.18004197 L6.23796108,11.1421011 L8,10.2157425 Z"/>
    </svg>
  </button>
  {#each reactionEvents as ev}
    {@const emojiTag = ev.tags.find(tag => tag[0] === 'emoji')}
    <span class="makibishi-unit">
    {#if profiles.has(ev.pubkey) }
      {@const prof = profiles.get(ev.pubkey)}
      {@const obj = JSON.parse(prof?.content ?? '{}')}
      {@const npub = nip19.npubEncode(ev.pubkey) }
      {@const name = obj.name ?? '' }
      <span class="makibishi-content">{#if ev.content === `:${emojiTag?.at(1) ?? ''}:`}<img src={emojiTag?.at(2)} alt={ev.content} title={ev.content} />{:else}{ ev.content }{/if}</span>
      <a class="makibishi-link" href="{urlToLinkEvent}/{npub}" target="_blank" rel="noopener noreferrer">
        <img class="makibishi-profile-picture" src={obj.picture ?? getRoboHashURL(ev.pubkey)} alt="@{name}" title="@{name}" />
      </a>
    {:else}
      <span class="makibishi-content">{#if ev.content === `:${emojiTag?.at(1) ?? ''}:`}<img src={emojiTag?.at(2)} alt={ev.content} title={ev.content} />{:else}{ ev.content }{/if}</span>
    {/if}
    </span>
  {/each}
</span>

<style>
  span.makibishi-container {
    font-size: 16px;
  }
  span.makibishi-container > span.makibishi-unit a {
    text-decoration: none;
  }
  span.makibishi-container > span.makibishi-unit {
    position: relative;
  }
  span.makibishi-container > span.makibishi-unit > a.makibishi-link {
    position: absolute;
    bottom: 16px;
    left: 0;
    visibility: hidden;
  }
  span.makibishi-container > span.makibishi-unit:hover > a.makibishi-link {
    visibility: visible;
  }
  span.makibishi-container > span.makibishi-unit > span.makibishi-content > img {
    height: 16px;
  }
  span.makibishi-container > span.makibishi-unit > a.makibishi-link > img {
    width: 16px;
    height: 16px;
  }
  span.makibishi-container > button.makibishi-button {
    background-color: rgba(127, 127, 127, 0.2);
    border: none;
    outline: none;
    padding: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;
    border-radius: 10%;
  }
  span.makibishi-container > button.makibishi-button > svg {
    width: 16px;
    height: 16px;
    fill: gray;
  }
  span.makibishi-container > button.makibishi-button:active > svg {
    fill: yellow;
  }
</style>
