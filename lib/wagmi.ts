import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { botchain } from "./chain";

export const config = createConfig({
  chains: [botchain],
  connectors: [
    injected(),
  ],
  transports: {
    [botchain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.bohr.life"),
  },
  ssr: true,
});
