class Tweet {
    private text: string;
    time: Date;

    constructor(tweet_text: string, tweet_time: string) {
        this.text = tweet_text;
        this.time = new Date(tweet_time);
    }

    // --------------------------------------------------------
    // Identify tweet source: live_event, achievement, completed_event, or miscellaneous
    get source(): string {
        const t = this.text.toLowerCase();

        if (t.includes("completed") && t.includes("runkeeper"))
            return "completed_event";
        if (t.includes("achieved") || t.includes("set a goal"))
            return "achievement";
        if (t.includes("live on") || t.includes("watch") || t.includes("broadcast"))
            return "live_event";
        return "miscellaneous";
    }

    // --------------------------------------------------------
    // True if the tweet includes user-written content
    get written(): boolean {
        // If it contains a colon, there’s usually user-added text after RunKeeper auto text
        // Example: "Just completed a 5.00 mi run with Runkeeper: Feeling great!"
        return this.text.includes(":");
    }

    // --------------------------------------------------------
    // Extract user-written text (the part after the colon)
    get writtenText(): string {
        if (!this.written) return "";

        // Split on the first colon and trim
        const parts = this.text.split(":");
        if (parts.length < 2) return "";
        return parts.slice(1).join(":").trim();
    }

    // --------------------------------------------------------
    // Extract activity type (only for completed_event)
    get activityType(): string {
        if (this.source !== "completed_event") return "unknown";

        // Common phrasing: "Just completed a 5.00 mi run with @Runkeeper"
        const match = this.text.match(/completed.+?\s(mi|km|mile|miles|kilometer|kilometers)\s+([a-z]+)/i);
        if (match && match[2]) {
            return match[2].toLowerCase();
        }

        // Fallback pattern if above fails
        const fallback = this.text.match(/completed.+?with\s+@runkeeper/i);
        if (fallback) {
            return "unknown";
        }

        return "unknown";
    }

    // --------------------------------------------------------
    // Extract distance (only for completed_event)
    get distance(): number {
        if (this.source !== "completed_event") return 0;

        // Matches numbers like 5, 5.00, 13.1, etc.
        const match = this.text.match(/(\d+(\.\d+)?)\s?(mi|miles|km|kilometers)/i);
        if (match && match[1]) {
            let distance = parseFloat(match[1]);
            // Convert km to miles for consistency
            if (/km|kilometer/.test(match[3].toLowerCase())) {
                distance *= 0.621371;
            }
            return distance;
        }
        return 0;
    }

    // --------------------------------------------------------
    // HTML table row summarizing the tweet with a clickable RunKeeper link
    getHTMLTableRow(rowNumber: number): string {
        // Extract link from tweet text if any
        const linkMatch = this.text.match(/https?:\/\/\S+/);
        const link = linkMatch ? linkMatch[0] : "#";
        const linkHTML = link !== "#" ? `<a href="${link}" target="_blank">Link</a>` : "No link";

        return `
            <tr>
                <td>${rowNumber}</td>
                <td>${this.activityType}</td>
                <td>${this.source}</td>
                <td>${this.writtenText || "(no comment)"}</td>
                <td>${linkHTML}</td>
            </tr>
        `;
    }
}
