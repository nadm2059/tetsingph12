export interface Listing {
  id: string;
  title: string;
  price: number; // 0 for FREE
  condition: string;
  description?: string;
  category?: 'textbooks' | 'electronics' | 'furniture' | 'other';
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  safeMeetupZone?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'seller';
  text: string;
  timestamp: string;
  type?: 'text' | 'meetup-selector' | 'meetup-confirmation' | 'payment-options';
}

export class MarketplaceService {
  private listings: Listing[] = [
    {
      id: '1',
      title: 'Calculus 8th Edition - Stewart',
      price: 25,
      condition: 'Used',
      category: 'textbooks',
      description: 'Used textbook in good condition. Minor highlighting.',
      imageUrl: 'https://via.placeholder.com/150',
      sellerId: 'nadhirah.michael-ho01@student.csulb.edu',
      sellerName: 'Alex',
      safeMeetupZone: 'University Police Department Lobby'
    },
    {
      id: '2',
      title: 'Free Desk Lamp',
      price: 0,
      condition: 'Good',
      category: 'furniture',
      description: 'Moving out of dorm, free desk lamp working perfectly.',
      imageUrl: 'https://via.placeholder.com/150',
      sellerId: 'student2@student.csulb.edu',
      sellerName: 'Taylor',
      safeMeetupZone: 'University Student Union (USU) Information Desk'
    }
  ];

  public createListing(data: Omit<Listing, 'id'>): Listing {
    const newListing: Listing = {
      ...data,
      id: Math.random().toString(36).substring(2, 9)
    };
    this.listings.unshift(newListing);
    return newListing;
  }

  public getListings(category?: string): Listing[] {
    if (category) {
      return this.listings.filter(p => p.category === category);
    }
    return this.listings;
  }

  // Test Suite Compatibility Aliases
  public createPost(data: any): any {
    return this.createListing(data);
  }

  public getPosts(category?: string): any[] {
    return this.getListings(category);
  }
}