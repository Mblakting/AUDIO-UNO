export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type ApiObject = { [key: string]: unknown };

export interface HealthResponse {
  status: "ok";
}

export interface AlbumTrack {
  number: string;
  title: string;
  url: string;
  length: string;
  rating: string;
  ratingCount: number;
  notes: string | null;
  features: string[];
  [key: string]: unknown;
}

export interface AlbumStreamingLink {
  platform: string;
  url: string;
}

export interface AlbumReview {
  score: string;
  publication: string;
  author: string;
  text: string;
  image: string;
  url: string;
  date: string;
  [key: string]: unknown;
}

export interface AlbumCredit {
  title: string;
  credits: ApiObject[];
  [key: string]: unknown;
}

export interface AlbumDetail {
  url: string;
  id: string;
  title: string;
  artist: string;
  artistUrl: string;
  cover: string;
  datePublished: string;
  format: string;
  label: string;
  labelUrl: string;
  genres: string[];
  tags: string[];
  criticScore: string;
  criticScoreExact: string;
  criticCount: string;
  userScore: string;
  userScoreExact: string;
  userCount: string;
  tracklist: AlbumTrack[];
  streamingLinks: AlbumStreamingLink[];
  reviews: AlbumReview[];
  stats: ApiObject;
  credits: AlbumCredit[];
  [key: string]: unknown;
}
