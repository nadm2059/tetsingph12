export interface UserGamificationProfile {
  userId: string;
  points: number;
  badges: string[];
}

export class RewardsEngine {
  private profiles: Map<string, UserGamificationProfile> = new Map();

  public awardPoints(userId: string, points: number, reason: string): UserGamificationProfile {
    let profile = this.profiles.get(userId) || { userId, points: 340, badges: ['New Student', 'Campus Helper'] };
    profile.points += points;

    if (profile.points >= 400 && !profile.badges.includes('Community Pillar')) {
      profile.badges.push('Community Pillar');
    }
    if (profile.points >= 500 && !profile.badges.includes('Beach Legend')) {
      profile.badges.push('Beach Legend');
    }

    this.profiles.set(userId, profile);
    return profile;
  }

  public getProfile(userId: string): UserGamificationProfile {
    return this.profiles.get(userId) || { userId, points: 340, badges: ['New Student', 'Campus Helper'] };
  }
}
