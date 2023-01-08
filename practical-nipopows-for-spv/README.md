# Practical application of NIPoPoWs for SPV on Ergo

In this article we will go over the steps involved to perform Simple Payment Verification (SPV) of a transaction utilizing Non-Interactive Proof of Proof of Work (NIPoPoWs) on the Ergo blockchain. This article is intended for developers who might be wanting to use SPV in their applications, it provides working code samples and aims to go into some level of depth when explaining the concepts and to be a middle-ground between high level explanations and published formal papers on the subject.

I will provide useful links at the end if you want to do additional research.

### What is SPV? Why use it?

SPV is a way of confirming some transaction occurred on the blockchain without needing to download the entire blockchain.

Aside from SPV there are 2 main ways of checking the inclusion of a transaction:

1. Running a full node and verifying the blockchain ourself - very secure but not succinct, verifying the entire blockchain can be costly on network & storage resources.
2. Checking with a 3rd party indexer/explorer service - very succinct but not secure, we put all our trust in the 3rd party being an honest actor.

SPV aims to be succinct and secure providing a good balance between the alternatives mentioned previously.

### How do NIPoPoWs fit into the picture?

SPV depends on a field in the block header called `transactionRoot`, because of this, a precondition for performing SPV is verifying the block exists in the blockchain. This is where NIPoPoWs come in. Assuming at least 51% of the nodes on the network are honest we can use NIPoPoWs to verify a block has been included in the blockchain without needing to download the entire chain. Like SPV, NIPoPoWs provide a succinct and secure way to verify a property of the blockchain, in this case, block inclusion.

Traditionally in other blockchains like bitcoin, SPV clients would still need to download block headers to verify transactions. NIPoPoWs enable ultra light SPV clients as we no longer need to synchronize block headers. Full nodes provide proof that we verify - no need for us to maintain a header chain resulting in even less resource usage.

> 💬 `transactionRoot` is a Merkle Tree root containing the hashes of all transactions in the block. Merkle trees are a compact way to store a set of hashes and later check if a hash is included in the tree.

### What are we going to do?

To showcase the above we are going to use SPV (via NIPoPoWs) to check if transaction [`258ddfc09b94b8313bca724de44a0d74010cab26de379be845713cc129546b78`](https://explorer.ergoplatform.com/en/transactions/258ddfc09b94b8313bca724de44a0d74010cab26de379be845713cc129546b78) in block with header id [`d1366f762e46b7885496aaab0c42ec2950b0422d48aec3b91f45d4d0cdeb41e5`](https://explorer.ergoplatform.com/en/blocks/d1366f762e46b7885496aaab0c42ec2950b0422d48aec3b91f45d4d0cdeb41e5) has indeed been included in the blockchain. These values have been chosen at random for the purpose of this article.

The steps we will need to take are the following:

1. Gather NIPoPoWs from peer nodes
2. Determine the best proof (more on this later)
3. Check that the best proof contains our block of interest
4. Obtain a Merkle Proof that the block includes the transaction from a peer node
5. Verify the Merkle Proof thus verifying our transaction exists

### Lets get started

For this example we are going to be using nodejs/JavaScript so lets get the project setup by initializing an NPM project and installing dependencies:

```sh
mkdir spv-nipopow-example && cd spv-nipopow-example
npm init
npm i @ergoplatform/ergo-lib-wasm axios
touch index.js
```

And add some boilerplate code:

```js
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

const K_PARAM = 7;
const M_PARAM = 6;

async function main() {}

main();
```

**What are the extra `k` and `m`  parameters?**

`K_PARAM`: TODO
`M_PARAM`: TODO

#### Gather NIPoPoW proofs from peer nodes

In a real application an SPV client might build up a list of full node peers to request NIPoPoWs from, this is out of scope for this article so instead we will use a list of known peers.

The more full node peers we use the higher the chance we will find at least 1 honest node but this will also lead to increased network load, applications will need to find a balance between these factors.

NIPoPoWs are currently provided by peers via REST API so lets write a function that will take a nodes REST API url and return a NiPoPoW:

```js
async function getNipopowFromNode(nodeUrl) {
  const { data } = await axios.get(`${nodeUrl}/nipopow/proof/${M_PARAM}/${K_PARAM}/${HEADER_ID}`);

  return data;
}
```

Now lets call this function on a bunch of peers to obtain some NiPoPoWs:

```js
async function main() {
  // gather a list of nipopows from peer full nodes
  // we will only use 2 nodes to keep the example simple, real applications would use a bigger list.
  const nipopows = await Promise.all([
    getNipopowFromNode("http://159.65.11.55:9053"),
    getNipopowFromNode("http://213.239.193.208:9053"),
  ]);
}
```

#### Determine the best proof

We will now process the proofs provided by the peer nodes and determine which proof is the best.

The exact detail on how we determine the best proof is out of scope for this article but the tl;dr is we assign a score to each proof based on the `m` parameter, due to the way proofs are produced and verified honest node proofs will always achieve a higher score.

Lets create a verifier and process the proofs:

```js
const nipopowVerifier = new NiPoPoWVerifier(GENESIS);

nipopows.forEach((proof) => nipopowVerifier.process(proof));
```

#### Check that the best proof contains our block of interest

#### Obtain a Merkle Proof for block

#### Verify the Merkle Proof
