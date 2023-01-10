const { default: axios } = require("axios");
const { NiPoPoWVerifier, BlockId } = require("@ergoplatform/ergo-lib-wasm");

// Ergo mainnet genesis block id, used to verify nipopows
const GENESIS = BlockId.fromHex(
  "b0244dfc267baca974a4caee06120321562784303a8a688976ae56170e4d175b"
);
// Id of the transaction we are verifying
const TX_ID =
  "258ddfc09b94b8313bca724de44a0d74010cab26de379be845713cc129546b78";
// Id of the block that contains the transaction
const HEADER_ID =
  "d1366f762e46b7885496aaab0c42ec2950b0422d48aec3b91f45d4d0cdeb41e5";

const K_PARAM = 6;
const M_PARAM = 5;

// Retrieve a NIPoWPoW from the provided nodeUrl.
async function getNipopowFromNode(nodeUrl) {
  const { data } = await axios.get(
    `${nodeUrl}/nipopow/proof/${M_PARAM}/${K_PARAM}/${HEADER_ID}`
  );

  return data;
}

async function main() {
  // gather a list of nipopows from peer full nodes
  const nipopows = await Promise.all([
    getNipopowFromNode("http://159.65.11.55:9053"),
    getNipopowFromNode("http://213.239.193.208:9053"),
  ]);
  // The verifier needs the genesis block id due to the way the underlying interlink data structure works
  const nipopowVerifier = new NiPoPoWVerifier(GENESIS);

  nipopows.forEach((proof) => nipopowVerifier.process(proof));

  const bestProof = nipopowVerifier.bestProof;

  if (!bestProof) {
    throw new Error("verifier couldn't determine the best proof!");
  }
}

main();
