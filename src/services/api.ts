
import type { Artwork } from "../types/artwork";

export interface ApiResponse {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
  data: Artwork[];
}

export const fetchArtworks = async (page: number = 1): Promise<ApiResponse> => {
  const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
  if (!response.ok) {
    throw new Error("Failed to fetch artworks");
  }
  return await response.json();
};
