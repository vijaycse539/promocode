const Web3 = require('web3');
const {bufferToHex} = require('ethereumjs-util');
const HDWalletProvider = require('truffle-hdwallet-provider');
const TokenABI = require('./abi/ERC20');
const PromoCodeABI = require('./abi/PromoCode');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = network => providerWithMnemonic(
  process.env.MNEMONIC || '',
  `https://${network}.infura.io/v3/96bfc78effaa4a32bf99ce0dd4453132`,
);

const network = process.env.NETWORK || 'mainnet';
const provider = infuraProvider(network);
let w3 = new Web3(provider);
const amount = new w3.utils.BN('88000000000000000000');
const numberOfCode = 300;
const approveAmount = amount.mul(new w3.utils.BN(numberOfCode + 100));
let promocodeAddress = '';
if (network === 'mainnet') {
  promocodeAddress = '0x6c358729d92d442ed9afe40a8e86794e8d6a76ca';
} else {
  promocodeAddress = '0xd4cA2DeF3d3770299D6e53FF3F884F5e004675B8';
}
const tokenContractAddress = '0xd42debE4eDc92Bd5a3FBb4243e1ecCf6d63A4A5d';

let i = 1;
let code = '';
let signature = '';
let privateKey = bufferToHex(provider.wallet._privKey);
console.log('#QRcodes');
for (i; i <= numberOfCode + 1; i++) {
  code = 'C8190612' + i.toFixed(0).padStart(3, '0');
  let sign = w3.eth.accounts.sign(w3.utils.keccak256(code), privateKey);
  signature = sign.signature;
  if (i < numberOfCode) {
    let link = `URL:https://carboneum.io/p/?c=${code}&s=${signature}`;
    console.log(link);
  }
}

console.error(provider.address);
console.error('Approving contract spending...');
const token = new w3.eth.Contract(TokenABI, tokenContractAddress);
token.methods.approve(promocodeAddress, w3.utils.toHex(approveAmount)).send(
  {from: provider.address, gas: 300000}).on('transactionHash', (hash) => {
  console.error('Approving Tx:', hash);
  console.error('Testing Redeem Code...', code);
  const promoCode = new w3.eth.Contract(PromoCodeABI, promocodeAddress);
  promoCode.methods.redeem(code, signature).send(
    {from: provider.address, gas: 300000}).on('transactionHash', (redeemHash) => {
    console.error('Test Redeem Tx:', redeemHash);
    process.exit();
  }).on('confirmation', (confirmationNumber, receipt) => {
    console.error('confirmation2');
  }).on('receipt', (receipt) => {
  }).on('error', console.error);
}).on('confirmation', (confirmationNumber, receipt) => {
  console.error('confirmation1');
}).on('receipt', (receipt) => {
  console.error('receipt1');
}).on('error', console.error);
