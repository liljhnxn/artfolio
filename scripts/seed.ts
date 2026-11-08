import hre from "hardhat";
const { ethers } = hre;

const SEED_ARTWORKS = [
  {
    title: "Cosmic Odyssey",
    category: "Digital Art",
    description: "An ethereal voyage navigating iridescent nebulae, spectral auroras, and stellar tides in deep hyperspace.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Chrono Dimension",
    category: "3D Art",
    description: "A procedural kinetic sculpture warping liquid glass, chrome tendrils, and gravitic pulses in hyper-dimensional space.",
    imageUrl: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&w=1200&q=80",
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
    description: "Neon reflections shimmer across wet asphalt as synthwave drones hum into the midnight metropolis.",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
  },
];

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xf81752A6A51Cb68bbfD5911b4b06eF5F81BA0700";
  console.log(`Connecting to Artfolio at: ${contractAddress}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Signer address: ${deployer.address}`);

  const Artfolio = await ethers.getContractFactory("Artfolio");
  const artfolio = Artfolio.attach(contractAddress);

  for (let i = 0; i < SEED_ARTWORKS.length; i++) {
    const art = SEED_ARTWORKS[i];
    console.log(`Publishing: "${art.title}" (${art.category})...`);
    const tx = await (artfolio as any).publishArtwork(
      art.title,
      art.description,
      art.imageUrl,
      art.category
    );
    await tx.wait();
    console.log(`Published piece #${i + 1} (tx: ${tx.hash})`);
  }

  // Like first piece
  console.log("Appreciating piece #1...");
  try {
    const likeTx = await (artfolio as any).likeArtwork(1);
    await likeTx.wait();
    console.log("Liked piece #1");
  } catch (err: any) {
    console.log("Already liked or skipped:", err?.message);
  }

  const [active, likes] = await (artfolio as any).getPlatformStats();
  console.log("-----------------------------------------");
  console.log(`Platform stats: ${active} active artworks, ${likes} total likes`);
  console.log("Seeding complete! Refresh your browser at http://localhost:3000 to see the live gallery.");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exitCode = 1;
});
