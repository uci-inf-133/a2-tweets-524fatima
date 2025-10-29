// ts/tweet.ts
// A2 — RunKeeper Tweets
// Only edit this TypeScript file. The compiled output js/tweet.js is auto-generated.

const KM_TO_MI = 0.621371;

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function firstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

export default class Tweet {
  private text: string;
  time: Date;

  constructor(tweet_text: string, tweet_time: string) {
    this.text = tweet_text;
    this.time = new Date(tweet_time);
  }

  /** Source classifier:
   * returns one of 'completed_event' | 'live_event' | 'achievement' | 'miscellaneous'
   */
  get source(): string {
    const t = norm(this.text);

    // Completed events (canonical phrasing in dataset)
    // e.g., "Just completed a 5.00 mi run with @Runkeeper …"
    if (/^just completed\b/.test(t) && /runkeeper/.test(t)) return "completed_event";

    // Live events
    // e.g., "Watch my run live on @Runkeeper" / "I'm live on Runkeeper"
    if (/\blive on\b/.test(t) || /watch\b.*\blive\b/.test(t)) {
      if (/runkeeper/.test(t)) return "live_event";
    }

    // Achievements
    // e.g., "Achieved a personal record" / "new personal record (PR)" / "set a goal"
    if (/\b(achiev(ed|ement)|personal\s+record|new\s+record|pr\b|set\s+a\s+goal)\b/.test(t)) {
      return "achievement";
    }

    return "miscellaneous";
  }

  /** Whether there is user-written content. In this assignment’s dataset,
   * user text usually follows a colon after the auto-generated part.
   */
  get written(): boolean {
    // A colon followed by any non-whitespace is a reliable signal here
    return /:\s*\S/.test(this.text);
  }

  /** Returns the user-written portion (after the first colon), or "" */
  get writtenText(): string {
    if (!this.written) return "";
    const m = this.text.match(/:(.*)$/);
    return (m?.[1] ?? "").trim();
  }

  /** Activity type for completed events: e.g., run, walk, bike, hike, etc.
   * Returns 'unknown' if not a completed event or not detected.
   */
  get activityType(): string {
    if (this.source !== "completed_event") return "unknown";

    const t = norm(this.text);

    // Typical pattern: "... 5.00 mi run with @Runkeeper"
    // Capture the token after the unit as the activity word
    const m =
      t.match(/completed.*?\b\d+(?:\.\d+)?\s*(?:mi|mile|miles|km|kilometer|kilometers)\s+([a-z]+)/i) ||
      // Fallback: sometimes unit might be omitted; capture final word before "with @runkeeper"
      t.match(/completed.*?\b([a-z]+)\s+with\s+@?runkeeper/i);

    const activity = m?.[1];
    return activity ? activity.toLowerCase() : "unknown";
  }

  /** Distance in miles for completed events; 0 otherwise. */
  get distance(): number {
    if (this.source !== "completed_event") return 0;

    const t = norm(this.text);
    const m = t.match(/(\d+(?:\.\d+)?)\s*(mi|mile|miles|km|kilometer|kilometers)/i);
    if (!m) return 0;

    let d = parseFloat(m[1]);
    const unit = m[2].toLowerCase();

    if (unit.startsWith("km") || unit.startsWith("kilometer")) {
      d *= KM_TO_MI; // normalize to miles
    }
    return d;
  }

  /** A table row for Descriptions:
   *  # | Activity type | Tweet (user text) | Link
   */
  getHTMLTableRow(rowNumber: number): string {
    const link = firstUrl(this.text);
    const linkHTML = link ? `<a href="${link}" target="_blank" rel="noopener">Open</a>` : "No link";
    const userText = this.writtenText || "(no comment)";
    return `
      <tr>
        <td>${rowNumber}</td>
        <td>${this.activityType}</td>
        <td>${userText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
        <td>${linkHTML}</td>
      </tr>`.trim();
  }
}
