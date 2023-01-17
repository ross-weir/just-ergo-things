# Stealth addresses on Ergo

In this article we will go over stealth addresses on the [Ergo blockchain](https://ergoplatform.org/en/), why to use them, what they are and their potential implementation. Discussions are still in progress on discord and the [EIP-41 pull request on GitHub](https://github.com/ergoplatform/eips/pull/87) so it is possible the implementation explained here becomes out-dated but as things currently stand we seem close to reaching a census.

The implementation of stealth addresses for Ergo originated from a discussion between `kushti` and `scalahub` on the forums, [check it out here](https://www.ergoforum.org/t/stealth-address-contract/255).

### What is a stealth address?

Stealth addresses allow making transactions that preserve privacy. By default, all payments made on Ergo (and most other blockchains like Bitcoin) are visible to anyone viewing the ledger so if someone knows your public address they can track all payments you receive. There are blockchains such as Monero where all transactions are performed in such a way where privacy is preserved by default with no way to opt-out, Ergos ethos is to put the choice in the hands of users of the network.

[Ergo Manifesto](https://ergoplatform.org/en/blog/2021-04-26-the-ergo-manifesto/):

> Privacy is the ability to create barriers and erect boundaries to create a space for the individual. It is up to each what borders and boundaries they choose to make.

### What are some potential use-cases for stealth addresses on Ergo?

EIP-41 stealth addresses allow users to receive payments privately without people monitoring the ledger being able to link payments to a users public address. Their non-interactive nature means users can share their stealth addresses freely and receive payments with no further action required.

To demonstrate this with an example:

1. Bob posts his stealth address in his Twitter bio
2. Alice wishes to donate to Bob so she sends some ERG to the stealth address Bob posted publicly
3. Nobody can link any payment made to Bob

Given the above, stealth addresses are good for things like fund raising, crowdfunding, donations, etc.

### How do stealth addresses differ to existing solutions like ErgoMixer?

As mentioned stealth addresses are intended to hide the receipt of a payment, this is different to mixing services that **obfuscate** payments.

Take our example from the previous section, using a mixer everyone would still be able to see that Bob received a payment but they would not be able to determine the origins of the payment.

Both of these privacy options have their own unique use-cases!

### How do they work?

The solution is based on non-interactive Diffie Hellman key exchange and goes like this:

1. Bob generates a public address to share, nothing special here this is just like a normal P2PK address (we're currently in talks to add a new P2PA pay-to-public-app address type as part of the EIP so stealth addresses can be handled seamlessly in wallets)

2. Alice uses the publicly shared address to create random values that are used in the smart contract to protect the funds for Bob and can also be used by Bob to check if the box is spendable by the secret key associated with his public address. Something like this:

```js
const g = this.ec.g;
const u = bobsPublicAddress;
const r = new BN(rand(32));
const y = new BN(rand(32));
const r4 = g.mul(r);
const r5 = g.mul(y);
const r6 = u.mul(r);
const r7 = u.mul(y);
```

`r4..7` are values used in the smart contract to protect the funds, these values are derived from `bobsPublicAddress` but cannot be linked to it. The smart contract currently proposed looks like the following:

```scala
{
    // ===== Contract Information ===== //
    // Name: EIP-0041 Stealth address contract
    // Version: 1.0.0
    val gr = SELF.R4[GroupElement].get
    val gy = SELF.R5[GroupElement].get
    val ur = SELF.R6[GroupElement].get
    val uy = SELF.R7[GroupElement].get

    proveDHTuple(gr,gy,ur,uy)
}
```

3. Bobs wallet will monitor the stealth contract address for funds that are spendable by the secret key associated with his public address, boxes can be checked like so:

```js
const gr = BOX.r4
const gy = BOX.r5
const ur = BOX.r6
const uy = BOX.r7
const bobsSecret = publicAddress.secretKey

const boxIsSpendable = ur.eq(gr.mul(bobsSecret)) && uy.eq(gy.mul(bobsSecret))
```

And that's pretty much it! I created a flow chart as well to try and help visualize the process:

![flowchart](https://github.com/ross-weir/just-ergo-things/blob/main/stealth-addresses/img/stealth-address-flowchart.jpg)

### Full code example

I also have a [full code example here](https://github.com/ross-weir/ergo-stealth-address-example) that runs real scenarios from either the perspective of the sender or the receiver if you want to play with some code.

Thanks for reading.
