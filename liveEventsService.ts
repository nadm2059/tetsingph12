import Parser from 'rss-parser';

const parser = new Parser();

// Official CSULB Master Calendar RSS Feed
const CSULB_RSS_FEED = 'https://specialevents.csulb.edu/MasterCalendar/RSSFeeds.aspx?data=OiNeXA6LJItp%2bLkkMsbi44p4NytRjlGR8%2bPjA5MxKXKhORje%2f3QUbw%3d%3d';

export interface CSULBEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  link: string;
}

export class LiveEventsService {
  public async fetchLiveEvents(): Promise<CSULBEvent[]> {
    try {
      const feed = await parser.parseURL(CSULB_RSS_FEED);
      return feed.items.map((item, index) => ({
        id: item.guid || `csulb-event-${index}`,
        title: item.title || 'CSULB Campus Event',
        date: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'TBD',
        location: item.contentSnippet || 'CSULB Campus',
        link: item.link || 'https://www.csulb.edu'
      }));
    } catch (error) {
      console.error('Error fetching live CSULB events feed:', error);
      return [];
    }
  }
}