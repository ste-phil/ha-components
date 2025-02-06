<script lang="ts">
  const now = new Date();
  let hours = $derived(now.getHours());
  let minutes = $derived(now.getMinutes());
  let date = $derived(now.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }));
</script>

<div class="container">
  <span class="time">
    {hours.toString().padStart(2, "0")}
    <span class="time-colon">:</span>
    {minutes.toString().padStart(2, "0")}
  </span>
  <b class="date">{date}</b>
  <b class="message">
    {#if hours <= 1}
      Gute Nacht {"\u{0001F611}"}
    {:else if hours <= 3}
      Gute Nacht {"\u{0001F62A}"}
    {:else if hours <= 5}
      Gute Nacht {"\u{0001F634}"}
    {:else if hours <= 7}
      Guten Morgen {"\u{0001F4A}"}
    {:else if hours <= 9}
      Guten Morgen {"\u{2615}\u{FE0F}"}
    {:else if hours <= 10}
      Guten Morgen {"\u{0001F642}"}
    {:else if hours <= 13}
      Guten Tag {"\u{0001F60A}"}
    {:else if hours <= 15}
      Guten Tag {"\u{0001F60E}"}
    {:else if hours <= 17}
      Guten Tag {"\u{0001F44B}\u{0001F3FB}"}
    {:else if hours <= 19}
      Guten Abend {"\u{0001F44B}\u{0001F3FB}"}
    {:else if hours <= 22}
      Guten Abend {"\u{0001F60C}"}
    {:else if hours <= 23}
      Guten Abend {"\u{0001F974}"}
    {:else}
      Guten Abend {"\u{0001F974}"}
    {/if}
  </b>
</div>

<style>
  b {
    margin-top: 10px;
  }

  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1.5vw 0;
  }

  .time {
    font-size: var(--sidebar-time-font-size);
    font-weight: 300;
    line-height: var(--sidebar-time-line-height);
    letter-spacing: 0.11vw;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
  }

  .time-colon {
    position: relative;
    top: -0.11em;
  }

  .date {
    font-size: var(--sidebar-font-size);
    line-height: var(--sidebar-line-height);
    font-weight: bolder;
    letter-spacing: 0.07vw;
    color: #6a7377;
  }

  .message {
    font-size: var(--sidebar-font-size);
    line-height: var(--sidebar-line-height);
    font-weight: bold;
    letter-spacing: 0.07vw;
    color: rgba(255, 255, 255, 0.8);
}
</style>
