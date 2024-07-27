<script lang="ts">
  import type { NostrEvent } from 'nostr-tools/pure';
  import * as nip19 from 'nostr-tools/nip19';
  import { getRoboHashURL, urlToLinkEvent } from '../config';
  import { inputCount } from '../utils';
  export let ev: NostrEvent;
  export let profiles: Map<string, NostrEvent>;

  $: emojiTag = ev.tags.find((tag) => tag[0] === 'emoji');
  $: isCustomEmoji =
    emojiTag !== undefined &&
    emojiTag.length >= 3 &&
    /^\w+$/.test(emojiTag[1]) &&
    URL.canParse(emojiTag[2]) &&
    ev.content === `:${emojiTag[1]}:`;
  $: isValidEmoji = isCustomEmoji || inputCount(ev.content) <= 1;
</script>

{#if isValidEmoji}<span
    class="makibishi-reaction"
    data-nevent={nip19.neventEncode({ ...ev, author: ev.pubkey })}
    data-npub={nip19.npubEncode(ev.pubkey)}
    data-created-at={ev.created_at}
    ><span class="makibishi-content"
      >{#if isCustomEmoji}<img
          src={emojiTag?.at(2)}
          alt={ev.content}
          title={ev.content}
        />{:else}{ev.content.replace(/^\+$/, '❤').replace(/^-$/, '💔') ||
          '❤'}{/if}</span
    >{#if profiles.has(ev.pubkey)}
      {@const prof = profiles.get(ev.pubkey)}
      {@const obj = JSON.parse(prof?.content ?? '{}')}
      {@const npub = nip19.npubEncode(ev.pubkey)}
      {@const name = obj.name ?? ''}<a
        class="makibishi-link"
        href="{urlToLinkEvent}/{npub}"
        target="_blank"
        rel="noopener noreferrer"
        ><img
          class="makibishi-profile-picture"
          src={obj.picture ?? getRoboHashURL(ev.pubkey)}
          alt="@{name}"
          title="@{name}"
        /></a
      >{/if}</span
  >{/if}

<style>
  span.makibishi-reaction a {
    text-decoration: none;
  }
  span.makibishi-reaction {
    position: relative;
  }
  span.makibishi-reaction > a.makibishi-link {
    position: absolute;
    bottom: 16px;
    left: 0;
    visibility: hidden;
  }
  span.makibishi-reaction:hover > a.makibishi-link {
    visibility: visible;
  }
  span.makibishi-reaction > span.makibishi-content {
    display: inline-block;
    min-width: 16px;
  }
  span.makibishi-reaction > span.makibishi-content > img {
    height: 16px;
    vertical-align: bottom;
  }
  span.makibishi-reaction > a.makibishi-link > img {
    width: 16px;
    height: 16px;
    border-radius: 10%;
  }
</style>
