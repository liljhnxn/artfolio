"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import Image from "next/image";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, isAddress } from "viem";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Heart,
  Plus,
  Compass,
  Palette,
  ExternalLink,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  Copy,
  Check,
  Search,
  Filter,
  User,
  Image as ImageIcon,
  Flame,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { botchain } from "@/lib/chain";
import { ARTFOLIO_ABI, ARTFOLIO_CONTRACT_ADDRESS, RawArtwork, ArtworkData } from "@/lib/contract";

// Pre-curated high-res digital art presets so users can test immediately
const CURATED_PRESETS = [
  {
    title: "Cosmic Odyssey",
    category: "Digital Art",
    description: "An ethereal voyage navigating iridescent nebulae and stellar tides in deep hyperspace.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Monolith of Silence",
    category: "Abstract",
    description: "A meditation on brutalism and spectral light dissolving across monolithic stone forms.",
    imageUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cyberpunk Rain",
    category: "Illustration",
    description: "Neon reflections shimmer across wet asphalt as synthwave drones hum into the twilight.",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Golden Hour Solitude",
    category: "Photography",
    description: "Atmospheric lens capturing the fragile geometry of desert dunes sculpted by shifting winds.",
    imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Chrono Dimension",
    category: "3D Art",
    description: "A procedural kinetic sculpture warping liquid glass, chrome tendrils, and gravitic pulses.",
    imageUrl: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&w=1200&q=80",
  },
];

const CATEGORIES = ["All", "Digital Art", "Photography", "Illustration", "Abstract", "3D Art"] as const;
type Category = (typeof CATEGORIES)[number];

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "loading";
  title: string;
  message?: string;
  txHash?: string;
}

export default function ArtfolioPage() {
  // Wallet state
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });

  // Contract address state (allows runtime fallback/override if user deployed dynamically)
  const [contractAddress, setContractAddress] = useState<`0x${string}`>(ARTFOLIO_CONTRACT_ADDRESS);
  const [contractInput, setContractInput] = useState<string>("");
  const [showContractConfig, setShowContractConfig] = useState<boolean>(false);

  // Load saved contract address from localStorage if set
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("artfolio_contract_address");
      if (saved && isAddress(saved)) {
        setContractAddress(saved as `0x${string}`);
        setContractInput(saved);
      } else if (ARTFOLIO_CONTRACT_ADDRESS) {
        setContractAddress(ARTFOLIO_CONTRACT_ADDRESS);
        setContractInput(ARTFOLIO_CONTRACT_ADDRESS);
      }
    }
  }, []);

  // UI Navigation & filter states
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [viewMode, setViewMode] = useState<"explore" | "my-art">("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkData | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Form states for Publish Artwork
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Digital Art");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Notifications / Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast["type"], title: string, message?: string, txHash?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, txHash }]);
    if (type !== "loading") {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 7000);
    }
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // wagmi Write contract hook
  const {
    writeContractAsync,
    isPending: isWritePending,
    data: txHash,
  } = useWriteContract();

  // Watch for transaction receipt
  const { isLoading: isTxWaiting, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Track pending action for UX loader
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Read all artworks from contract
  const {
    data: rawArtworks,
    isLoading: isArtworksLoading,
    isRefetching: isArtworksRefetching,
    refetch: refetchArtworks,
  } = useReadContract({
    address: contractAddress,
    abi: ARTFOLIO_ABI,
    functionName: "getAllArtworks",
    query: {
      enabled: isAddress(contractAddress),
      refetchInterval: 12000,
    },
  });

  // Read stats from contract
  const { data: statsData, refetch: refetchStats } = useReadContract({
    address: contractAddress,
    abi: ARTFOLIO_ABI,
    functionName: "getPlatformStats",
    query: {
      enabled: isAddress(contractAddress),
      refetchInterval: 12000,
    },
  });

  // Local optimistic likes tracking: { [artworkId: number]: { count: number, liked: boolean } }
  const [optimisticLikes, setOptimisticLikes] = useState<Record<number, { count: number; liked: boolean }>>({});

  // Parse raw artworks
  const artworks: ArtworkData[] = useMemo(() => {
    if (!rawArtworks || !Array.isArray(rawArtworks)) return [];

    return (rawArtworks as RawArtwork[])
      .filter((art) => art.exists)
      .map((art) => {
        const id = Number(art.id);
        const baseLikes = Number(art.likesCount);
        const opt = optimisticLikes[id];

        return {
          id,
          author: art.author,
          title: art.title,
          description: art.description,
          imageUrl: art.imageUrl,
          category: art.category,
          timestamp: Number(art.timestamp),
          likesCount: opt !== undefined ? opt.count : baseLikes,
          isLikedByMe: opt !== undefined ? opt.liked : false,
        };
      });
  }, [rawArtworks, optimisticLikes]);

  // Read user like status for visible artworks when wallet changes or artworks load
  useEffect(() => {
    if (!isConnected || !address || !isAddress(contractAddress) || artworks.length === 0) return;

    // Check likes via public client or individual calls if needed
    // Wagmi hook batches can be kept track of or we can optimistically toggle
  }, [isConnected, address, contractAddress, artworks.length]);

  // Derived stats
  const totalArtworksCount = useMemo(() => {
    if (statsData && Array.isArray(statsData)) {
      return Number(statsData[0]);
    }
    return artworks.length;
  }, [statsData, artworks.length]);

  const totalLikesCount = useMemo(() => {
    if (statsData && Array.isArray(statsData)) {
      return Number(statsData[1]);
    }
    return artworks.reduce((acc, a) => acc + a.likesCount, 0);
  }, [statsData, artworks]);

  // Filtered artworks
  const filteredArtworks = useMemo(() => {
    return artworks.filter((item) => {
      // Category filter
      if (activeCategory !== "All" && item.category !== activeCategory) {
        return false;
      }
      // My Artwork view
      if (viewMode === "my-art") {
        if (!address) return false;
        if (item.author.toLowerCase() !== address.toLowerCase()) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchAuthor = item.author.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAuthor && !matchCategory) {
          return false;
        }
      }
      return true;
    });
  }, [artworks, activeCategory, viewMode, searchQuery, address]);

  // My artwork count
  const myArtworkCount = useMemo(() => {
    if (!address) return 0;
    return artworks.filter((a) => a.author.toLowerCase() === address.toLowerCase()).length;
  }, [artworks, address]);

  // Confetti trigger
  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#B69CFF", "#CEBDFF", "#906CFA", "#FFFFFF", "#FF6B6B"],
    });
  };

  // Helper to format short address
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Format timestamp
  const formatTime = (ts: number) => {
    if (!ts) return "Recently";
    const date = new Date(ts * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Publish artwork handler
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      addToast("error", "Wallet Not Connected", "Please connect your wallet first.");
      return;
    }
    if (!isAddress(contractAddress)) {
      addToast("error", "Contract Address Missing", "Please configure a valid Artfolio contract address.");
      setShowContractConfig(true);
      return;
    }
    if (chain?.id !== botchain.id) {
      try {
        await switchChain({ chainId: botchain.id });
      } catch (err) {
        addToast("error", "Wrong Network", "Please switch your wallet to Botchain Testnet (Chain ID 968).");
        return;
      }
    }

    if (!formTitle.trim()) {
      addToast("error", "Validation Error", "Artwork title is required.");
      return;
    }
    if (!formImageUrl.trim()) {
      addToast("error", "Validation Error", "Image URL is required.");
      return;
    }

    setPendingAction("publish");
    const toastId = addToast("loading", "Publishing Artwork", "Signing transaction and broadcasting to Botchain...");

    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: ARTFOLIO_ABI,
        functionName: "publishArtwork",
        args: [formTitle.trim(), formDescription.trim(), formImageUrl.trim(), formCategory],
      });

      removeToast(toastId);
      addToast("success", "Artwork Published!", "Your masterpiece is now immortalized on Botchain.", hash);
      triggerCelebration();

      // Reset form and close modal
      setFormTitle("");
      setFormDescription("");
      setFormImageUrl("");
      setIsPublishModalOpen(false);

      // Refetch data
      setTimeout(() => {
        refetchArtworks();
        refetchStats();
      }, 2000);
    } catch (err: any) {
      removeToast(toastId);
      console.error("Publish failed:", err);
      const msg = err?.shortMessage || err?.message || "Failed to publish artwork on-chain.";
      addToast("error", "Publish Failed", msg);
    } finally {
      setPendingAction(null);
    }
  };

  // Like / Unlike handler
  const handleToggleLike = async (art: ArtworkData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!isConnected) {
      addToast("info", "Connect Wallet", "Connect your wallet to like artworks and support artists.");
      return;
    }
    if (!isAddress(contractAddress)) {
      addToast("error", "Contract Not Configured", "Please set the contract address.");
      setShowContractConfig(true);
      return;
    }
    if (chain?.id !== botchain.id) {
      try {
        await switchChain({ chainId: botchain.id });
      } catch {
        addToast("error", "Wrong Network", "Switch to Botchain Testnet (Chain ID 968).");
        return;
      }
    }

    const currentLiked = art.isLikedByMe ?? false;
    const isLiking = !currentLiked;

    // Optimistic UI update
    setOptimisticLikes((prev) => ({
      ...prev,
      [art.id]: {
        count: isLiking ? art.likesCount + 1 : Math.max(0, art.likesCount - 1),
        liked: isLiking,
      },
    }));

    // If modal is viewing this artwork, update it
    if (selectedArtwork && selectedArtwork.id === art.id) {
      setSelectedArtwork({
        ...selectedArtwork,
        likesCount: isLiking ? selectedArtwork.likesCount + 1 : Math.max(0, selectedArtwork.likesCount - 1),
        isLikedByMe: isLiking,
      });
    }

    setPendingAction(`like-${art.id}`);
    const toastId = addToast(
      "loading",
      isLiking ? "Liking Artwork..." : "Unliking Artwork...",
      `Sending transaction for "${art.title}"`
    );

    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: ARTFOLIO_ABI,
        functionName: isLiking ? "likeArtwork" : "unlikeArtwork",
        args: [BigInt(art.id)],
      });

      removeToast(toastId);
      addToast(
        "success",
        isLiking ? "Artwork Liked!" : "Artwork Unliked",
        isLiking ? `You appreciated "${art.title}".` : `Like removed for "${art.title}".`,
        hash
      );

      setTimeout(() => {
        refetchArtworks();
        refetchStats();
      }, 2000);
    } catch (err: any) {
      removeToast(toastId);
      // Revert optimistic update
      setOptimisticLikes((prev) => ({
        ...prev,
        [art.id]: {
          count: art.likesCount,
          liked: currentLiked,
        },
      }));
      if (selectedArtwork && selectedArtwork.id === art.id) {
        setSelectedArtwork({
          ...selectedArtwork,
          likesCount: art.likesCount,
          isLikedByMe: currentLiked,
        });
      }

      const msg = err?.shortMessage || err?.message || "Transaction failed";
      addToast("error", isLiking ? "Like Failed" : "Unlike Failed", msg);
    } finally {
      setPendingAction(null);
    }
  };

  // Remove artwork handler (author only)
  const handleRemoveArtwork = async (art: ArtworkData) => {
    if (!isConnected || !address) {
      addToast("error", "Unauthorized", "Please connect the author wallet.");
      return;
    }
    if (art.author.toLowerCase() !== address.toLowerCase()) {
      addToast("error", "Unauthorized", "Only the original author can remove this artwork.");
      return;
    }

    const confirm = window.confirm(`Are you sure you want to permanently remove "${art.title}" from Artfolio?`);
    if (!confirm) return;

    setPendingAction(`remove-${art.id}`);
    const toastId = addToast("loading", "Removing Artwork...", `Submitting removal of "${art.title}" to Botchain.`);

    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: ARTFOLIO_ABI,
        functionName: "removeArtwork",
        args: [BigInt(art.id)],
      });

      removeToast(toastId);
      addToast("success", "Artwork Removed", `"${art.title}" was successfully deleted on-chain.`, hash);

      if (selectedArtwork?.id === art.id) {
        setSelectedArtwork(null);
      }

      setTimeout(() => {
        refetchArtworks();
        refetchStats();
      }, 2000);
    } catch (err: any) {
      removeToast(toastId);
      const msg = err?.shortMessage || err?.message || "Failed to remove artwork.";
      addToast("error", "Removal Failed", msg);
    } finally {
      setPendingAction(null);
    }
  };

  // Apply curated preset
  const applyPreset = (preset: (typeof CURATED_PRESETS)[0]) => {
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormDescription(preset.description);
    setFormImageUrl(preset.imageUrl);
    setImagePreviewError(false);
  };

  // Save custom contract address
  const handleSaveContractAddress = () => {
    if (!isAddress(contractInput.trim())) {
      addToast("error", "Invalid Address", "Please provide a valid Ethereum-style hex address.");
      return;
    }
    const cleanAddr = contractInput.trim() as `0x${string}`;
    setContractAddress(cleanAddr);
    if (typeof window !== "undefined") {
      localStorage.setItem("artfolio_contract_address", cleanAddr);
    }
    setShowContractConfig(false);
    addToast("success", "Contract Configured", `Updated Artfolio address to: ${cleanAddr}`);
    refetchArtworks();
    refetchStats();
  };

  return (
    <div className="min-h-screen bg-[#111116] text-[#FFFFFF] relative selection:bg-[#B69CFF] selection:text-[#111116]">
      {/* Ambient background glows */}
      <div className="ambient-glow w-[500px] h-[500px] -top-32 -left-32 fixed" />
      <div className="ambient-glow w-[600px] h-[600px] top-[40%] -right-40 fixed bg-gradient-to-br from-[#906CFA] to-transparent opacity-10" />
      <div className="ambient-glow w-[700px] h-[700px] -bottom-40 left-[20%] fixed bg-gradient-to-tr from-[#B69CFF] to-transparent opacity-10" />

      {/* ============================================================== */}
      {/* NAVIGATION                                                    */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 glass-nav border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-4">
            <div className="relative group cursor-pointer" onClick={() => { setActiveCategory("All"); setViewMode("explore"); }}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#906CFA] via-[#B69CFF] to-white flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform duration-300">
                <Palette className="w-6 h-6 text-[#111116]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-editorial text-2xl font-bold tracking-tight text-white">
                  Artfolio
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#B69CFF]/15 text-[#B69CFF] border border-[#B69CFF]/30">
                  Botchain
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] tracking-wide">
                Your Art. Your Space.
              </p>
            </div>
          </div>

          {/* Center: Navigation View Switcher */}
          <div className="hidden md:flex items-center space-x-1 p-1 rounded-full bg-[#20202A]/80 border border-white/5">
            <button
              onClick={() => setViewMode("explore")}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewMode === "explore"
                  ? "bg-[#B69CFF] text-[#111116] shadow-glow"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              Explore Gallery
            </button>
            <button
              onClick={() => {
                if (!isConnected) {
                  addToast("info", "Connect Wallet", "Connect your wallet to access your art collection.");
                } else {
                  setViewMode("my-art");
                }
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === "my-art"
                  ? "bg-[#B69CFF] text-[#111116] shadow-glow"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              <span>My Artwork</span>
              {isConnected && myArtworkCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#111116]/40">
                  {myArtworkCount}
                </span>
              )}
            </button>
          </div>

          {/* Right: Actions & Wallet */}
          <div className="flex items-center space-x-3">
            {/* Publish Artwork CTA */}
            <button
              onClick={() => {
                if (!isConnected) {
                  addToast("info", "Connect Wallet", "Please connect your wallet before publishing.");
                }
                setIsPublishModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B69CFF] to-[#906CFA] text-[#111116] font-semibold text-xs tracking-wide shadow-glow hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-[#111116] stroke-[2.5]" />
              <span className="hidden sm:inline">Publish Artwork</span>
            </button>

            {/* Wallet Connect / Account Pill */}
            {!isConnected ? (
              <button
                onClick={() => {
                  const metaMaskConnector = connectors.find((c) => c.name.toLowerCase().includes("metamask")) || connectors[0];
                  if (metaMaskConnector) {
                    connect({ connector: metaMaskConnector });
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#20202A] hover:bg-[#262633] border border-white/10 text-white text-xs font-medium transition-all hover:border-[#B69CFF]/40"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Network checker */}
                {chain?.id !== botchain.id ? (
                  <button
                    onClick={() => switchChain({ chainId: botchain.id })}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-medium hover:bg-red-900/60 transition-all"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Switch to Botchain</span>
                  </button>
                ) : (
                  <div className="hidden lg:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#20202A]/80 border border-white/5 text-xs text-[#A1A1AA]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span>Botchain 968</span>
                  </div>
                )}

                {/* Account info pill */}
                <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#20202A] border border-white/10 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#B69CFF] to-[#906CFA] flex items-center justify-center font-bold text-[#111116] text-[10px]">
                    {address?.substring(2, 4).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-medium">{formatAddress(address || "")}</span>
                    <span className="text-[10px] text-[#A1A1AA]">
                      {balanceData ? `${Number(balanceData.formatted).toFixed(3)} ${balanceData.symbol}` : "0.00 BOHR"}
                    </span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    title="Disconnect Wallet"
                    className="text-[#A1A1AA] hover:text-red-400 p-1 rounded transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Contract config toggle */}
            <button
              onClick={() => setShowContractConfig(!showContractConfig)}
              title="Contract settings"
              className="p-2.5 rounded-xl bg-[#20202A] border border-white/5 text-[#A1A1AA] hover:text-white hover:border-[#B69CFF]/30 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Contract Configuration Bar */}
        {showContractConfig && (
          <div className="bg-[#171720] border-t border-white/10 px-4 py-3 text-xs transition-all animate-fadeIn">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-[#A1A1AA]">
                <ShieldCheck className="w-4 h-4 text-[#B69CFF]" />
                <span>Smart Contract on Botchain Testnet (Chain ID 968):</span>
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <input
                  type="text"
                  value={contractInput}
                  onChange={(e) => setContractInput(e.target.value)}
                  placeholder="0x... (Artfolio contract address)"
                  className="w-full md:w-80 px-3 py-1.5 rounded-lg bg-[#20202A] border border-white/10 text-white placeholder-zinc-500 font-mono text-[11px] focus:outline-none focus:border-[#B69CFF]"
                />
                <button
                  onClick={handleSaveContractAddress}
                  className="px-3 py-1.5 rounded-lg bg-[#B69CFF] text-[#111116] font-semibold text-xs whitespace-nowrap hover:bg-[#CEBDFF] transition-colors"
                >
                  Save Address
                </button>
                {contractAddress && (
                  <a
                    href={`https://scan.bohr.life/address/${contractAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-[#20202A] border border-white/10 text-[#A1A1AA] hover:text-white"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* HERO SECTION                                                  */}
      {/* ============================================================== */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Subtle Tag Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#20202A]/90 border border-[#B69CFF]/20 mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#B69CFF]" />
            <span className="text-xs uppercase tracking-widest text-[#B69CFF] font-medium">
              Decentralized Digital Art Exhibition
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.08]">
            Where Creativity <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#CEBDFF] to-[#B69CFF]">
              Finds Its Home.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-[#A1A1AA] text-base sm:text-lg mb-10 font-normal leading-relaxed">
            Your Art. Your Space. Publish visionary artwork directly onto Botchain, discover evocative creations from global artists, and share appreciation with verified on-chain permanence.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={() => {
                if (!isConnected) {
                  addToast("info", "Connect Wallet", "Connect your wallet to publish artwork.");
                }
                setIsPublishModalOpen(true);
              }}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#B69CFF] to-[#906CFA] text-[#111116] font-semibold text-sm tracking-wide shadow-glow hover:shadow-glow-lg hover:scale-105 active:scale-95 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Publish Artwork</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("gallery-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-3.5 rounded-xl bg-[#20202A] hover:bg-[#262633] text-white font-medium text-sm border border-white/10 hover:border-[#B69CFF]/40 transition-all flex items-center space-x-2"
            >
              <Compass className="w-4 h-4 text-[#B69CFF]" />
              <span>Explore Gallery</span>
            </button>
          </div>

          {/* Counters / Live Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* Total Artworks */}
            <div className="p-6 rounded-2xl bg-[#20202A]/70 border border-white/5 backdrop-blur-md hover:border-[#B69CFF]/30 transition-all">
              <div className="flex items-center justify-center space-x-2 text-[#A1A1AA] text-xs uppercase tracking-wider mb-2">
                <Layers className="w-4 h-4 text-[#B69CFF]" />
                <span>Total Artworks</span>
              </div>
              <div className="font-editorial text-3xl sm:text-4xl font-bold text-white">
                {totalArtworksCount}
              </div>
              <div className="text-[11px] text-[#A1A1AA] mt-1">Published on-chain</div>
            </div>

            {/* Total Likes */}
            <div className="p-6 rounded-2xl bg-[#20202A]/70 border border-white/5 backdrop-blur-md hover:border-[#B69CFF]/30 transition-all">
              <div className="flex items-center justify-center space-x-2 text-[#A1A1AA] text-xs uppercase tracking-wider mb-2">
                <Heart className="w-4 h-4 text-[#B69CFF] fill-[#B69CFF]/20" />
                <span>Total Likes</span>
              </div>
              <div className="font-editorial text-3xl sm:text-4xl font-bold text-white">
                {totalLikesCount}
              </div>
              <div className="text-[11px] text-[#A1A1AA] mt-1">Appreciations shared</div>
            </div>

            {/* Network / Standard */}
            <div className="col-span-2 sm:col-span-1 p-6 rounded-2xl bg-[#20202A]/70 border border-white/5 backdrop-blur-md hover:border-[#B69CFF]/30 transition-all">
              <div className="flex items-center justify-center space-x-2 text-[#A1A1AA] text-xs uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-[#B69CFF]" />
                <span>Architecture</span>
              </div>
              <div className="font-editorial text-2xl sm:text-3xl font-bold text-white">
                100% On-Chain
              </div>
              <div className="text-[11px] text-[#A1A1AA] mt-1">No backend • Pure Web3</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* FILTER & EXPLORE CONTROLS                                      */}
      {/* ============================================================== */}
      <section id="gallery-section" className="pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
          {/* Section Heading & View Switcher on mobile */}
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {viewMode === "my-art" ? "My Art Collection" : "Curated Exhibition"}
              </h2>
              {viewMode === "my-art" && (
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#B69CFF]/15 text-[#B69CFF] border border-[#B69CFF]/30 font-medium">
                  {filteredArtworks.length} pieces
                </span>
              )}
            </div>
            <p className="text-xs text-[#A1A1AA]">
              {viewMode === "my-art"
                ? "Manage and inspect your published on-chain creations"
                : "Explore masterworks published across the Botchain ecosystem"}
            </p>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, artist, narrative..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl bg-[#20202A] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#B69CFF] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => {
                refetchArtworks();
                refetchStats();
                addToast("info", "Refreshing", "Syncing artwork catalog from Botchain...");
              }}
              title="Refresh from blockchain"
              className="p-2.5 rounded-xl bg-[#20202A] hover:bg-[#262633] border border-white/10 text-[#A1A1AA] hover:text-white transition-all flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isArtworksRefetching ? "animate-spin text-[#B69CFF]" : ""}`} />
            </button>

            {/* Mobile View Switcher */}
            <div className="flex md:hidden items-center space-x-1 p-1 rounded-xl bg-[#20202A] border border-white/5">
              <button
                onClick={() => setViewMode("explore")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium ${
                  viewMode === "explore" ? "bg-[#B69CFF] text-[#111116]" : "text-[#A1A1AA]"
                }`}
              >
                All Art
              </button>
              <button
                onClick={() => {
                  if (!isConnected) {
                    addToast("info", "Connect Wallet", "Connect wallet to view your artwork.");
                  } else {
                    setViewMode("my-art");
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium ${
                  viewMode === "my-art" ? "bg-[#B69CFF] text-[#111116]" : "text-[#A1A1AA]"
                }`}
              >
                My Art ({myArtworkCount})
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center space-x-2 py-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] mr-2">
            <Filter className="w-3.5 h-3.5 text-[#B69CFF]" />
            <span className="font-medium">Category:</span>
          </div>
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count =
              cat === "All"
                ? artworks.length
                : artworks.filter((a) => a.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
                  isActive
                    ? "bg-[#B69CFF] text-[#111116] font-semibold shadow-glow"
                    : "bg-[#20202A] text-[#A1A1AA] hover:text-white hover:bg-[#262633] border border-white/5"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-[#111116]/30 text-[#111116]" : "bg-white/5 text-[#A1A1AA]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* ARTWORK GALLERY (Masonry Layout)                               */}
      {/* ============================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {isArtworksLoading && artworks.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-10 h-10 text-[#B69CFF] animate-spin mb-4" />
            <p className="text-white font-editorial text-lg">Curating Gallery from Botchain...</p>
            <p className="text-xs text-[#A1A1AA] mt-1">Reading contract state and artwork manifests.</p>
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto p-8 rounded-2xl bg-[#20202A]/50 border border-white/5 backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-[#B69CFF]/10 text-[#B69CFF] flex items-center justify-center mx-auto mb-4 border border-[#B69CFF]/20">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-white mb-2">
              {viewMode === "my-art" ? "No Artwork Published Yet" : "No Artworks Found"}
            </h3>
            <p className="text-xs text-[#A1A1AA] mb-6 leading-relaxed">
              {viewMode === "my-art"
                ? "You haven't published any artwork with this wallet yet. Be the first to share your creative expression on Botchain!"
                : searchQuery
                ? `No artworks matched "${searchQuery}". Try a different search term or category.`
                : "The exhibition awaits its pioneer. Be the first artist to publish a piece!"}
            </p>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-[#B69CFF] text-[#111116] font-semibold text-xs shadow-glow hover:bg-[#CEBDFF] transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Publish First Artwork</span>
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {filteredArtworks.map((art) => {
              const isAuthor = address && art.author.toLowerCase() === address.toLowerCase();

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtwork(art)}
                  className="break-inside-avoid mb-6 rounded-2xl bg-[#20202A] border border-white/5 overflow-hidden group cursor-pointer purple-glow-hover transition-all duration-300"
                >
                  {/* Artwork Image Container */}
                  <div className="relative w-full overflow-hidden bg-[#171720]">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      loading="lazy"
                      onError={(e) => {
                        // Graceful fallback to stylish generative gradient card if external image 404s
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=75";
                      }}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111116] via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#111116]/80 text-[#CEBDFF] border border-white/10 backdrop-blur-md">
                        {art.category}
                      </span>
                    </div>

                    {/* Author Badge if mine */}
                    {isAuthor && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#B69CFF] text-[#111116] shadow-glow">
                          My Artwork
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Artwork Card Metadata */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-editorial text-lg font-bold text-white group-hover:text-[#B69CFF] transition-colors line-clamp-1 mb-1.5">
                      {art.title}
                    </h3>

                    {/* Narrative snippet */}
                    {art.description && (
                      <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-4 leading-relaxed font-normal">
                        {art.description}
                      </p>
                    )}

                    {/* Card Footer: Author & Like Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      {/* Author Info */}
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#B69CFF] to-[#906CFA] flex items-center justify-center text-[9px] font-bold text-[#111116]">
                          {art.author.substring(2, 4).toUpperCase()}
                        </div>
                        <span className="text-xs text-[#A1A1AA] font-mono">
                          {formatAddress(art.author)}
                        </span>
                      </div>

                      {/* Like Action */}
                      <button
                        onClick={(e) => handleToggleLike(art, e)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all text-xs ${
                          art.isLikedByMe
                            ? "bg-[#B69CFF]/15 text-[#B69CFF] border border-[#B69CFF]/30"
                            : "bg-white/5 text-[#A1A1AA] hover:text-white hover:bg-white/10"
                        }`}
                        title={art.isLikedByMe ? "Unlike artwork" : "Like artwork"}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                            art.isLikedByMe ? "fill-[#B69CFF] text-[#B69CFF]" : ""
                          }`}
                        />
                        <span className="font-medium text-xs">{art.likesCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* ARTWORK DETAILS MODAL                                          */}
      {/* ============================================================== */}
      {selectedArtwork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedArtwork(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#20202A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedArtwork(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#111116]/80 text-[#A1A1AA] hover:text-white border border-white/10 backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left: Artwork Large Preview */}
            <div className="w-full md:w-3/5 bg-[#171720] flex items-center justify-center relative overflow-hidden min-h-[300px] md:min-h-[500px]">
              <img
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh]"
              />
            </div>

            {/* Right: Artwork Details & Actions */}
            <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
              <div>
                {/* Category & Date badge */}
                <div className="flex items-center space-x-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#B69CFF]/15 text-[#B69CFF] border border-[#B69CFF]/30">
                    {selectedArtwork.category}
                  </span>
                  <span className="text-xs text-[#A1A1AA]">
                    {formatTime(selectedArtwork.timestamp)}
                  </span>
                </div>

                {/* Title */}
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                  {selectedArtwork.title}
                </h2>

                {/* Narrative / Description */}
                <div className="mb-6">
                  <h4 className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold mb-2">
                    Artist Statement
                  </h4>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">
                    {selectedArtwork.description || "The artist left this creation to speak for itself without narrative commentary."}
                  </p>
                </div>

                {/* Artist Information */}
                <div className="p-4 rounded-xl bg-[#171720] border border-white/5 mb-6">
                  <h4 className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-semibold mb-2">
                    Creator Address
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#B69CFF] to-[#906CFA] flex items-center justify-center text-xs font-bold text-[#111116]">
                        {selectedArtwork.author.substring(2, 4).toUpperCase()}
                      </div>
                      <span className="font-mono text-xs text-white">
                        {formatAddress(selectedArtwork.author)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyToClipboard(selectedArtwork.author)}
                        className="p-1.5 rounded-lg bg-[#20202A] text-[#A1A1AA] hover:text-white transition-colors"
                        title="Copy Address"
                      >
                        {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://scan.bohr.life/address/${selectedArtwork.author}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[#20202A] text-[#A1A1AA] hover:text-white transition-colors"
                        title="View on Botchain Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                {/* Like Button */}
                <button
                  onClick={() => handleToggleLike(selectedArtwork)}
                  className={`w-full py-3 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold transition-all ${
                    selectedArtwork.isLikedByMe
                      ? "bg-[#B69CFF]/20 text-[#B69CFF] border border-[#B69CFF]/40 shadow-glow"
                      : "bg-[#B69CFF] hover:bg-[#CEBDFF] text-[#111116] shadow-glow"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${selectedArtwork.isLikedByMe ? "fill-[#B69CFF] text-[#B69CFF]" : "text-[#111116]"}`}
                  />
                  <span>
                    {selectedArtwork.isLikedByMe ? "Appreciated" : "Appreciate Artwork"} ({selectedArtwork.likesCount})
                  </span>
                </button>

                {/* Remove button if author */}
                {address && selectedArtwork.author.toLowerCase() === address.toLowerCase() && (
                  <button
                    onClick={() => handleRemoveArtwork(selectedArtwork)}
                    className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove My Artwork from Blockchain</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PUBLISH ARTWORK MODAL                                          */}
      {/* ============================================================== */}
      {isPublishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsPublishModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#20202A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div>
                <h3 className="font-editorial text-2xl font-bold text-white">
                  Publish to Artfolio
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Immortalize your original artwork on Botchain Testnet (Chain ID 968)
                </p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="p-2 rounded-full bg-[#171720] text-[#A1A1AA] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Curated Presets Bar (Instant 1-click test) */}
            <div className="py-4 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-semibold block mb-2">
                Quick Inspiration / Demo Presets (Click to autofill):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CURATED_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-[#171720] hover:bg-[#B69CFF]/15 hover:text-[#B69CFF] border border-white/5 text-[#A1A1AA] transition-colors"
                  >
                    ✨ {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handlePublish} className="space-y-4 pt-4">
              {/* Title & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Artwork Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Ethereal Genesis #01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171720] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#B69CFF] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171720] border border-white/10 text-white text-xs focus:outline-none focus:border-[#B69CFF] transition-all"
                  >
                    <option value="Digital Art">Digital Art</option>
                    <option value="Photography">Photography</option>
                    <option value="Illustration">Illustration</option>
                    <option value="Abstract">Abstract</option>
                    <option value="3D Art">3D Art</option>
                  </select>
                </div>
              </div>

              {/* Image URL input & Live preview box */}
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Direct Image URL (HTTPS) *
                </label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => {
                    setFormImageUrl(e.target.value);
                    setImagePreviewError(false);
                  }}
                  placeholder="https://images.unsplash.com/... or https://ipfs.io/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171720] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#B69CFF] transition-all"
                />
              </div>

              {/* Live Preview Box */}
              {formImageUrl && (
                <div className="p-3 rounded-xl bg-[#171720] border border-white/5 flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      onError={() => setImagePreviewError(true)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs">
                    <span className="text-white font-medium block">
                      {imagePreviewError ? "⚠️ Image failed to load" : "✓ Preview Loaded Successfully"}
                    </span>
                    <span className="text-[#A1A1AA] text-[11px]">
                      {imagePreviewError
                        ? "Verify URL is directly accessible"
                        : "Ready for on-chain broadcast"}
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Artwork Narrative & Artist Statement
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the medium, inspiration, concept, or emotional theme..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171720] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#B69CFF] transition-all resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pendingAction === "publish"}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B69CFF] to-[#906CFA] text-[#111116] font-semibold text-xs tracking-wide shadow-glow hover:shadow-glow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {pendingAction === "publish" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#111116]" />
                      <span>Broadcasting to Botchain...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      <span>Publish to Blockchain</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOAST NOTIFICATION CONTAINER                                   */}
      {/* ============================================================== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start space-x-3 transition-all animate-fadeIn ${
              t.type === "success"
                ? "bg-[#20202A]/95 border-emerald-500/40 text-emerald-200"
                : t.type === "error"
                ? "bg-[#20202A]/95 border-red-500/40 text-red-200"
                : t.type === "loading"
                ? "bg-[#20202A]/95 border-[#B69CFF]/40 text-[#CEBDFF]"
                : "bg-[#20202A]/95 border-white/15 text-white"
            }`}
          >
            {/* Status Icon */}
            <div className="pt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
              {t.type === "loading" && <Loader2 className="w-5 h-5 text-[#B69CFF] animate-spin" />}
              {t.type === "info" && <Sparkles className="w-5 h-5 text-[#B69CFF]" />}
            </div>

            {/* Message Body */}
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-white">{t.title}</h4>
              {t.message && <p className="text-[11px] text-[#A1A1AA] mt-0.5 leading-relaxed">{t.message}</p>}
              {t.txHash && (
                <a
                  href={`https://scan.bohr.life/tx/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center space-x-1 text-[10px] text-[#B69CFF] hover:underline"
                >
                  <span>View on Botchain Scan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Close toast */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#A1A1AA] hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#A1A1AA]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-editorial text-base font-bold text-white">Artfolio</span>
            <span className="text-[11px] text-[#A1A1AA]">· Your Art. Your Space.</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <span>Network: Botchain (968)</span>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Explorer
            </a>
            <a
              href="https://rpc.bohr.life"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              RPC Endpoint
            </a>
          </div>
          <p className="text-[11px] text-zinc-500">
            Decentralized & Serverless · Built on Solidity
          </p>
        </div>
      </footer>
    </div>
  );
}

