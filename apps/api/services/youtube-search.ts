import { google } from 'googleapis';
import type { YouTubeTutorial } from '../../../../packages/shared/src/types/tutorial';

/**
 * Search for cooking tutorial videos on YouTube
 */
export async function searchYouTubeTutorials(searchQuery: string, maxResults: number = 10): Promise<YouTubeTutorial[]> {
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY not configured, returning empty results');
    return [];
  }

  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    console.log(`Searching YouTube for: ${searchQuery}`);

    const response = await youtube.search.list({
      part: ['id', 'snippet'],
      q: searchQuery,
      type: ['video'],
      maxResults,
      order: 'relevance',
      videoCategoryId: '26', // Howto & Style category
      safeSearch: 'none',
    });

    if (!response.data.items) {
      return [];
    }

    // Get video IDs for detailed stats
    const videoIds = response.data.items
      .map(item => item.id?.videoId)
      .filter((id): id is string => !!id);

    // Fetch video details for duration and stats
    let videoDetails: any[] = [];
    if (videoIds.length > 0) {
      const detailsResponse = await youtube.videos.list({
        part: ['contentDetails', 'statistics'],
        id: videoIds,
      });
      videoDetails = detailsResponse.data.items || [];
    }

    // Create a map of videoId -> details
    const detailsMap = new Map(
      videoDetails.map(item => [item.id, item])
    );

    const tutorials: YouTubeTutorial[] = response.data.items
      .map((item, index): YouTubeTutorial | null => {
        if (!item.id?.videoId || !item.snippet) {
          return null;
        }

        const videoId = item.id.videoId;
        const details = detailsMap.get(videoId);
        const snippet = item.snippet;

        // Parse duration (ISO 8601 format like PT4M13S)
        const duration = details?.contentDetails?.duration || '';
        const durationSeconds = parseDuration(duration);

        return {
          type: 'video' as const,
          id: `yt-${videoId}`,
          videoId,
          title: snippet.title || 'Untitled',
          description: snippet.description || '',
          thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          channelName: snippet.channelTitle || 'Unknown',
          channelId: snippet.channelId || '',
          duration: formatDuration(durationSeconds),
          publishedAt: snippet.publishedAt || new Date().toISOString(),
          viewCount: details?.statistics?.viewCount ? parseInt(details.statistics.viewCount) : undefined,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter((tutorial): tutorial is YouTubeTutorial => tutorial !== null);

    console.log(`✅ Found ${tutorials.length} YouTube videos`);
    return tutorials;
  } catch (error: any) {
    console.error('Error searching YouTube:', error);
    throw new Error(`Failed to search YouTube: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds to human-readable duration
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (remainingMins > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  return `${hours}h`;
}

