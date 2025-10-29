const KM_TO_MI = 0.621371;

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function firstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/\S+/);
  return m ? m[0] : null;
}

class Tweet {
  private text: string;
  time: Date;

  constructor(tweet_text: string, tweet_time: string) {
    this.text = tweet_text;
    this.time = new Date(tweet_time);
  }

  // live_event | achievement | completed_event | miscellaneous
  get source(): string {
    const t = norm(this.text);

    // Completed events (canonical phrasing in dataset)
    if (/^just completed\b/.test(t) && /runkeeper/.test(t)) return "completed_event";

    // Live events
    if ((/\blive on\b/.test(t) || /watch\b.*\blive\b/.test(t)) && /runkeeper/.test(t))
      return "live_event";

    // Achievements 
    if (/\b(achiev(ed|ement)|personal\s+record|new\s+record|pr\b|set\s+a\s+goal)\b/.test(t))
      return "achievement";

    return "miscellaneous";
  }

  
    //helper
  private firstRealCommentColonIndex(): number {
    // remove URLs first
    const noUrls = this.text.replace(/https?:\/\/\S+/gi, "");
    // remove timestamps 
    const noUrlsNoTimes = noUrls.replace(/\b\d{1,2}:\d{2}\b/g, "");
    // return index of first remaining colon
    return noUrlsNoTimes.indexOf(":");
  }

  // whether the tweet includes user-written content 
  get written(): boolean {
    const idx = this.firstRealCommentColonIndex();
    if (idx === -1) return false;
    // must have at least one visible character after the colon
    return /\S/.test(this.text.slice(idx + 1));
  }

  // the user-written portion after the real colon
  get writtenText(): string {
    const idx = this.firstRealCommentColonIndex();
    if (idx === -1) return "";
    return this.text.slice(idx + 1).trim();
  }


  // activity type only for completed events
  get activityType(): string {
    if (this.source !== "completed_event") return "unknown";

    const t = norm(this.text);
    // capturing the token after the distance unit
    const m =
      t.match(/completed.*?\b\d+(?:\.\d+)?\s*(?:mi|mile|miles|km|kilometer|kilometers)\s+([a-z]+)/i) ||
      // fallback: capture the word before "with @runkeeper"
      t.match(/completed.*?\b([a-z]+)\s+with\s+@?runkeeper/i);

    const activity = m?.[1];
    return activity ? activity.toLowerCase() : "unknown";
  }

  // distance in miles (0 if not found or not a completed event)
  get distance(): number {
    if (this.source !== "completed_event") return 0;

    const t = norm(this.text);
    const m = t.match(/(\d+(?:\.\d+)?)\s*(mi|mile|miles|km|kilometer|kilometers)/i);
    if (!m) return 0;

    let d = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (unit.startsWith("km") || unit.startsWith("kilometer")) d *= KM_TO_MI; // normalize to miles
    return d;
  }

  // HTML row for the Descriptions page table
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
