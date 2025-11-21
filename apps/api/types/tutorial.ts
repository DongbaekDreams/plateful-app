export type TutorialType = 'video' | 'written';

export interface YouTubeTutorial {
  type: 'video';
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string;
  duration: string;
  publishedAt: string;
  viewCount?: number;
  url: string; // YouTube URL
}

export interface WrittenTutorial {
  type: 'written';
  id: string;
  title: string;
  description: string;
  url: string;
  content?: string; // Scraped content
  imageUrl?: string;
  author?: string;
  siteName?: string;
}

export type Tutorial = YouTubeTutorial | WrittenTutorial;

export interface SavedTutorial {
  id: string;
  tutorialID: string;
  userID: string;
  tutorialType: TutorialType;
  tutorial: Tutorial;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}
