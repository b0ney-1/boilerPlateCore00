# Lending dApp on the Core Network

## Contract Deployment

- Clone the repo by running `git clone https://github.com/b0ney-1/boilerPlateCore00.git`
- Navigate into the folder using `cd boilerPlateCore00`
- Install dependencies by running `npm install`
- Place your Private Key inside the **.env** file
- Run `npx hardhat compile` to compile
- Run `npx hardhat ignition deploy ./ignition/modules/deploy.js --network core_testnet`to deploy
- Copy the addresses of **DAPP, USD and BTC** Contracts from Terminal and paste them in the **.env** file present inside _./interface/.env_

## Frontend Setup

- Navigate to react app by running `cd interface`
- Install dependencies using `npm install`
- Copy the .json files containing the ABI from _./artifacts/contracts_. You'll need to copy the following json files from their respective folders
  - Bitcoin.json
  - CoreLoanPlatform.json
  - IERC20.json
  - USD.json
- Run the frontend using `npm  start`
