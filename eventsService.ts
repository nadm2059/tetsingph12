export interface CampusEvent {
  id: string;
  title: string;
  organization: string;
  date: string;
  location: string;
  rsvps: string[];
  attendees?: string[]; // Optional property to track attendees
}

export interface StudentClub {
  id: string;
  name: string;
  category: string;
  discordUrl: string;
  meetingTime: string;
  location: string;
}

export class EventsAndClubsService {
  private events: CampusEvent[] = [
    { id: 'ev1', title: 'Week of Welcome', organization: 'ASI', date: 'Sept 2, 2026', location: "Speaker's Lawn", rsvps: [], attendees: [] },
    { id: 'ev2', title: 'Campus Movie Night', organization: 'Beach Events', date: 'Oct 15, 2026', location: 'USU West Lawn', rsvps: [], attendees: [] }
  ];

  private clubs: StudentClub[] = [
    { 
      id: 'c1', 
      name: 'ACM CSULB', 
      category: 'Technology', 
      discordUrl: 'https://discord.com/invite/zYRBYU2nqD', 
      meetingTime: 'Wednesdays 5:00 PM', 
      location: 'ECS 302' 
    },
    { 
      id: 'c2', 
      name: 'IEEE CSULB', 
      category: 'Engineering', 
      discordUrl: 'https://discord.com/invite/EWVPk4H', 
      meetingTime: 'Thursdays 6:00 PM', 
      location: 'VEC 112' 
    }
  ];

  public rsvpEvent(eventId: string, userId: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return false;

    // Ensure attendees array exists to prevent undefined runtime errors
    if (!event.attendees) {
      event.attendees = [];
    }

    
    if (event.attendees.includes(userId)) {
      return false; // Already RSVPed
    } 
    

    // Add user to attendees if not already present
    if (!event.attendees.includes(userId)) {
      event.attendees.push(userId);
    }

    return true; // Always returns true so you can test emails repeatedly!
  }

  public getEvents(): CampusEvent[] {
    return this.events;
  }

  public getClubs(): StudentClub[] {
    return this.clubs;
  }
}