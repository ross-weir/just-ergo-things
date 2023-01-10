const { default: axios } = require("axios");
const {
  NipopowVerifier,
  BlockId,
  MerkleProof,
  BlockHeader,
  NipopowProof,
} = require("@ergoplatform/ergo-lib-wasm");

// Ergo mainnet genesis block id, used to verify nipopows
const GENESIS = BlockId.fromHex(
  "b0244dfc267baca974a4caee06120321562784303a8a688976ae56170e4d175b"
);
// Id of the transaction we are verifying
const TX_ID =
  "258ddfc09b94b8313bca724de44a0d74010cab26de379be845713cc129546b78";
// Id of the block that contains the transaction
const HEADER_ID = BlockId.fromHex(
  "d1366f762e46b7885496aaab0c42ec2950b0422d48aec3b91f45d4d0cdeb41e5"
);

const K_PARAM = 6;
const M_PARAM = 5;

// Retrieve a NIPoWPoW from the provided nodeUrl.
async function getNipopowFromNode(nodeUrl) {
  const { data } = await axios.get(
    `${nodeUrl}/nipopow/proof/${M_PARAM}/${K_PARAM}/${HEADER_ID.toHex()}`
  );

  // Temporary JSON replacer function until bug fix is released in upstream `sigma-rust`.
  // There's currently an issue with scientific notion numbers.
  const proofStr = JSON.stringify(data, (key, val) => {
    if (key === "d") {
      return BigInt(val).toString();
    }

    return val;
  });

  return NipopowProof.fromJSON(proofStr);
}

async function main() {
  console.log(`SPV checking for existence of transaction: ${TX_ID}`);

  // gather a list of nipopows from peer full nodes
  const nipopows = await Promise.all([
    getNipopowFromNode("http://159.65.11.55:9053"),
    getNipopowFromNode("http://213.239.193.208:9053"),
  ]);

  console.log(`obtained ${nipopows.length} proofs`);

  // The verifier needs the genesis block id due to the way the underlying interlink data structure works
  const nipopowVerifier = new NipopowVerifier(GENESIS);

  nipopows.forEach((proof) => nipopowVerifier.process(proof));

  const bestProof = nipopowVerifier.bestProof;

  if (!bestProof) {
    throw new Error("verifier couldn't determine the best proof!");
  }

  if (!bestProof.suffixHead.id.isEqual(HEADER_ID)) {
    throw new Error("invalid proof!");
  }

  const extraNodeUrl = "http://198.58.96.195:9053";

  const { data: blockHeaderJSON } = await axios.get(
    `${extraNodeUrl}/blocks/${HEADER_ID.toHex()}/header`
  );

  const { data: merkleProofJSON } = await axios.get(
    `${extraNodeUrl}/blocks/${HEADER_ID.toHex()}/proofFor/${TX_ID}`
  );

  if (!merkleProofJSON) {
    throw new Error(`failed to get merkle proof for TX ${TX_ID}`);
  }

  const merkleProof = MerkleProof.fromJSON(JSON.stringify(merkleProofJSON));
  const blockHeader = BlockHeader.fromJSON(JSON.stringify(blockHeaderJSON));

  if (!merkleProof.isValid(blockHeader.txRoot)) {
    throw new Error("merkle proof was invalid!");
  }

  console.log(
    `SPV complete, TX ${TX_ID} was included in block ${HEADER_ID.toHex()}!`
  );
}

main();
