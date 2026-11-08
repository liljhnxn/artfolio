# Artfolio

> **Your Art. Your Space.**
> A decentralized digital art-sharing platform where creators publish original artwork, discover creative works, and appreciate fellow artists on Botchain Testnet.

---

## 🌟 Overview

**Artfolio** is a Web3 digital art exhibition designed with a gallery aesthetic. It connects directly to the **Botchain Testnet** via Solidity smart contracts and wagmi/viem, storing all artwork records, artist attribution, timestamps, and appreciation likes natively on-chain without any centralized database or backend.

- **Single Webpage Architecture**: Fluid, responsive exhibition interface in Next.js App Router.
- **Single Smart Contract**: All business logic and storage housed in `Artfolio.sol`.
- **Pure Web3**: Direct wallet integration (MetaMask & Injected Web3).
- **Zero Tokens or NFTs**: Focused purely on creative showcase and artist appreciation.

---

## 🎨 Design Philosophy & Aesthetic

- **Background**: `#111116` (Obsidian gallery darkroom)
- **Cards & Panels**: `#20202A` (Charcoal frames with subtle border luminescence)
- **Primary Accent**: `#B69CFF` (Lavender glow)
- **Text**: `#FFFFFF` (High contrast pure white)
- **Secondary Text**: `#A1A1AA` (Muted silver metadata)
- **Editorial Typography**: Elegant serif headers paired with clean sans-serif data lines.
- **Masonry Layout**: Organic grid flow adapting to different artwork aspect ratios.

---

## 🔗 Botchain Testnet Details

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Botchain Testnet |
| **Chain ID** | `968` |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Block Explorer** | [https://scan.bohr.life](https://scan.bohr.life) |
| **Native Currency** | Bohr (`BOHR` / `BOTC`, 18 decimals) |

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router, Single Page)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Blockchain Hooks**: [wagmi v2](https://wagmi.sh/) & [viem](https://viem.sh/)
- **Wallet Support**: MetaMask & Web3 Injected Wallets
- **Icons**: Lucide Icons
- **Smart Contract Toolchain**: Solidity `^0.8.20`, Hardhat, Ethers.js v6

---

## 📜 Smart Contract: `Artfolio.sol`

The contract implements:
1. `publishArtwork(string title, string description, string imageUrl, string category)`: Publishes new artwork with author timestamping.
2. `likeArtwork(uint256 id)`: Increments appreciation counter; prevents duplicate likes from the same wallet.
3. `unlikeArtwork(uint256 id)`: Decrements appreciation counter if previously liked.
4. `removeArtwork(uint256 id)`: Soft-deletes artwork; restricted exclusively to the original author.
5. `getAllArtworks()`: Returns all active artworks in reverse-chronological order.
6. `getArtworksByAuthor(address author)`: Retrieves active artworks created by a specific wallet.
7. `getPlatformStats()`: Returns live platform-wide metrics (total active artworks, total platform likes, total ever created).
8. Events emitted:
   - `ArtworkPublished(uint256 indexed id, address indexed author, string title, string category, uint256 timestamp)`
   - `ArtworkLiked(uint256 indexed id, address indexed user)`
   - `ArtworkUnliked(uint256 indexed id, address indexed user)`
   - `ArtworkRemoved(uint256 indexed id, address indexed author)`

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [MetaMask](https://metamask.io/) browser extension configured with Botchain Testnet.

### 2. Installation
```bash
git clone <repo-url>
cd Artfolio
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Set your configuration variables:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=968
NEXT_PUBLIC_RPC_URL=https://rpc.bohr.life
NEXT_PUBLIC_EXPLORER_URL=https://scan.bohr.life

# Optional: Required only for deploying the smart contract via Hardhat
PRIVATE_KEY=your_private_key_here
```

---

## 🧪 Testing the Smart Contract

Run the comprehensive Hardhat test suite:
```bash
npm run test
```

Tests verify:
- Initial state verification.
- Publishing artworks with title, category, description, and direct image URL validation.
- Artwork retrieval in newest-first order.
- Filtering by author.
- Liking and duplicate like prevention from the same wallet.
- Unliking with state decrement.
- Author-only artwork removal and unauthorized removal rejection.
- Accurate total active artwork and total platform like metrics.
- Emission of all required events.

---

## 🚢 Deploying to Botchain Testnet

1. Ensure your deployer account has testnet native tokens on Botchain (`Chain ID: 968`).
2. Add your deployer private key to `.env.local` or `.env`:
   ```env
   PRIVATE_KEY=0x...
   ```
3. Run the deployment script:
   ```bash
   npm run deploy:botchain
   ```
4. Copy the deployed contract address output by the console and paste it into `.env.local`:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   ```
5. *(Optional)* You can also configure or update the contract address directly inside the application UI by clicking the settings slider icon in the top navigation bar.

---

## 💻 Running the Web Application

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Build for production:
```bash
npm run build
npm run start
```

---

## 🎯 Features Walkthrough

- **Hero & Live Counters**: Real-time counter of total artworks and likes published to Botchain.
- **Publish Artwork Modal**:
  - Direct image URL preview with validation.
  - Curated 1-click inspiration presets for immediate testing.
  - Category selector: *Digital Art, Photography, Illustration, Abstract, 3D Art*.
- **Category Filter Pills**: Real-time filtering by category and live artwork count badges.
- **Masonry Gallery**: Responsive cards with hover zoom effects, author badges, and like buttons.
- **Artwork Details Modal**: Fullscreen preview, author address copy, explorer link, full artist statement, like/unlike toggle, and author deletion control.
- **My Artwork Tab**: View and manage artworks created by your connected wallet.
- **Toast Notifications**: Feedback for transaction signing, block confirmation, and direct links to the Botchain block explorer.

---

## 📄 License
MIT License. Built for creators and art appreciators worldwide.

