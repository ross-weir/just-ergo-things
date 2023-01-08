```
npm i @ergoplatform/ergo-lib-wasm
```

Create a JS file that will contain our code:

```
touch index.js
```

### Outline what we are doing

- We have txid `t` that we want to verify is included in the blockchain
- We have the headerid `h` that we also need to verify is included in the blockchain
- We get NIPoPoW proofs for the inclusion of `h` from a set of full node peers
- We select the best proof (describe how this is chosen)
- We then check the transaction root merkle tree for the inclusion of `t`
