import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load .env.local first, fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config();

const rawKey = process.env.PRIVATE_KEY?.trim() || "";
const PRIVATE_KEY = rawKey
  ? rawKey.startsWith("0x")
    ? rawKey
    : `0x${rawKey}`
  : undefined;

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.bohr.life";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    botchain: {
      url: RPC_URL,
      chainId: 968,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      botchain: "none",
    },
    customChains: [
      {
        network: "botchain",
        chainId: 968,
        urls: {
          apiURL: "https://scan.bohr.life/api",
          browserURL: "https://scan.bohr.life",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
