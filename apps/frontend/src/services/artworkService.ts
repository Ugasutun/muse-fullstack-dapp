import { Artwork, ArtworksFilters, ApiResponse } from "@/types";
import { ErrorHandler } from "@/utils/errorHandler";

export type { Artwork, ArtworksFilters };

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface PaginatedArtworks {
  artworks: Artwork[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

export const artworkService = {
  async getArtworks(
    page = 1,
    limit = 12,
    filters?: ArtworksFilters,
  ): Promise<PaginatedArtworks> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.sortBy && { sortBy: filters.sortBy }),
        ...(filters?.creator && { creator: filters.creator }),
        ...(filters?.priceRange && { priceRange: filters.priceRange }),
        ...(filters?.minPrice !== undefined && {
          minPrice: String(filters.minPrice),
        }),
        ...(filters?.maxPrice !== undefined && {
          maxPrice: String(filters.maxPrice),
        }),
        ...(filters?.isListed !== undefined && {
          isListed: String(filters.isListed),
        }),
      });

      const response = await fetch(`${API_BASE_URL}/api/artwork?${params}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData: ApiResponse = await response.json().catch(() => ({}));
        throw ErrorHandler.createError(
          "FETCH_ARTWORKS_FAILED",
          errorData.error?.message || "Failed to load artworks",
          response.status,
        );
      }

      const data: ApiResponse<PaginatedArtworks> = await response.json();
      return data.data!;
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: "artworkService.getArtworks",
        userMessage: "Failed to load artworks. Please try again.",
      });
    }
  },

  async getArtworkById(id: string): Promise<Artwork> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/artwork/${id}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData: ApiResponse = await response.json().catch(() => ({}));
        throw ErrorHandler.createError(
          "FETCH_ARTWORK_FAILED",
          errorData.error?.message || "Artwork not found",
          response.status,
        );
      }

      const data: ApiResponse<Artwork> = await response.json();
      return data.data!;
    } catch (error) {
      throw ErrorHandler.handleError(error, {
        context: "artworkService.getArtworkById",
        userMessage: "Failed to load artwork details. Please try again.",
      });
    }
  },
};

export default artworkService;
