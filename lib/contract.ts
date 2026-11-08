import { botchain } from "./chain";

export const ARTFOLIO_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as `0x${string}`;

export const ARTFOLIO_ABI = [
  {
    inputs: [
      { internalType: "string", name: "title", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "string", name: "imageUrl", type: "string" },
      { internalType: "string", name: "category", type: "string" },
    ],
    name: "publishArtwork",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "likeArtwork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "unlikeArtwork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "removeArtwork",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllArtworks",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "author", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "likesCount", type: "uint256" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct Artfolio.Artwork[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "author", type: "address" }],
    name: "getArtworksByAuthor",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "author", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "likesCount", type: "uint256" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct Artfolio.Artwork[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "id", type: "uint256" }],
    name: "getArtworkById",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "author", type: "address" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "imageUrl", type: "string" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "likesCount", type: "uint256" },
          { internalType: "bool", name: "exists", type: "bool" },
        ],
        internalType: "struct Artfolio.Artwork",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "user", type: "address" },
    ],
    name: "hasUserLiked",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPlatformStats",
    outputs: [
      { internalType: "uint256", name: "totalActive", type: "uint256" },
      { internalType: "uint256", name: "totalLikes", type: "uint256" },
      { internalType: "uint256", name: "totalEverCreated", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalActiveArtworks",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPlatformLikes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "author", type: "address" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "string", name: "category", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ArtworkPublished",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
    ],
    name: "ArtworkLiked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
    ],
    name: "ArtworkUnliked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "author", type: "address" },
    ],
    name: "ArtworkRemoved",
    type: "event",
  },
] as const;

export interface RawArtwork {
  id: bigint;
  author: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  timestamp: bigint;
  likesCount: bigint;
  exists: boolean;
}

export interface ArtworkData {
  id: number;
  author: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  timestamp: number;
  likesCount: number;
  isLikedByMe?: boolean;
}

